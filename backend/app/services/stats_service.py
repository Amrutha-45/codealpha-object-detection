"""
stats_service.py
=================
Maintains rolling, in-memory statistics for the current detection
session (webcam or most recent video/image). Powers the /stats
endpoint and the dashboard's Statistics Cards.

NOTE: This is intentionally a simple in-memory singleton — sufficient
for a single-user demo/internship project. For multi-user production
use, back this with Redis or a per-session store keyed by session ID.
"""

import time
from typing import Optional, Set

from app.models.schemas import DetectionStats
from app.utils.logger import get_logger

logger = get_logger()


class StatsService:
    _instance: Optional["StatsService"] = None

    def __init__(self):
        self.reset()

    @classmethod
    def get_instance(cls) -> "StatsService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def reset(self) -> None:
        self.total_objects_detected = 0
        self.person_count = 0
        self.vehicle_count = 0
        self.animal_count = 0
        self.other_count = 0
        self._fps_samples = []
        self._inference_time_samples = []
        self._seen_track_ids: Set[int] = set()
        self.session_start_time = time.time()
        logger.info("StatsService session reset.")

    def record_frame(
        self,
        objects: list,  # list of dicts/TrackedObject-like with .category and .track_id
        fps: float,
        inference_time_ms: float,
    ) -> None:
        self._fps_samples.append(fps)
        self._inference_time_samples.append(inference_time_ms)

        for obj in objects:
            category = obj["category"] if isinstance(obj, dict) else obj.category
            track_id = obj["track_id"] if isinstance(obj, dict) else obj.track_id

            self.total_objects_detected += 1
            self._seen_track_ids.add(track_id)

            if category == "person":
                self.person_count += 1
            elif category == "vehicle":
                self.vehicle_count += 1
            elif category == "animal":
                self.animal_count += 1
            else:
                self.other_count += 1

        # Keep sample windows bounded so long sessions don't grow memory unbounded
        if len(self._fps_samples) > 1000:
            self._fps_samples = self._fps_samples[-1000:]
        if len(self._inference_time_samples) > 1000:
            self._inference_time_samples = self._inference_time_samples[-1000:]

    def get_stats(self) -> DetectionStats:
        avg_fps = sum(self._fps_samples) / len(self._fps_samples) if self._fps_samples else 0.0
        avg_inference = (
            sum(self._inference_time_samples) / len(self._inference_time_samples)
            if self._inference_time_samples else 0.0
        )
        return DetectionStats(
            total_objects_detected=self.total_objects_detected,
            person_count=self.person_count,
            vehicle_count=self.vehicle_count,
            animal_count=self.animal_count,
            other_count=self.other_count,
            average_fps=round(avg_fps, 2),
            average_inference_time_ms=round(avg_inference, 2),
            active_track_ids=len(self._seen_track_ids),
            session_duration_sec=round(time.time() - self.session_start_time, 2),
        )


def get_stats_service() -> StatsService:
    return StatsService.get_instance()
