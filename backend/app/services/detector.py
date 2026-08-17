"""
detector.py
===========
Thin, swappable wrapper around an Ultralytics YOLOv8 model.

Design goal: the rest of the application should never import `ultralytics`
directly. Swapping yolov8n.pt -> yolov8s.pt/yolov8m.pt is a one-line
change in `.env` (MODEL_WEIGHTS_PATH) with zero code changes elsewhere.
"""

import time
from pathlib import Path
from typing import List, Optional

from ultralytics import YOLO

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger()
settings = get_settings()

# COCO classes we care about -> category bucket used for aggregate stats
CATEGORY_MAP = {
    "person": "person",
    "car": "vehicle",
    "bicycle": "vehicle",
    "bus": "vehicle",
    "truck": "vehicle",
    "dog": "animal",
    "cat": "animal",
    "bottle": "object",
    "chair": "object",
    "laptop": "object",
}


class Detector:
    """
    Loads a YOLOv8 model once and exposes a simple `.predict()` method.
    Kept stateless with respect to tracking — tracking is handled by
    `services/tracker.py` so each concern stays isolated and testable.
    """

    _instance: Optional["Detector"] = None

    def __init__(self, weights_path: Optional[str] = None, device: Optional[str] = None):
        self.weights_path = weights_path or settings.model_weights_path
        self.device = device or settings.device

        weights_file = Path(self.weights_path)
        if not weights_file.exists():
            logger.warning(
                f"Weights file '{self.weights_path}' not found locally — "
                "Ultralytics will attempt to auto-download it."
            )

        logger.info(f"Loading YOLOv8 model from '{self.weights_path}' on device '{self.device}'")
        self.model = YOLO(self.weights_path)
        self.class_names = self.model.names  # {id: name}
        logger.info(f"Model loaded successfully. {len(self.class_names)} classes available.")

    @classmethod
    def get_instance(cls) -> "Detector":
        """Singleton accessor so the (relatively heavy) model is loaded only once per process."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def predict(
        self,
        frame,
        confidence: float = 0.5,
        class_filter: Optional[List[str]] = None,
        persist: bool = False,
        tracker_config: Optional[str] = None,
    ):
        """
        Run detection (+ optional built-in tracking) on a single frame.

        Args:
            frame: BGR numpy array (OpenCV frame).
            confidence: Minimum confidence threshold (0.3–0.9).
            class_filter: Optional list of class names to restrict results to.
            persist: If True, uses Ultralytics' `.track()` with ID persistence
                     across calls (used for webcam/video streaming).
            tracker_config: Path to tracker YAML (e.g. bytetrack.yaml).

        Returns:
            Raw Ultralytics `Results` object for the single frame.
        """
        start = time.perf_counter()

        class_ids = None
        if class_filter and len(class_filter) > 0:
            name_to_id = {v.lower(): k for k, v in self.class_names.items()}
            matched = [name_to_id[c.strip().lower()] for c in class_filter if isinstance(c, str) and c.strip().lower() in name_to_id]
            class_ids = matched if len(matched) > 0 else None

        if persist:
            results = self.model.track(
                source=frame,
                conf=confidence,
                classes=class_ids,
                persist=True,
                tracker=tracker_config or settings.tracker_config_path,
                device=self.device,
                verbose=False,
            )
        else:
            results = self.model.predict(
                source=frame,
                conf=confidence,
                classes=class_ids,
                device=self.device,
                verbose=False,
            )

        inference_time_ms = (time.perf_counter() - start) * 1000
        return results[0], inference_time_ms

    def class_name_for_id(self, class_id: int) -> str:
        return self.class_names.get(class_id, "unknown")

    def reset_tracker(self):
        """Reset internal Ultralytics tracker memory so old track IDs don't bleed into new sessions.

        Strategy: set model.predictor to None so Ultralytics fully re-initializes
        the predictor (and its trackers list) on the very next .track() call.
        Simply clearing predictor.trackers = [] leaves an empty list that causes
        an IndexError when Ultralytics tries trackers[0] on the first frame.
        """
        try:
            if hasattr(self.model, "predictor") and self.model.predictor is not None:
                self.model.predictor = None
                logger.debug("Tracker reset: predictor cleared — will be re-initialized on next call.")
        except Exception as exc:
            logger.warning(f"Could not reset tracker state: {exc}")

    @staticmethod
    def category_for_class(class_name: str) -> str:
        return CATEGORY_MAP.get(class_name.lower(), "object")


def get_detector() -> Detector:
    """FastAPI dependency-friendly accessor for the singleton Detector."""
    return Detector.get_instance()
