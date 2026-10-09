from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from config import settings
from database.connection import init_db, SessionLocal
from database.models import Career
from database.seed import seed_database
from routers import all_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    init_db()
    # Check if database is populated; if empty, seed automatically
    session = SessionLocal()
    try:
        if session.query(Career).count() == 0:
            print("[PathForge AI] Initializing and seeding database from datasets...")
            seed_database()
    except Exception as e:
        print(f"[PathForge AI] Startup verification note: {e}")
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
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
for router in all_routers:
    app.include_router(router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "PathForge AI API is running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
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
