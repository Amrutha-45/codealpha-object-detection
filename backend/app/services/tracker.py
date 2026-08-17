"""
tracker.py
==========
Multi-object tracking support built on top of Ultralytics' native
ByteTrack integration (invoked via `model.track(..., persist=True)`
in detector.py).

This module's job is narrower: maintain a rolling trail (center-point
history) per track_id so the frontend/video_processor can draw motion
paths, and clean up trails for IDs that have left the frame.
"""

from collections import defaultdict, deque
from typing import Dict, List, Tuple

from app.utils.logger import get_logger

logger = get_logger()

MAX_TRAIL_LENGTH = 30  # number of historical points kept per object
MAX_MISSED_FRAMES = 15  # frames an ID can be absent before its trail is purged


class TrailTracker:
    """
    Keeps a per-track_id deque of (x, y) center points plus a
    'last seen frame' counter, so trails fade out gracefully once
    an object leaves the frame instead of persisting forever.
    """

    def __init__(self, max_trail_length: int = MAX_TRAIL_LENGTH, max_missed_frames: int = MAX_MISSED_FRAMES):
        self.max_trail_length = max_trail_length
        self.max_missed_frames = max_missed_frames
        self.trails: Dict[int, deque] = defaultdict(lambda: deque(maxlen=self.max_trail_length))
        self.last_seen: Dict[int, int] = {}
        self.current_frame_index = 0

    def update(self, track_id: int, center_point: Tuple[float, float]) -> List[Tuple[float, float]]:
        """Add a new point for this track_id and return its current trail."""
        self.trails[track_id].append(center_point)
        self.last_seen[track_id] = self.current_frame_index
        return list(self.trails[track_id])

    def advance_frame(self) -> None:
        """Call once per processed frame to age out stale tracks."""
        self.current_frame_index += 1
        stale_ids = [
            tid for tid, seen_frame in self.last_seen.items()
            if self.current_frame_index - seen_frame > self.max_missed_frames
        ]
        for tid in stale_ids:
            self.trails.pop(tid, None)
            self.last_seen.pop(tid, None)
        if stale_ids:
            logger.debug(f"Purged {len(stale_ids)} stale track trail(s): {stale_ids}")

    def get_trail(self, track_id: int) -> List[Tuple[float, float]]:
        return list(self.trails.get(track_id, []))

    def active_track_count(self) -> int:
        return len(self.trails)

    def reset(self) -> None:
        """Clear all trail state — call when starting a new video/webcam session."""
        self.trails.clear()
        self.last_seen.clear()
        self.current_frame_index = 0
        logger.info("TrailTracker state reset.")


def compute_center(x1: float, y1: float, x2: float, y2: float) -> Tuple[float, float]:
    """Return the center point of a bounding box."""
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)
