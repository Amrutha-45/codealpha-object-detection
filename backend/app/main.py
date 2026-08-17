"""
main.py
=======
Application entrypoint. Run with:

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

or simply:

    python -m app.main
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import detect, export, stats, webcam
from app.config import get_settings
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler
from app.services.detector import Detector
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Production-style REST API for real-time AI object detection and "
        "multi-object tracking using YOLOv8 + ByteTrack."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception Handlers ---
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# --- Routers ---
app.include_router(detect.router)
app.include_router(webcam.router)
app.include_router(stats.router)
app.include_router(export.router)


@app.get("/", tags=["Health"])
async def root():
    """Basic liveness/info endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for uptime monitors / container orchestration."""
    return {"status": "healthy"}


@app.on_event("startup")
async def on_startup():
    settings.ensure_directories()
    logger.info(f"{settings.app_name} v{settings.app_version} starting in '{settings.environment}' mode")
    logger.info(f"Model weights: {settings.model_weights_path} | Device: {settings.device}")
    logger.info(f"Allowed classes: {settings.allowed_classes_list}")
    logger.info("Warming up YOLOv8 model...")
    Detector.get_instance()  # loads + caches the model so first request isn't slow
    logger.info("Model ready. Application startup complete.")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Application shutting down.")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
