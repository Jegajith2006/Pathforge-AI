from .auth import router as auth_router
from .profile import router as profile_router
from .career import router as career_router
from .skills import router as skills_router
from .resume import router as resume_router
from .assessment import router as assessment_router
from .skill_gap import router as skill_gap_router
from .roadmap import router as roadmap_router
from .courses import router as courses_router, recommendations_router
from .projects import router as projects_router
from .mentor import router as mentor_router
from .companies import router as companies_router
from .jobs import router as jobs_router
from .certificates import router as certificates_router
from .activity import router as activity_router
from .feedback import router as feedback_router
from .dashboard import router as dashboard_router
from .ai import router as ai_router
from .admin import router as admin_router

all_routers = [
    auth_router,
    profile_router,
    career_router,
    skills_router,
    resume_router,
    assessment_router,
    skill_gap_router,
    roadmap_router,
    courses_router,
    recommendations_router,
    projects_router,
    mentor_router,
    companies_router,
    jobs_router,
    certificates_router,
    activity_router,
    feedback_router,
    dashboard_router,
    ai_router,
    admin_router,
]

__all__ = [
    "auth_router",
    "profile_router",
    "career_router",
    "skills_router",
    "resume_router",
    "assessment_router",
    "skill_gap_router",
    "roadmap_router",
    "courses_router",
    "projects_router",
    "mentor_router",
    "companies_router",
    "jobs_router",
    "certificates_router",
    "activity_router",
    "feedback_router",
    "dashboard_router",
    "ai_router",
    "all_routers",
]
