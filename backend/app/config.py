"""
config.py
=========
Centralized application configuration.

All environment-driven settings are loaded once here via Pydantic Settings
and exposed through a single cached `get_settings()` accessor so the rest
of the codebase never touches `os.environ` directly.
"""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings, sourced from environment variables / .env file."""

    # --- App Info ---
    app_name: str = "AI Object Detection & Tracking API"
    app_version: str = "1.0.0"
    environment: str = "development"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # --- CORS ---
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://codealpha-object-detection-three.vercel.app"

    # --- YOLO Model ---
    model_weights_path: str = "weights/yolov8n.pt"
    default_confidence: float = 0.5
    device: str = "cpu"

    # --- Tracking ---
    tracker_type: str = "bytetrack"
    tracker_config_path: str = "bytetrack.yaml"

    # --- Allowed Detection Classes ---
    allowed_classes: str = "person,car,bicycle,bus,truck,dog,cat,bottle,chair,laptop"

    # --- Storage Paths ---
    upload_dir: str = "storage/uploads"
    output_dir: str = "storage/outputs"
    screenshot_dir: str = "storage/screenshots"

    # --- Upload Limits ---
    max_upload_size_mb: int = 200
    allowed_video_extensions: str = ".mp4,.avi,.mov"
    allowed_image_extensions: str = ".jpg,.jpeg,.png"

    # --- Webcam ---
    webcam_source: str = "0"

    # --- Logging ---
    log_level: str = "INFO"
    log_file: str = "logs/app.log"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=('settings_',),
    )

    # ---------------------------------------------------------------
    # Convenience helpers — keep parsing logic in one place
    # ---------------------------------------------------------------

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_classes_list(self) -> List[str]:
        return [cls.strip().lower() for cls in self.allowed_classes.split(",") if cls.strip()]

    @property
    def allowed_video_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_video_extensions.split(",") if ext.strip()]

    @property
    def allowed_image_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_image_extensions.split(",") if ext.strip()]

    @property
    def webcam_source_value(self):
        """Return webcam source as int (device index) if numeric, else keep as string (e.g. RTSP URL)."""
        return int(self.webcam_source) if self.webcam_source.isdigit() else self.webcam_source

    def ensure_directories(self) -> None:
        """Create all storage/log directories if they don't already exist."""
        for path_str in (
            self.upload_dir,
            self.output_dir,
            self.screenshot_dir,
            str(Path(self.log_file).parent),
            str(Path(self.model_weights_path).parent),
        ):
            Path(path_str).mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton instance of Settings."""
    settings = Settings()
    settings.ensure_directories()
    return settings
