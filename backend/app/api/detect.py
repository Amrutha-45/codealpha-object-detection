"""
api/detect.py
=============
REST endpoints for one-shot detection:
    POST /detect/image  -> single image, returns annotated image + detections
    POST /detect/video  -> full video, returns annotated video + summary stats
"""

import uuid
from pathlib import Path
from typing import List, Optional

import cv2
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.config import get_settings
from app.core.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    ModelInferenceError,
)
from app.models.schemas import ImageDetectionResponse, VideoDetectionResponse
from app.services.detector import Detector, get_detector
from app.services.stats_service import StatsService, get_stats_service
from app.services.video_processor import VideoProcessor
from app.utils.file_utils import (
    file_size_mb,
    generate_unique_filename,
    save_upload_file,
    validate_extension,
)
from app.utils.logger import get_logger

router = APIRouter(prefix="/detect", tags=["Detection"])
logger = get_logger()
settings = get_settings()


def _parse_class_filter(class_filter: Optional[str]) -> Optional[List[str]]:
    if not class_filter:
        return None
    return [c.strip() for c in class_filter.split(",") if c.strip()]


@router.post("/image", response_model=ImageDetectionResponse, status_code=status.HTTP_200_OK)
async def detect_image(
    file: UploadFile = File(..., description="Image file (jpg/jpeg/png)"),
    confidence: float = Form(0.5, ge=0.3, le=0.9),
    class_filter: Optional[str] = Form(None, description="Comma-separated class names"),
    detector: Detector = Depends(get_detector),
    stats_service: StatsService = Depends(get_stats_service),
):
    """Run detection on a single uploaded image and return an annotated copy + JSON results."""
    if not validate_extension(file.filename, settings.allowed_image_extensions_list):
        raise InvalidFileTypeError(settings.allowed_image_extensions_list)

    upload_path = await save_upload_file(file, settings.upload_dir)

    if file_size_mb(upload_path) > settings.max_upload_size_mb:
        raise FileTooLargeError(settings.max_upload_size_mb)

    try:
        frame = cv2.imread(upload_path)
        if frame is None:
            raise ModelInferenceError(detail="Could not decode uploaded image.")

        # Save clean copy for client-side dynamic overlay
        clean_id = f"clean_{uuid.uuid4().hex}.jpg"
        clean_output_path = Path(settings.screenshot_dir) / clean_id
        cv2.imwrite(str(clean_output_path), frame)

        processor = VideoProcessor(detector=detector, stats_service=stats_service)
        # If no class_filter is provided by the frontend (Detect All mode), pass None
        # so YOLO runs on all 80 COCO classes natively — do NOT fall back to
        # allowed_classes_list which would silently cap detection at 10 classes.
        target_classes = _parse_class_filter(class_filter)
        annotated_frame, frame_result = processor.process_frame(
            frame.copy(),
            confidence=confidence,
            class_filter=target_classes,
            track=False,
        )

        screenshot_id = f"{uuid.uuid4().hex}.jpg"
        output_path = Path(settings.screenshot_dir) / screenshot_id
        cv2.imwrite(str(output_path), annotated_frame)

        logger.info(f"Image detection complete: {len(frame_result.objects)} object(s) found.")

        return ImageDetectionResponse(
            success=True,
            message="Image processed successfully.",
            result=frame_result,
            annotated_image_url=f"/download/screenshot/{screenshot_id}",
            clean_image_url=f"/download/screenshot/{clean_id}",
            screenshot_id=screenshot_id,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Image detection failed")
        raise ModelInferenceError(detail=str(exc)) from exc


@router.post("/video", response_model=VideoDetectionResponse, status_code=status.HTTP_200_OK)
async def detect_video(
    file: UploadFile = File(..., description="Video file (mp4/avi/mov)"),
    confidence: float = Form(0.5, ge=0.3, le=0.9),
    class_filter: Optional[str] = Form(None, description="Comma-separated class names"),
    detector: Detector = Depends(get_detector),
    stats_service: StatsService = Depends(get_stats_service),
):
    """Process an uploaded video end-to-end with detection + tracking, return an annotated copy."""
    if not validate_extension(file.filename, settings.allowed_video_extensions_list):
        raise InvalidFileTypeError(settings.allowed_video_extensions_list)

    upload_path = await save_upload_file(file, settings.upload_dir)

    if file_size_mb(upload_path) > settings.max_upload_size_mb:
        raise FileTooLargeError(settings.max_upload_size_mb)

    try:
        output_filename = generate_unique_filename(file.filename).rsplit(".", 1)[0] + ".mp4"
        output_path = Path(settings.output_dir) / output_filename

        stats_service.reset()
        processor = VideoProcessor(detector=detector, stats_service=stats_service)

        summary = processor.process_video_file(
            input_path=upload_path,
            output_path=str(output_path),
            confidence=confidence,
            class_filter=_parse_class_filter(class_filter),
        )

        return VideoDetectionResponse(
            success=True,
            message="Video processed successfully.",
            output_video_url=f"/download/video/{output_filename}",
            total_frames=summary["total_frames"],
            total_objects_detected=summary["total_objects_detected"],
            unique_track_ids=summary["unique_track_ids"],
            average_fps=summary["average_fps"],
            average_inference_time_ms=summary["average_inference_time_ms"],
            stats=summary["stats"],
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Video detection failed")
        raise ModelInferenceError(detail=str(exc)) from exc
