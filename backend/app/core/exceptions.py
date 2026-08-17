"""
exceptions.py
=============
Custom exception types + FastAPI exception handlers, so every error
returned by the API follows the same `ErrorResponse` shape the
frontend expects (and can show as a toast notification).
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.models.schemas import ErrorResponse
from app.utils.logger import get_logger

logger = get_logger()


class AppException(Exception):
    """Base class for all application-specific, user-facing errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, detail: str = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(message)


class InvalidFileTypeError(AppException):
    def __init__(self, allowed: list):
        super().__init__(
            message="Unsupported file type.",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Allowed extensions: {', '.join(allowed)}",
        )


class FileTooLargeError(AppException):
    def __init__(self, max_mb: int):
        super().__init__(
            message="Uploaded file exceeds the maximum allowed size.",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Maximum allowed size: {max_mb} MB",
        )


class ModelInferenceError(AppException):
    def __init__(self, detail: str = None):
        super().__init__(
            message="An error occurred while running model inference.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


class WebcamError(AppException):
    def __init__(self, message: str = "Webcam operation failed.", detail: str = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.error(f"AppException on {request.url.path}: {exc.message} | detail={exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.message, detail=exc.detail).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="An unexpected server error occurred.",
            detail=str(exc),
        ).model_dump(),
    )
