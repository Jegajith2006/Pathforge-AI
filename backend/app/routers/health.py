from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="API Health Check")
def get_health():
    """
    Returns server operational status.
    Used by frontend Settings and monitoring probes to verify backend connectivity.
    """
    return {
        "status": "healthy",
        "service": "pathforge-api"
    }
