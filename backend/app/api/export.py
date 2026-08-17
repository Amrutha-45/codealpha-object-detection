"""
api/export.py
=============
Endpoints for exporting detection history & stats as JSON or CSV.
"""

import io
import csv
import json
from fastapi import APIRouter, Depends, status
from fastapi.responses import Response, StreamingResponse

from app.services.stats_service import StatsService, get_stats_service
from app.utils.logger import get_logger

router = APIRouter(prefix="/export", tags=["Export"])
logger = get_logger()


@router.get("/json", status_code=status.HTTP_200_OK)
async def export_json(stats_service: StatsService = Depends(get_stats_service)):
    """Export detection session stats as downloadable JSON."""
    stats = stats_service.get_stats()
    content = json.dumps(stats.model_dump(), indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="detection_report.json"'},
    )


@router.get("/csv", status_code=status.HTTP_200_OK)
async def export_csv(stats_service: StatsService = Depends(get_stats_service)):
    """Export detection session stats as downloadable CSV."""
    stats = stats_service.get_stats()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Objects Detected", stats.total_objects_detected])
    writer.writerow(["Person Count", stats.person_count])
    writer.writerow(["Vehicle Count", stats.vehicle_count])
    writer.writerow(["Animal Count", stats.animal_count])
    writer.writerow(["Other Count", stats.other_count])
    writer.writerow(["Average FPS", stats.average_fps])
    writer.writerow(["Average Inference Time (ms)", stats.average_inference_time_ms])
    writer.writerow(["Active Track IDs", stats.active_track_ids])
    writer.writerow(["Session Duration (sec)", stats.session_duration_sec])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="detection_report.csv"'},
    )
