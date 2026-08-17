"""
schemas.py
==========
Pydantic models defining the request/response contracts for every API
endpoint. Keeping these in one module gives the frontend (and future
consumers) a single, predictable source of truth for payload shapes.
"""

from enum import Enum
from typing import List, Optional, Tuple

from pydantic import BaseModel, Field


# =====================================================================
# Enums
# =====================================================================

class ObjectCategory(str, Enum):
    """High-level grouping used for aggregate statistics cards."""
    PERSON = "person"
    VEHICLE = "vehicle"
    ANIMAL = "animal"
    OBJECT = "object"


class WebcamAction(str, Enum):
    START = "start"
    STOP = "stop"


# =====================================================================
# Shared / Nested Models
# =====================================================================

class BoundingBox(BaseModel):
    """Pixel-space bounding box, top-left origin."""
    x1: float = Field(..., description="Left coordinate")
    y1: float = Field(..., description="Top coordinate")
    x2: float = Field(..., description="Right coordinate")
    y2: float = Field(..., description="Bottom coordinate")


class TrackedObject(BaseModel):
    """A single detected + tracked object in one frame."""
    track_id: int = Field(..., description="Persistent unique tracking ID")
    class_name: str = Field(..., description="COCO class name, e.g. 'person'")
    category: ObjectCategory = Field(..., description="Aggregated category for stats")
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: BoundingBox
    trail: Optional[List[Tuple[float, float]]] = Field(
        default=None, description="Recent center-point history for drawing motion trails"
    )


class FrameResult(BaseModel):
    """Detection + tracking output for a single processed frame."""
    frame_index: int
    timestamp_ms: float
    objects: List[TrackedObject]
    inference_time_ms: float
    fps: float


# =====================================================================
# Request Models
# =====================================================================

class DetectionConfig(BaseModel):
    """User-adjustable detection parameters, sent alongside uploads."""
    confidence: float = Field(0.5, ge=0.3, le=0.9, description="Detection confidence threshold")
    class_filter: Optional[List[str]] = Field(
        default=None,
        description="If provided, only these class names will be detected/returned",
    )


class WebcamControlRequest(BaseModel):
    action: WebcamAction
    confidence: float = Field(0.5, ge=0.3, le=0.9)
    class_filter: Optional[List[str]] = None


class WebcamUpdateRequest(BaseModel):
    """Sent to PATCH /detect/webcam/update to hot-swap filters mid-stream."""
    confidence: float = Field(0.5, ge=0.3, le=0.9)
    class_filter: Optional[List[str]] = Field(
        default=None,
        description="Empty list or null means detect all allowed classes",
    )


# =====================================================================
# Response Models
# =====================================================================

class ImageDetectionResponse(BaseModel):
    success: bool
    message: str
    result: FrameResult
    annotated_image_url: str
    clean_image_url: Optional[str] = None
    screenshot_id: str


class VideoDetectionResponse(BaseModel):
    success: bool
    message: str
    output_video_url: str
    total_frames: int
    total_objects_detected: int
    unique_track_ids: int
    average_fps: float
    average_inference_time_ms: float
    stats: "DetectionStats"


class WebcamControlResponse(BaseModel):
    success: bool
    message: str
    session_active: bool
    stream_endpoint: Optional[str] = None


class DetectionStats(BaseModel):
    """Aggregate statistics surfaced in the dashboard's stats cards."""
    total_objects_detected: int = 0
    person_count: int = 0
    vehicle_count: int = 0
    animal_count: int = 0
    other_count: int = 0
    average_fps: float = 0.0
    average_inference_time_ms: float = 0.0
    active_track_ids: int = 0
    session_duration_sec: float = 0.0


class StatsResponse(BaseModel):
    success: bool
    stats: DetectionStats


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


# Resolve forward reference (VideoDetectionResponse.stats -> DetectionStats)
VideoDetectionResponse.model_rebuild()
