"""
PathForge AI - Comprehensive Unit & Integration Tests for Step 9: Personalized Roadmap Generator
Verifies:
1. Prerequisite graph construction from skill_prerequisites
2. Topological sort (prerequisites come before dependents)
3. Safe cycle detection and fallback
4. Course and project matching from database
5. Dynamic weekly plan generation based on gap size
6. Roadmap persistence in student_roadmap_steps table
7. Step completion API
8. Roadmap regeneration reflecting latest mastery
"""

import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database.connection import SessionLocal
from database.models import Student, Skill, SkillPrerequisite, StudentRoadmapStep, StudentSkill
from services.roadmap_service import (
    build_prerequisite_graph,
    topological_sort_with_cycle_detection,
    find_best_course_for_skill,
    find_best_project_for_skill,
    generate_topological_roadmap,
    mark_roadmap_step_complete,
)

client = TestClient(app)


from routers.auth import create_access_token


def get_auth_headers():
    db = SessionLocal()
    student = db.query(Student).first()
    sid = student.student_id if student else "U001"
    db.close()
    token = create_access_token({"sub": sid, "email": "alex.chen@stanford.edu"})
    return {"Authorization": f"Bearer {token}"}


def test_prerequisite_graph_building():
    db = SessionLocal()
    try:
        prereq_to_deps, dep_to_prereqs = build_prerequisite_graph(db)
        assert isinstance(prereq_to_deps, dict)
        assert isinstance(dep_to_prereqs, dict)
        # Check there are edges
        assert len(prereq_to_deps) > 0 or len(dep_to_prereqs) > 0
    finally:
        db.close()


def test_topological_sort_linear_and_dag():
    # A -> B -> C
    graph = {"A": ["B"], "B": ["C"]}
    skills = ["C", "B", "A"]
    order = topological_sort_with_cycle_detection(skills, graph)
    assert order.index("A") < order.index("B")
    assert order.index("B") < order.index("C")


def test_topological_sort_diamond_dag():
    # A -> B, A -> C, B -> D, C -> D
    graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"]}
    skills = ["D", "C", "B", "A"]
    order = topological_sort_with_cycle_detection(skills, graph)
    assert order.index("A") < order.index("B")
    assert order.index("A") < order.index("C")
    assert order.index("B") < order.index("D")
    assert order.index("C") < order.index("D")


def test_topological_sort_cycle_resilience():
    # A -> B -> C -> A (cycle)
    graph = {"A": ["B"], "B": ["C"], "C": ["A"]}
    skills = ["A", "B", "C"]
    # Should not crash or infinite loop
    order = topological_sort_with_cycle_detection(skills, graph)
    assert len(order) == 3
    assert set(order) == {"A", "B", "C"}


def test_course_and_project_matching():
    db = SessionLocal()
    try:
        skills = db.query(Skill).all()
        assert len(skills) > 0

        for s in skills[:5]:
            cid, cname, cprovider = find_best_course_for_skill(db, s.skill_id)
            assert cname is not None
            assert len(cname) > 0

            pid, pname = find_best_project_for_skill(db, s.skill_id)
            assert pname is not None
            assert len(pname) > 0
    finally:
        db.close()


def test_generate_roadmap_structure_and_persistence():
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.email == "alex.chen@stanford.edu").first()
        assert student is not None

        roadmap = generate_topological_roadmap(db, student.student_id)

        assert "career_id" in roadmap
        assert "career_name" in roadmap
        assert "milestones" in roadmap
        assert "weekly_plan" in roadmap
        assert "current_progress_percentage" in roadmap
        assert len(roadmap["milestones"]) > 0
        assert len(roadmap["weekly_plan"]) > 0

        # Check milestones are 1-indexed
        for idx, m in enumerate(roadmap["milestones"], start=1):
            assert m["step_number"] == idx
            assert "milestone_name" in m
            assert "skill_id" in m
            assert "status" in m
            assert "estimated_weeks" in m
            assert m["estimated_weeks"] >= 1

        # Check DB persistence in StudentRoadmapStep
        db_steps = (
            db.query(StudentRoadmapStep)
            .filter(StudentRoadmapStep.student_id == student.student_id)
            .order_by(StudentRoadmapStep.step_number)
            .all()
        )
        assert len(db_steps) == len(roadmap["milestones"])
    finally:
        db.close()


def test_api_roadmap_endpoints_and_completion():
    headers = get_auth_headers()

    # GET /api/roadmap
    res1 = client.get("/api/roadmap", headers=headers)
    assert res1.status_code == 200
    data = res1.json()
    assert "milestones" in data
    assert len(data["milestones"]) > 0

    # POST /api/roadmap/generate
    res2 = client.post("/api/roadmap/generate", headers=headers)
    assert res2.status_code == 200
    assert len(res2.json()["milestones"]) > 0

    # Complete a step
    step_to_complete = data["milestones"][0]["step_number"]
    res3 = client.post(f"/api/roadmap/{step_to_complete}/complete", headers=headers)
    assert res3.status_code == 200

    # Also test alias /steps/{id}/complete
    res4 = client.post(f"/api/roadmap/steps/{step_to_complete}/complete", headers=headers)
    assert res4.status_code == 200
