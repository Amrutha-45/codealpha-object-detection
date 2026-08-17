"""
file_utils.py
=============
Helpers for validating uploads, generating unique filenames, and
saving/reading files from the storage directories.
"""

import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import UploadFile

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger()
settings = get_settings()


def generate_unique_filename(original_filename: str) -> str:
    """Prefix a UUID to preserve the original extension while guaranteeing uniqueness."""
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4().hex}{ext}"


def validate_extension(filename: str, allowed_extensions: list) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in allowed_extensions


async def save_upload_file(upload_file: UploadFile, destination_dir: str) -> str:
    """
    Stream an UploadFile to disk in chunks (avoids loading large videos
    fully into memory) and return the saved file's absolute path.
    """
    Path(destination_dir).mkdir(parents=True, exist_ok=True)
    unique_name = generate_unique_filename(upload_file.filename)
    dest_path = Path(destination_dir) / unique_name

    chunk_size = 1024 * 1024  # 1 MB
    async with aiofiles.open(dest_path, "wb") as out_file:
        while chunk := await upload_file.read(chunk_size):
            await out_file.write(chunk)

    logger.info(f"Saved upload '{upload_file.filename}' -> '{dest_path}'")
    return str(dest_path)


def get_output_path(file_id: str, extension: str, output_dir: Optional[str] = None) -> str:
    directory = output_dir or settings.output_dir
    Path(directory).mkdir(parents=True, exist_ok=True)
    return str(Path(directory) / f"{file_id}{extension}")


def file_size_mb(path: str) -> float:
    return Path(path).stat().st_size / (1024 * 1024)


def cleanup_file(path: str) -> None:
    """Best-effort deletion of a temp file; never raises."""
    try:
        p = Path(path)
        if p.exists():
            p.unlink()
            logger.debug(f"Cleaned up temp file: {path}")
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Failed to clean up file '{path}': {exc}")
