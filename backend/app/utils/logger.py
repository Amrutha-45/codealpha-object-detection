"""
logger.py
=========
Centralized logging configuration using Loguru.

Import `logger` from this module anywhere in the app to get a
consistently formatted logger that writes to both console and file.
"""

import sys

from loguru import logger

from app.config import get_settings

_settings = get_settings()

# Remove Loguru's default handler to avoid duplicate console output
logger.remove()

# --- Console Sink (colorized, human-readable) ---
logger.add(
    sys.stdout,
    level=_settings.log_level,
    colorize=True,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    ),
)

# --- File Sink (rotating, persistent) ---
logger.add(
    _settings.log_file,
    level=_settings.log_level,
    rotation="10 MB",
    retention="7 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    backtrace=True,
    diagnose=False,  # keep False in production to avoid leaking variable values in traces
)


def get_logger():
    """Return the shared, pre-configured Loguru logger instance."""
    return logger
