"""
video_processor.py
===================
Orchestrates the full pipeline for a single frame or an entire video:

    frame -> Detector.predict() -> parse results -> TrailTracker.update()
          -> drawing.draw_* -> StatsService.record_frame()

This is the one module that ties detector, tracker, drawing, and stats
together, keeping each of those services independently simple/testable.
"""

import time
from pathlib import Path
from typing import List, Optional

import cv2

from app.config import get_settings
from app.models.schemas import BoundingBox, FrameResult, TrackedObject
from app.services.detector import Detector
from app.services.stats_service import StatsService
from app.services.tracker import TrailTracker, compute_center
from app.utils.drawing import draw_bounding_box, draw_fps_overlay, draw_trail
from app.utils.logger import get_logger

logger = get_logger()
settings = get_settings()


class VideoProcessor:
    """
    Stateful per-session processor. Instantiate one per webcam session
    or per video-upload job so trails/stats don't bleed across unrelated
    requests.
    """

    def __init__(self, detector: Detector, stats_service: Optional[StatsService] = None):
        self.detector = detector
        self.stats_service = stats_service
        self.trail_tracker = TrailTracker()
        self.frame_index = 0
        self._last_frame_time = time.perf_counter()

    def reset(self) -> None:
        self.detector.reset_tracker()
        self.trail_tracker.reset()
        self.frame_index = 0
        self._last_frame_time = time.perf_counter()

    def process_frame(
        self,
        frame,
        confidence: float = 0.5,
        class_filter: Optional[List[str]] = None,
        draw_overlay: bool = True,
        track: bool = True,
    ):
        """
        Run detection (+ tracking) on one frame, draw annotations, and
        return (annotated_frame, FrameResult).
        """
        annotated_frame = frame.copy() if frame is not None else frame

        try:
            results, inference_time_ms = self.detector.predict(
                annotated_frame,
                confidence=confidence,
                class_filter=class_filter,
                persist=track,
            )
        except (IndexError, Exception) as exc:
            logger.warning(f"Tracking failed on frame {self.frame_index}, falling back to predict-only: {exc}")
            results, inference_time_ms = self.detector.predict(
                annotated_frame,
                confidence=confidence,
                class_filter=class_filter,
                persist=False,
            )

        now = time.perf_counter()
        elapsed = now - self._last_frame_time
        fps = 1.0 / elapsed if elapsed > 0 else 0.0
        self._last_frame_time = now

        tracked_objects: List[TrackedObject] = []
        boxes = getattr(results, "boxes", None)

        if boxes is not None and len(boxes) > 0:
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()
            cls_ids = boxes.cls.cpu().numpy().astype(int)
            track_ids = (
                boxes.id.cpu().numpy().astype(int)
                if getattr(boxes, "id", None) is not None and boxes.id is not None
                else [-1] * len(xyxy)
            )

            for (x1, y1, x2, y2), conf, cls_id, track_id in zip(xyxy, confs, cls_ids, track_ids):
                class_name = self.detector.class_name_for_id(cls_id)
                if class_filter and len(class_filter) > 0:
                    cf_lower = {c.strip().lower() for c in class_filter}
                    if class_name.lower() not in cf_lower:
                        continue

                category = self.detector.category_for_class(class_name)
                center = compute_center(x1, y1, x2, y2)

                trail_points = (
                    self.trail_tracker.update(int(track_id), center) if track_id != -1 else [center]
                )

                obj = TrackedObject(
                    track_id=int(track_id),
                    class_name=class_name,
                    category=category,
                    confidence=float(conf),
                    bbox=BoundingBox(x1=float(x1), y1=float(y1), x2=float(x2), y2=float(y2)),
                    trail=trail_points,
                )
                tracked_objects.append(obj)

                if draw_overlay:
                    label = f"{class_name} #{track_id} {conf:.0%}" if track_id != -1 else f"{class_name} {conf:.0%}"
                    draw_bounding_box(
                        annotated_frame, int(x1), int(y1), int(x2), int(y2),
                        label=label, category=category,
                    )
                    draw_trail(annotated_frame, trail_points, category=category)

        self.trail_tracker.advance_frame()
        self.frame_index += 1

        if draw_overlay:
            draw_fps_overlay(annotated_frame, fps, inference_time_ms)

        if self.stats_service:
            self.stats_service.record_frame(tracked_objects, fps=fps, inference_time_ms=inference_time_ms)

        frame_result = FrameResult(
            frame_index=self.frame_index,
            timestamp_ms=time.time() * 1000,
            objects=tracked_objects,
            inference_time_ms=round(inference_time_ms, 2),
            fps=round(fps, 2),
        )
        return annotated_frame, frame_result

    def process_video_file(
        self,
        input_path: str,
        output_path: str,
        confidence: float = 0.5,
        class_filter: Optional[List[str]] = None,
    ) -> dict:
        """
        Process an entire video file end-to-end and write an annotated
        copy to `output_path`. Returns a summary dict of aggregate stats.
        """
        self.reset()
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {input_path}")

        fps_in = cap.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Try web-friendly codec avc1/H264 first, fallback to mp4v
        writer = None
        for codec in ["avc1", "H264", "mp4v"]:
            try:
                fourcc = cv2.VideoWriter_fourcc(*codec)
                test_writer = cv2.VideoWriter(output_path, fourcc, fps_in, (width, height))
                if test_writer.isOpened():
                    writer = test_writer
                    logger.info(f"VideoWriter initialized with codec '{codec}'")
                    break
            except Exception:
                continue

        if writer is None or not writer.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_path, fourcc, fps_in, (width, height))

        all_track_ids = set()
        total_objects = 0
        frame_count = 0
        frame_history = []

        logger.info(f"Processing video '{input_path}' ({total_frames} frames @ {fps_in:.1f}fps)")

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            annotated_frame, frame_result = self.process_frame(
                frame, confidence=confidence, class_filter=class_filter,
            )
            writer.write(annotated_frame)

            for obj in frame_result.objects:
                all_track_ids.add(obj.track_id)
                total_objects += 1

            if len(frame_result.objects) > 0:
                frame_history.append(frame_result.model_dump())

            frame_count += 1
            if frame_count % 50 == 0:
                logger.debug(f"Processed {frame_count}/{total_frames} frames")

        cap.release()
        writer.release()

        stats = self.stats_service.get_stats() if self.stats_service else None
        logger.info(f"Finished processing video -> '{output_path}' ({frame_count} frames)")

        return {
            "total_frames": frame_count,
            "total_objects_detected": total_objects,
            "unique_track_ids": len(all_track_ids),
            "average_fps": stats.average_fps if stats else 0.0,
            "average_inference_time_ms": stats.average_inference_time_ms if stats else 0.0,
            "stats": stats,
            "frame_history": frame_history,
        }
