import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database.connection import init_db

init_db()
client = TestClient(app)


def test_step4_all_endpoints():
    """Verify all 10 endpoints specified in Section 26 of Step 4 specification."""
    # 1. GET /api/skills/mastery
    res_mastery = client.get("/api/skills/mastery")
    assert res_mastery.status_code == 200
    mastery_list = res_mastery.json()
    assert isinstance(mastery_list, list)
    if mastery_list:
        first = mastery_list[0]
        assert "skill_name" in first
        assert "final_mastery" in first
        assert "status" in first
        assert "evidence_count" in first

    # 2. GET /api/skills/{skill_id}/mastery
    res_single_mastery = client.get("/api/skills/S001/mastery")
    assert res_single_mastery.status_code == 200
    single = res_single_mastery.json()
    assert single["skill_id"] == "S001"
    assert "final_mastery" in single

    # 3. GET /api/skill-gap
    res_gap = client.get("/api/skill-gap")
    assert res_gap.status_code == 200
    gap_data = res_gap.json()
    assert "career_id" in gap_data
    assert "gaps" in gap_data

    # 4. POST /api/skill-gap/analyze
    res_analyze = client.post("/api/skill-gap/analyze")
    assert res_analyze.status_code == 200
    assert "gaps" in res_analyze.json()

    # 5. POST /api/career/match
    res_match = client.post("/api/career/match", json={
        "skills": ["Python", "PyTorch", "Machine Learning"],
        "background_text": "AI engineering student specializing in deep learning."
    })
    assert res_match.status_code == 200
    matched_careers = res_match.json()
    assert isinstance(matched_careers, list)
    assert len(matched_careers) > 0
    top_career = matched_careers[0]
    assert "career_id" in top_career
    assert "semantic_score" in top_career
    assert "skill_match_score" in top_career
    assert "combined_score" in top_career
    assert "matching_skills" in top_career
    assert "missing_skills" in top_career
    assert "reason" in top_career

    # 6. GET /api/courses/recommendations
    res_courses = client.get("/api/courses/recommendations?limit=5")
    assert res_courses.status_code == 200
    courses = res_courses.json()
    assert isinstance(courses, list)
    assert len(courses) > 0
    assert "course_name" in courses[0]
    assert "match_percentage" in courses[0]

    # 7. GET /api/projects/recommendations
    res_projects = client.get("/api/projects/recommendations?limit=5")
    assert res_projects.status_code == 200
    projects = res_projects.json()
    assert isinstance(projects, list)
    assert len(projects) > 0
    assert "project_name" in projects[0]
    assert "match_percentage" in projects[0]

    # 8. GET /api/jobs/recommendations
    res_jobs = client.get("/api/jobs/recommendations?limit=5")
    assert res_jobs.status_code == 200
    jobs = res_jobs.json()
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    assert "job_title" in jobs[0]
    assert "match_percentage" in jobs[0]

    # 9. GET /api/career-readiness
    res_readiness = client.get("/api/career-readiness")
    assert res_readiness.status_code == 200
    readiness = res_readiness.json()
    assert "overall_readiness" in readiness
    assert "skill_match_percentage" in readiness
    assert "mastery_percentage" in readiness
    assert "evidence_percentage" in readiness

    # 10. POST /api/career-readiness/calculate
    res_recalc = client.post("/api/career-readiness/calculate")
    assert res_recalc.status_code == 200
    assert "overall_readiness" in res_recalc.json()
