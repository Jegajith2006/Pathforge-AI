import uvicorn
import os
from app.core.config import settings

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} on {host}:{port}...")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=settings.DEBUG,
    )
