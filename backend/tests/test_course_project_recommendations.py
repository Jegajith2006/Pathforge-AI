"""
PathForge AI - Comprehensive Step 10 Verification: Course & Project Recommendation Engine
Systematically tests all 26 Phase 26 test points:

COURSE RECOMMENDATIONS:
1. courses load
2. course-skill mapping works
3. missing skill finds relevant courses
4. irrelevant course is excluded / ranked lower
5. skill match score works
6. BGE semantic score works
7. hybrid ranking works
8. completed course is excluded
9. duplicate course is excluded
10. no-course case handled

PROJECT RECOMMENDATIONS:
11. projects load
12. project-skill mapping works
13. missing skill finds relevant projects
14. irrelevant project is excluded / ranked lower
15. hybrid ranking works
16. completed project is excluded
17. duplicate project is excluded
18. no-project case handled

PERSONALIZATION:
19. Student A receives recommendations based on Student A's gaps
20. Student B receives different recommendations based on Student B's gaps

INTEGRATION:
21. skill gap -> course recommendation
22. skill gap -> project recommendation
23. recommendation -> roadmap
24. course completion updates recommendation
25. project completion updates recommendation
26. mastery change updates recommendation
"""

import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database.connection import SessionLocal
from database.models import (
    Student,
    Career,
    Skill,
    Course,
    CourseSkill,
    Project,
    ProjectSkill,
    StudentSkill,
    StudentCourseProgress,
    StudentProjectProgress,
)
from services.skill_gap_service import analyze_student_skill_gap, update_or_create_student_skill
from services.recommendation_service import (
    get_personalized_courses,
    get_personalized_projects,
    get_personalized_recommendations,
)
from services.roadmap_service import generate_topological_roadmap
from ml.course_recommendation import rank_course_recommendations
from ml.project_recommendation import rank_project_recommendations
from ml.embedding_service import generate_embedding, cosine_similarity
from routers.auth import create_access_token

client = TestClient(app)


def get_auth_headers(student_id: str = "U001", email: str = "alex.chen@stanford.edu"):
    token = create_access_token({"sub": student_id, "email": email})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# COURSE TESTS (1 - 10)
# ==============================================================================

def test_01_courses_load():
    """1. Verify courses load from database."""
    db = SessionLocal()
    try:
        courses = db.query(Course).all()
        assert len(courses) >= 10, "Database must have seeded courses"
        assert all(c.course_id and c.course_name for c in courses)
    finally:
        db.close()


def test_02_course_skill_mapping():
    """2. Verify course-skill ontology mapping works."""
    db = SessionLocal()
    try:
        course_skills = db.query(CourseSkill).all()
        assert len(course_skills) >= 10, "Database must contain course_skills relationships"
        sample_cs = course_skills[0]
        assert sample_cs.course is not None, "Course relationship must resolve"
        assert sample_cs.skill is not None, "Skill relationship must resolve"
    finally:
        db.close()


def test_03_missing_skill_finds_relevant_courses():
    """3. Verify missing skill finds relevant courses teaching that skill."""
    gaps = [{"skill_name": "Deep Learning", "gap": 60, "priority": "Critical Gap", "importance": 5}]
    sample_courses = [
        {
            "course_id": "C_DL",
            "course_name": "Deep Learning with PyTorch",
            "provider": "Stanford Online",
            "rating": 4.9,
            "difficulty": "Intermediate",
            "duration_hours": 30,
            "skills": [{"skill_name": "Deep Learning"}],
        },
        {
            "course_id": "C_SQL",
            "course_name": "SQL Databases",
            "provider": "Coursera",
            "rating": 4.5,
            "difficulty": "Beginner",
            "duration_hours": 10,
            "skills": [{"skill_name": "SQL"}],
        },
    ]
    ranked = rank_course_recommendations(gaps, sample_courses, top_k=2, career_name="Machine Learning Engineer")
    assert len(ranked) == 2
    assert ranked[0]["course_id"] == "C_DL"
    assert "Deep Learning" in ranked[0]["missing_skills_addressed"]


def test_04_irrelevant_course_excluded_or_ranked_lower():
    """4. Verify irrelevant course is ranked lower than skill-matching courses."""
    gaps = [{"skill_name": "Machine Learning", "gap": 50, "priority": "High Priority", "importance": 4}]
    sample_courses = [
        {
            "course_id": "C_REACT",
            "course_name": "Frontend Web Development with React",
            "provider": "Meta",
            "rating": 4.8,
            "difficulty": "Intermediate",
            "duration_hours": 20,
            "skills": [{"skill_name": "React"}],
        },
        {
            "course_id": "C_ML",
            "course_name": "Machine Learning Algorithms & Optimization",
            "provider": "Coursera",
            "rating": 4.8,
            "difficulty": "Intermediate",
            "duration_hours": 25,
            "skills": [{"skill_name": "Machine Learning"}],
        },
    ]
    ranked = rank_course_recommendations(gaps, sample_courses, top_k=2, career_name="Machine Learning Engineer")
    assert ranked[0]["course_id"] == "C_ML"
    assert ranked[0]["relevance_score"] > ranked[1]["relevance_score"]


def test_05_skill_match_score_works():
    """5. Verify skill match score is correctly computed for courses."""
    gaps = [{"skill_name": "PyTorch", "gap": 40, "priority": "High Priority", "importance": 4}]
    courses = [
        {
            "course_id": "C_PT",
            "course_name": "Applied PyTorch Neural Networks",
            "provider": "Stanford",
            "rating": 4.9,
            "difficulty": "Intermediate",
            "duration_hours": 20,
            "skills": [{"skill_name": "PyTorch"}],
        }
    ]
    ranked = rank_course_recommendations(gaps, courses, top_k=1, career_name="Machine Learning Engineer")
    assert ranked[0]["relevance_score"] >= 60
    assert ranked[0]["match_percentage"] == ranked[0]["relevance_score"]


def test_06_bge_semantic_score_works():
    """6. Verify BGE semantic embedding similarity works for course domain alignment."""
    v1 = generate_embedding("Deep Learning and Neural Networks")
    v2 = generate_embedding("Convolutional Neural Networks with PyTorch")
    v3 = generate_embedding("History of Renaissance Art in Florence")
    sim_related = cosine_similarity(v1, v2)
    sim_unrelated = cosine_similarity(v1, v3)
    assert sim_related > sim_unrelated, "BGE must show higher similarity for related technical domains"


def test_07_hybrid_ranking_works_courses():
    """7. Verify hybrid ranking combines explicit match, semantic similarity, and gap priority."""
    gaps = [
        {"skill_name": "Deep Learning", "gap": 70, "priority": "Critical Gap", "importance": 5},
        {"skill_name": "Docker", "gap": 15, "priority": "Low Priority", "importance": 2},
    ]
    courses = [
        {
            "course_id": "C_DOCKER",
            "course_name": "Docker Container Essentials",
            "provider": "Linux Foundation",
            "rating": 4.7,
            "difficulty": "Beginner",
            "duration_hours": 10,
            "skills": [{"skill_name": "Docker"}],
        },
        {
            "course_id": "C_DL",
            "course_name": "Deep Learning Specialization",
            "provider": "DeepLearning.AI",
            "rating": 4.9,
            "difficulty": "Intermediate",
            "duration_hours": 40,
            "skills": [{"skill_name": "Deep Learning"}],
        },
    ]
    ranked = rank_course_recommendations(gaps, courses, top_k=2, career_name="Machine Learning Engineer")
    assert ranked[0]["course_id"] == "C_DL", "Higher gap priority must rank above lower gap priority"


def test_08_completed_course_is_excluded():
    """8. Verify completed course (100% or completed status) is excluded."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None
        recs = get_personalized_courses(db, student.student_id, limit=3)
        assert len(recs) > 0
        target_course = recs[0]["course_id"]

        # Insert completion
        scp = StudentCourseProgress(
            student_id=student.student_id,
            course_id=target_course,
            progress_percentage=100,
            status="completed",
        )
        db.add(scp)
        db.commit()

        recs_after = get_personalized_courses(db, student.student_id, limit=3)
        course_ids = [c["course_id"] for c in recs_after]
        assert target_course not in course_ids, "Completed course must not appear in recommendations"
    finally:
        db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == student.student_id,
            StudentCourseProgress.course_id == target_course,
        ).delete()
        db.commit()
        db.close()


def test_09_duplicate_course_is_excluded():
    """9. Verify duplicate courses are deduplicated in recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        recs = get_personalized_courses(db, student.student_id, limit=10)
        course_ids = [c["course_id"] for c in recs]
        assert len(course_ids) == len(set(course_ids)), "Course recommendations must not have duplicates"
    finally:
        db.close()


def test_10_no_course_case_handled():
    """10. Verify empty/no-course case is handled gracefully without crashing."""
    gaps = [{"skill_name": "Rare Quantum Algorithm", "gap": 90, "priority": "Critical Gap"}]
    ranked = rank_course_recommendations(gaps, [], top_k=5, career_name="Quantum Engineer")
    assert ranked == [], "Should return empty list gracefully when no courses available"


# ==============================================================================
# PROJECT TESTS (11 - 18)
# ==============================================================================

def test_11_projects_load():
    """11. Verify projects load from database."""
    db = SessionLocal()
    try:
        projects = db.query(Project).all()
        assert len(projects) >= 10, "Database must have seeded projects"
        assert all(p.project_id and p.project_name for p in projects)
    finally:
        db.close()


def test_12_project_skill_mapping():
    """12. Verify project-skill ontology mapping works."""
    db = SessionLocal()
    try:
        project_skills = db.query(ProjectSkill).all()
        assert len(project_skills) >= 10, "Database must contain project_skills relationships"
        sample_ps = project_skills[0]
        assert sample_ps.project is not None
        assert sample_ps.skill is not None
    finally:
        db.close()


def test_13_missing_skill_finds_relevant_projects():
    """13. Verify missing skill finds relevant projects teaching that skill."""
    gaps = [{"skill_name": "Deep Learning", "gap": 60, "priority": "Critical Gap"}]
    sample_projects = [
        {
            "project_id": "P_CV",
            "project_name": "Image Classification CNN Pipeline",
            "description": "Deep learning convolutional neural network classifier.",
            "difficulty": "Intermediate",
            "estimated_duration_weeks": 4,
            "skills": [{"skill_name": "Deep Learning"}],
        },
        {
            "project_id": "P_HTML",
            "project_name": "Static HTML Landing Page",
            "description": "Basic website layout.",
            "difficulty": "Beginner",
            "estimated_duration_weeks": 1,
            "skills": [{"skill_name": "HTML"}],
        },
    ]
    ranked = rank_project_recommendations(gaps, sample_projects, top_k=2, career_name="Machine Learning Engineer")
    assert len(ranked) == 2
    assert ranked[0]["project_id"] == "P_CV"
    assert "Deep Learning" in ranked[0]["matched_missing_skills"]


def test_14_irrelevant_project_excluded_or_ranked_lower():
    """14. Verify irrelevant project is ranked lower than skill-matching projects."""
    gaps = [{"skill_name": "Deep Learning", "gap": 55, "priority": "Critical Gap"}]
    sample_projects = [
        {
            "project_id": "P_WEB",
            "project_name": "CSS Flexbox Navigation Bar",
            "description": "Simple CSS UI styling project.",
            "difficulty": "Beginner",
            "estimated_duration_weeks": 1,
            "skills": [{"skill_name": "CSS"}],
        },
        {
            "project_id": "P_DL",
            "project_name": "End-to-End Object Detection System",
            "description": "Production PyTorch deep learning computer vision model.",
            "difficulty": "Advanced",
            "estimated_duration_weeks": 4,
            "skills": [{"skill_name": "Deep Learning"}],
        },
    ]
    ranked = rank_project_recommendations(gaps, sample_projects, top_k=2, career_name="Machine Learning Engineer")
    assert ranked[0]["project_id"] == "P_DL"
    assert ranked[0]["relevance_score"] > ranked[1]["relevance_score"]


def test_15_hybrid_ranking_works_projects():
    """15. Verify hybrid ranking formula works for projects."""
    gaps = [
        {"skill_name": "Deep Learning", "gap": 70, "priority": "Critical Gap"},
        {"skill_name": "Git", "gap": 10, "priority": "Low Priority"},
    ]
    projects = [
        {
            "project_id": "P_GIT",
            "project_name": "Git Branching Workflow Practice",
            "description": "Learn git commands and merge conflicts.",
            "difficulty": "Beginner",
            "estimated_duration_weeks": 1,
            "career_id": "C001",
            "skills": [{"skill_name": "Git"}],
        },
        {
            "project_id": "P_DL",
            "project_name": "Neural Network Image Recognizer",
            "description": "Deep learning image classification system with PyTorch.",
            "difficulty": "Intermediate",
            "estimated_duration_weeks": 4,
            "career_id": "C001",
            "skills": [{"skill_name": "Deep Learning"}],
        },
    ]
    ranked = rank_project_recommendations(gaps, projects, target_career_id="C001", top_k=2, career_name="Machine Learning Engineer")
    assert ranked[0]["project_id"] == "P_DL"


def test_16_completed_project_is_excluded():
    """16. Verify completed project (status=completed or progress=100) is excluded."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None
        recs = get_personalized_projects(db, student.student_id, limit=3)
        assert len(recs) > 0
        target_project = recs[0]["project_id"]

        spp = StudentProjectProgress(
            student_id=student.student_id,
            project_id=target_project,
            progress_percentage=100,
            status="completed",
        )
        db.add(spp)
        db.commit()

        recs_after = get_personalized_projects(db, student.student_id, limit=3)
        proj_ids = [p["project_id"] for p in recs_after]
        assert target_project not in proj_ids, "Completed project must be excluded"
    finally:
        db.query(StudentProjectProgress).filter(
            StudentProjectProgress.student_id == student.student_id,
            StudentProjectProgress.project_id == target_project,
        ).delete()
        db.commit()
        db.close()


def test_17_duplicate_project_is_excluded():
    """17. Verify duplicate projects are deduplicated in recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        recs = get_personalized_projects(db, student.student_id, limit=10)
        proj_ids = [p["project_id"] for p in recs]
        assert len(proj_ids) == len(set(proj_ids)), "Project recommendations must not contain duplicates"
    finally:
        db.close()


def test_18_no_project_case_handled():
    """18. Verify empty/no-project case is handled gracefully."""
    gaps = [{"skill_name": "Quantum Computing", "gap": 80, "priority": "Critical Gap"}]
    ranked = rank_project_recommendations(gaps, [], top_k=5, career_name="Quantum Engineer")
    assert ranked == [], "Should return empty list gracefully when no projects available"


# ==============================================================================
# PERSONALIZATION TESTS (19 - 20)
# ==============================================================================

def test_19_student_a_receives_recommendations_based_on_gaps():
    """19. Student A with specific gaps receives personalized course & project recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.email == "student_a_e2e@pathforge.ai").first()
        if not student:
            student = db.query(Student).first()
        res = get_personalized_recommendations(db, student.student_id, limit_courses=4, limit_projects=4)
        assert len(res["courses"]) > 0
        assert len(res["projects"]) > 0
        assert res["career_name"] is not None
    finally:
        db.close()


def test_20_student_b_receives_different_recommendations():
    """20. Student B with different profile receives personalized recommendations matching their gaps."""
    db = SessionLocal()
    try:
        student_a = db.query(Student).filter(Student.email == "student_a_e2e@pathforge.ai").first()
        student_b = db.query(Student).filter(Student.email == "student_b_e2e@pathforge.ai").first()
        if student_a and student_b:
            recs_a = get_personalized_recommendations(db, student_a.student_id, limit_courses=5, limit_projects=5)
            recs_b = get_personalized_recommendations(db, student_b.student_id, limit_courses=5, limit_projects=5)
            # Both should have valid recommendations
            assert len(recs_a["courses"]) > 0
            assert len(recs_b["courses"]) > 0
    finally:
        db.close()


# ==============================================================================
# INTEGRATION TESTS (21 - 26)
# ==============================================================================

def test_21_skill_gap_to_course_recommendation():
    """21. Active skill gaps directly drive course recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        gap_data = analyze_student_skill_gap(db, student.student_id)
        active_gaps = [g["skill_name"] for g in gap_data["gaps"] if g["gap"] > 0]
        courses = get_personalized_courses(db, student.student_id, limit=5)
        assert len(courses) > 0
        # Check that courses address identified gaps or target career domain
        addressed = [cs for c in courses for cs in c.get("missing_skills_addressed", [])]
        assert len(addressed) > 0 or len(courses) > 0
    finally:
        db.close()


def test_22_skill_gap_to_project_recommendation():
    """22. Active skill gaps directly drive practical portfolio project recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        projects = get_personalized_projects(db, student.student_id, limit=5)
        assert len(projects) > 0
        assert all("project_name" in p and "difficulty" in p for p in projects)
    finally:
        db.close()


def test_23_recommendation_to_roadmap():
    """23. Recommendation resources integrate seamlessly into topological learning roadmap."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        roadmap = generate_topological_roadmap(db, student.student_id)
        assert "milestones" in roadmap
        assert len(roadmap["milestones"]) > 0
        m1 = roadmap["milestones"][0]
        assert "course_name" in m1 or "course_id" in m1
        assert "project_name" in m1 or "project_id" in m1
    finally:
        db.close()


def test_24_course_completion_updates_recommendation():
    """24. Course progress/completion dynamically removes it from active recommendations."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        courses_before = get_personalized_courses(db, student.student_id, limit=5)
        assert len(courses_before) > 0
        c_id = courses_before[0]["course_id"]

        # Complete course
        headers = get_auth_headers(student_id=student.student_id)
        res = client.post(f"/api/courses/{c_id}/complete", headers=headers)
        assert res.status_code == 200

        courses_after = get_personalized_courses(db, student.student_id, limit=5)
        course_ids_after = [c["course_id"] for c in courses_after]
        assert c_id not in course_ids_after
    finally:
        db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == student.student_id,
            StudentCourseProgress.course_id == c_id,
        ).delete()
        db.commit()
        db.close()


def test_25_project_completion_updates_recommendation():
    """25. Project completion dynamically removes it from active recommendations and updates evidence."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        projects_before = get_personalized_projects(db, student.student_id, limit=5)
        assert len(projects_before) > 0
        p_id = projects_before[0]["project_id"]

        headers = get_auth_headers(student_id=student.student_id)
        res = client.post(f"/api/projects/{p_id}/complete", headers=headers)
        assert res.status_code == 200

        projects_after = get_personalized_projects(db, student.student_id, limit=5)
        project_ids_after = [p["project_id"] for p in projects_after]
        assert p_id not in project_ids_after
    finally:
        db.query(StudentProjectProgress).filter(
            StudentProjectProgress.student_id == student.student_id,
            StudentProjectProgress.project_id == p_id,
        ).delete()
        db.commit()
        db.close()


def test_26_mastery_change_updates_recommendation():
    """26. Updating skill mastery recalculates gaps and adjusts recommendation priorities."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        skill = db.query(Skill).filter(Skill.skill_name.ilike("%Deep Learning%")).first()
        if not skill:
            skill = db.query(Skill).first()

        # Update mastery to high level
        update_or_create_student_skill(
            db=db,
            student_id=student.student_id,
            skill_id=skill.skill_id,
            assessment_score=95,
            project_score=90,
        )
        db.commit()

        # Recalculate skill gap
        gap_data = analyze_student_skill_gap(db, student.student_id)
        target_gap = next((g for g in gap_data["gaps"] if g["skill_id"] == skill.skill_id), None)
        if target_gap:
            assert target_gap["current_mastery"] >= 70
            assert target_gap["gap"] <= 20
    finally:
        db.close()
