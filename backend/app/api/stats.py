"""
api/stats.py
============
    GET /stats                      -> current session aggregate statistics
    GET /download/video/{filename}  -> download a processed video
    GET /download/screenshot/{name} -> download a detection screenshot
"""

from pathlib import Path

from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse

from app.config import get_settings
from app.core.exceptions import AppException
from app.models.schemas import StatsResponse
from app.services.stats_service import StatsService, get_stats_service
from app.utils.logger import get_logger

router = APIRouter(tags=["Stats & Downloads"])
logger = get_logger()
settings = get_settings()


@router.get("/stats", response_model=StatsResponse, status_code=status.HTTP_200_OK)
async def get_stats(stats_service: StatsService = Depends(get_stats_service)):
    """Return current session's aggregate detection/tracking statistics."""
    return StatsResponse(success=True, stats=stats_service.get_stats())


@router.get("/download/video/{filename}")
async def download_video(filename: str):
    """Download a processed/annotated video by filename."""
    file_path = Path(settings.output_dir) / filename
    if not file_path.exists():
        raise AppException(
            message="Requested video not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(file_path),
        )
    return FileResponse(path=file_path, media_type="video/mp4", filename=filename)


@router.get("/download/screenshot/{filename}")
async def download_screenshot(filename: str):
    """Download a detection screenshot by filename."""
    file_path = Path(settings.screenshot_dir) / filename
    if not file_path.exists():
        raise AppException(
            message="Requested screenshot not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(file_path),
        )
    return FileResponse(path=file_path, media_type="image/jpeg", filename=filename)
