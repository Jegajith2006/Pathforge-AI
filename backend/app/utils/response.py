from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(
    data: Any,
    message: str = "Success",
    status_code: int = 200,
    meta: Optional[dict] = None
) -> dict:
    """Standardized API success response payload."""
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    if meta:
        response["meta"] = meta
    return response


def error_response(
    message: str,
    status_code: int = 400,
    detail: Optional[Any] = None
) -> JSONResponse:
    """Standardized API error response."""
    content = {
        "success": False,
        "error": message,
        "detail": detail
    }
    return JSONResponse(status_code=status_code, content=content)
