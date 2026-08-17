"""
api/webcam.py
=============
REST endpoints for live webcam detection:
    POST /detect/webcam/start  -> begin a webcam session
    POST /detect/webcam/stop   -> end the current webcam session
    GET  /detect/webcam/stream -> MJPEG stream of annotated frames

A single in-process `WebcamSession` singleton is used, matching the
single-user scope of this project (see stats_service.py note).
"""

import threading
import time
from typing import List, Optional

import cv2
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.core.exceptions import WebcamError
from app.models.schemas import WebcamControlRequest, WebcamControlResponse, WebcamUpdateRequest
from app.services.detector import Detector, get_detector
from app.services.stats_service import StatsService, get_stats_service
from app.services.video_processor import VideoProcessor
from app.utils.logger import get_logger

router = APIRouter(prefix="/detect/webcam", tags=["Webcam"])
logger = get_logger()
settings = get_settings()


class WebcamSession:
    """Manages the webcam capture loop in a background thread and exposes latest annotated JPEG bytes."""

    _instance: Optional["WebcamSession"] = None

    def __init__(self):
        self.active = False
        self.capture: Optional[cv2.VideoCapture] = None
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        self.latest_jpeg: Optional[bytes] = None
        self.confidence = settings.default_confidence
        self.class_filter: Optional[List[str]] = None
        self.processor: Optional[VideoProcessor] = None

    @classmethod
    def get_instance(cls) -> "WebcamSession":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def start(self, detector: Detector, stats_service: StatsService, confidence: float, class_filter: Optional[List[str]]):
        with self.lock:
            if self.active:
                logger.info("Webcam session already active; ignoring duplicate start request.")
                return

            source = settings.webcam_source_value
            cap = None
            if isinstance(source, int):
                try:
                    cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
                    if not cap.isOpened():
                        cap.release()
                        cap = None
                except Exception:
                    cap = None

            if cap is None:
                cap = cv2.VideoCapture(source)

            if not cap.isOpened():
                raise WebcamError(detail=f"Could not open webcam source '{source}'.")

            self.capture = cap
            self.confidence = confidence
            self.class_filter = class_filter if class_filter else None
            stats_service.reset()
            self.processor = VideoProcessor(detector=detector, stats_service=stats_service)
            self.active = True

            self.thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.thread.start()
            logger.info(f"Webcam session started on source '{source}'.")

    def stop(self):
        with self.lock:
            self.active = False
            if self.capture:
                self.capture.release()
                self.capture = None
            self.latest_jpeg = None
            logger.info("Webcam session stopped.")

    def update_filters(self, confidence: float, class_filter: Optional[List[str]]) -> None:
        """Thread-safe hot-swap of detection filters while the capture loop runs."""
        with self.lock:
            self.confidence = confidence
            # None or empty list both mean "detect all allowed classes"
            self.class_filter = class_filter if class_filter else None
        logger.info(f"Webcam filters updated — confidence={confidence}, class_filter={self.class_filter}")

    def _capture_loop(self):
        logger.info("Webcam capture loop thread running.")
        consecutive_errors = 0
        while self.active and self.capture is not None:
            try:
                ok, frame = self.capture.read()
                if not ok or frame is None or frame.size == 0:
                    consecutive_errors += 1
                    if consecutive_errors % 50 == 0:
                        logger.warning("Webcam capture read returning empty frames...")
                    time.sleep(0.03)
                    continue

                consecutive_errors = 0

                with self.lock:
                    curr_conf = self.confidence
                    curr_filter = self.class_filter

                annotated_frame, _ = self.processor.process_frame(
                    frame, confidence=curr_conf, class_filter=curr_filter,
                )
                ok_enc, buffer = cv2.imencode(".jpg", annotated_frame)
                if ok_enc:
                    with self.lock:
                        self.latest_jpeg = buffer.tobytes()
            except Exception as exc:
                logger.error(f"Error in webcam capture loop frame iteration: {exc}", exc_info=True)
                time.sleep(0.05)

        logger.info("Webcam capture loop thread exiting.")

    def frame_generator(self):
        """Yield multipart MJPEG frames for the <img> tag / StreamingResponse."""
        logger.info("MJPEG stream client connected.")
        while self.active:
            with self.lock:
                frame_bytes = self.latest_jpeg
            if frame_bytes is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
                )
            time.sleep(0.03)  # ~30fps cap on streaming loop
        logger.info("MJPEG stream client disconnected.")


def get_webcam_session() -> WebcamSession:
    return WebcamSession.get_instance()


@router.post("/start", response_model=WebcamControlResponse, status_code=status.HTTP_200_OK)
async def start_webcam(
    request: WebcamControlRequest,
    detector: Detector = Depends(get_detector),
    stats_service: StatsService = Depends(get_stats_service),
    session: WebcamSession = Depends(get_webcam_session),
):
    """Start the webcam capture + detection loop."""
    session.start(
        detector=detector,
        stats_service=stats_service,
        confidence=request.confidence,
        class_filter=request.class_filter,
    )
    return WebcamControlResponse(
        success=True,
        message="Webcam session started.",
        session_active=True,
        stream_endpoint="/detect/webcam/stream",
    )


@router.post("/stop", response_model=WebcamControlResponse, status_code=status.HTTP_200_OK)
async def stop_webcam(session: WebcamSession = Depends(get_webcam_session)):
    """Stop the webcam capture + detection loop."""
    session.stop()
    return WebcamControlResponse(
        success=True,
        message="Webcam session stopped.",
        session_active=False,
    )


@router.get("/stream")
async def stream_webcam(session: WebcamSession = Depends(get_webcam_session)):
    """MJPEG stream endpoint — point an <img src="/detect/webcam/stream"> tag here."""
    if not session.active:
        raise WebcamError(message="No active webcam session.", detail="Call /detect/webcam/start first.")

    return StreamingResponse(
        session.frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.patch("/update", response_model=WebcamControlResponse, status_code=200)
async def update_webcam_filters(
    request: WebcamUpdateRequest,
    session: WebcamSession = Depends(get_webcam_session),
):
    """
    Hot-swap detection filters on a running webcam session without restarting.
    The capture loop thread picks up the new values on its very next frame.
    """
    if not session.active:
        raise WebcamError(
            message="No active webcam session.",
            detail="Start a session via /detect/webcam/start before updating filters.",
        )
    session.update_filters(
        confidence=request.confidence,
        class_filter=request.class_filter,
    )
    return WebcamControlResponse(
        success=True,
        message="Webcam filters updated successfully.",
        session_active=True,
        stream_endpoint="/detect/webcam/stream",
    )
