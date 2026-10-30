import time
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings
from database.connection import init_db, SessionLocal
from database.models import Career
from database.seed import seed_database
from routers import all_routers
from schemas.common import HealthResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pathforge.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    init_db()
    # Check if database is populated; if empty, seed automatically
    session = SessionLocal()
    try:
        if session.query(Career).count() == 0:
            logger.info("[PathForge AI] Initializing and seeding database from datasets...")
            seed_database()
    except Exception as e:
        logger.warning(f"[PathForge AI] Startup verification note: {e}")
    finally:
        session.close()
    yield


app = FastAPI(
    title="PathForge AI API",
    description="AI-Based Personalized Learning Roadmap and Career Skill Intelligence System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request correlation ID & optional envelope middleware
class RequestCorrelationAndEnvelopeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()

        logger.info(f"[{request_id}] START {request.method} {request.url.path}")
        try:
            response: Response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
            logger.info(
                f"[{request_id}] END {request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)"
            )

            # Check if consumer specifically requested response envelope
            wants_envelope = (
                request.headers.get("X-Envelope", "").lower() in ["true", "1"]
                or request.headers.get("Accept-Envelope", "").lower() in ["true", "1"]
                or request.query_params.get("envelope", "").lower() in ["true", "1"]
            )

            # If envelope requested and response is successful JSON
            if wants_envelope and 200 <= response.status_code < 300:
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    body_bytes = b"".join([chunk async for chunk in response.body_iterator])
                    try:
                        raw_data = json.loads(body_bytes.decode("utf-8"))
                        if not (isinstance(raw_data, dict) and "success" in raw_data and "meta" in raw_data):
                            enveloped = {
                                "success": True,
                                "data": raw_data,
                                "error": None,
                                "meta": {
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "request_id": request_id,
                                    "process_time_ms": round(process_time, 2),
                                },
                            }
                            new_body = json.dumps(enveloped).encode("utf-8")
                            headers = dict(response.headers)
                            headers["content-length"] = str(len(new_body))
                            return Response(
                                content=new_body,
                                status_code=response.status_code,
                                headers=headers,
                                media_type="application/json",
                            )
                    except Exception as json_err:
                        logger.debug(f"[{request_id}] Envelope wrapping skipped: {json_err}")
                        return Response(
                            content=body_bytes,
                            status_code=response.status_code,
                            headers=dict(response.headers),
                            media_type=content_type,
                        )

            return response
        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"[{request_id}] FAILED {request.method} {request.url.path} after {process_time:.2f}ms: {exc}",
                exc_info=True,
            )
            raise


app.add_middleware(RequestCorrelationAndEnvelopeMiddleware)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.warning(f"[{request_id}] HTTPException {exc.status_code}: {exc.detail}")

    code = f"HTTP_{exc.status_code}"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 409:
        code = "CONFLICT"

    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    details = exc.detail if isinstance(exc.detail, (dict, list)) else None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
            "detail": message,  # Backward compatibility
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id,
            },
        },
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    from fastapi.encoders import jsonable_encoder
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    raw_errors = jsonable_encoder(exc.errors())
    logger.warning(f"[{request_id}] Request validation error: {raw_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": raw_errors,
            },
            "detail": raw_errors,  # Backward compatibility
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id,
            },
        },
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"[{request_id}] Database integrity or query error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred while processing the request.",
                "details": str(exc) if getattr(settings, "DEBUG", False) else None,
            },
            "detail": "A database error occurred while processing the request.",
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id,
            },
        },
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"[{request_id}] Unhandled server exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
                "details": str(exc) if getattr(settings, "DEBUG", False) else None,
            },
            "detail": "An unexpected internal server error occurred.",
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id,
            },
        },
        headers={"X-Request-ID": request_id},
    )


# Include all routers
for router in all_routers:
    app.include_router(router)

# Mount static uploads directory for avatars and documents
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "PathForge AI API is running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health():
    """Lightweight health check for backward compatibility with existing tests."""
    return {
        "status": "healthy",
    }


@app.get("/api/health", tags=["Health"], response_model=HealthResponse)
def api_health():
    """Comprehensive health check verifying database connectivity, version, and timestamp."""
    db_status = "connected"
    session = SessionLocal()
    try:
        session.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"disconnected: {exc}"
        logger.error(f"Health check DB probe failed: {exc}")
    finally:
        session.close()

    is_healthy = db_status == "connected"
    return {
        "status": "healthy" if is_healthy else "degraded",
        "version": getattr(settings, "VERSION", "1.0.0"),
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/ml/model-status", tags=["ML Intelligence Layer"])
def get_ml_model_status():
    """Reports the status of the local BGE embedding model."""
    from ml.model_config import is_model_local, HF_MODEL_NAME
    from ml.embedding_service import get_embedding_dimension

    return {
        "model": HF_MODEL_NAME,
        "local": is_model_local(),
        "embedding_dimension": get_embedding_dimension(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
