from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
import app.models  # Ensure all SQLAlchemy models are registered
from app.services.seed_service import seed_demo_data

# Import all routers
from app.routers import (
    health,
    users,
    skills,
    courses,
    projects,
    roadmap,
    progress,
    evidence,
    mentor,
    readiness,
    companies,
    notifications,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management:
    Initializes database schema and ensures baseline demo records are seeded on startup.
    """
    # Create tables if not present
    Base.metadata.create_all(bind=engine)

    # Seed baseline demo data safely (idempotent)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Explainable Machine Learning-Based Personalized Learning, Skill Intelligence, and Career Readiness Platform API.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="Root Endpoint")
def read_root():
    """Returns welcome message and API version."""
    return {
        "message": "Welcome to PathForge AI API",
        "version": settings.APP_VERSION
    }


# Register API Routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(skills.router)
app.include_router(courses.router)
app.include_router(projects.router)
app.include_router(roadmap.router)
app.include_router(progress.router)
app.include_router(evidence.router)
app.include_router(mentor.router)
app.include_router(readiness.router)
app.include_router(companies.router)
app.include_router(notifications.router)
