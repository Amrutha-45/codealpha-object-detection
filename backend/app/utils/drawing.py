"""
drawing.py
==========
OpenCV drawing helpers: color-coded bounding boxes, labels with
track ID + confidence, and motion trails.

Kept pure/stateless (frame in -> frame out) so it can be unit tested
without any model or tracker dependency.
"""

from typing import List, Tuple

import cv2
import numpy as np

# Deterministic color palette (BGR) keyed by category, so a "person" box
# always looks visually distinct from a "vehicle" or "animal" box.
CATEGORY_COLORS = {
    "person": (66, 135, 245),   # blue-orange
    "vehicle": (52, 219, 235),  # yellow
    "animal": (105, 219, 52),   # green
    "object": (203, 82, 235),   # magenta
}
DEFAULT_COLOR = (200, 200, 200)


def _color_for_category(category: str) -> Tuple[int, int, int]:
    return CATEGORY_COLORS.get(category, DEFAULT_COLOR)


def draw_bounding_box(
    frame: np.ndarray,
    x1: int, y1: int, x2: int, y2: int,
    label: str,
    category: str,
    thickness: int = 2,
) -> np.ndarray:
    """Draw a single rounded-look bounding box with a filled label tag above it."""
    color = _color_for_category(category)

    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness, lineType=cv2.LINE_AA)

    (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    label_y1 = max(y1 - text_h - baseline - 4, 0)
    cv2.rectangle(frame, (x1, label_y1), (x1 + text_w + 8, y1), color, -1, lineType=cv2.LINE_AA)
    cv2.putText(
        frame, label, (x1 + 4, y1 - 5),
        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, lineType=cv2.LINE_AA,
    )
    return frame


def draw_trail(
    frame: np.ndarray,
    trail_points: List[Tuple[float, float]],
    category: str,
    max_thickness: int = 3,
) -> np.ndarray:
    """
    Draw a fading polyline connecting an object's historical center
    points — thinner/dimmer toward the older end of the trail.
    """
    if len(trail_points) < 2:
        return frame

    color = _color_for_category(category)
    n = len(trail_points)

    for i in range(1, n):
        pt1 = tuple(map(int, trail_points[i - 1]))
        pt2 = tuple(map(int, trail_points[i]))
        # Older segments (lower i) are thinner/more transparent-looking
        weight = i / n
        thickness = max(1, int(max_thickness * weight))
        faded_color = tuple(int(c * (0.4 + 0.6 * weight)) for c in color)
        cv2.line(frame, pt1, pt2, faded_color, thickness, lineType=cv2.LINE_AA)

    return frame


def draw_fps_overlay(frame: np.ndarray, fps: float, inference_time_ms: float) -> np.ndarray:
    """Draw a small semi-transparent stats overlay in the top-left corner."""
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (230, 65), (20, 20, 20), -1)
    frame = cv2.addWeighted(overlay, 0.55, frame, 0.45, 0)

    cv2.putText(
        frame, f"FPS: {fps:.1f}", (18, 32),
        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 150), 1, lineType=cv2.LINE_AA,
    )
    cv2.putText(
        frame, f"Inference: {inference_time_ms:.1f} ms", (18, 55),
        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1, lineType=cv2.LINE_AA,
    )
    return frame
