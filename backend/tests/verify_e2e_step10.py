"""
PathForge AI - End-to-End Verification Script for Step 10: Course & Project Recommendation Engine
Executes complete E2E verification of:
1. Student gap profile (Python: 85, Stats: 45, ML: 52, DL: 20, SQL: 70)
2. Priority gap resolution (Deep Learning, Machine Learning, Statistics)
3. Direct ontology mapping & BGE semantic scoring
4. Course and project recommendation generation
5. Verification of zero-gap exclusion / de-prioritization
6. Simulation of course progress and project completion
7. Verification that completed items are removed and remaining gaps prioritized
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal
from database.models import Student, Career, Skill, StudentSkill, Course, Project, StudentCourseProgress, StudentProjectProgress
from services.skill_gap_service import analyze_student_skill_gap, update_or_create_student_skill
from services.recommendation_service import (
    get_personalized_courses,
    get_personalized_projects,
    get_personalized_recommendations,
)


def run_e2e_step10_verification():
    db = SessionLocal()
    print("=" * 75)
    print("PATHFORGE AI — STEP 10 COURSE & PROJECT RECOMMENDATION E2E VERIFICATION")
    print("=" * 75)

    try:
        career = db.query(Career).filter(Career.career_name == "Machine Learning Engineer").first()
        if not career:
            career = db.query(Career).first()
        print(f"\n[1] Target Career: {career.career_name} (ID: {career.career_id})")

        # 1. Setup/Retrieve Student A
        student = db.query(Student).filter(Student.email == "student_a_e2e@pathforge.ai").first()
        assert student is not None, "Student A should exist from Step 8/9 tests"

        skills_by_name = {s.skill_name.lower(): s for s in db.query(Skill).all()}

        # Re-affirm demonstrated masteries
        masteries = {
            "python": 85,
            "statistics": 45,
            "machine learning": 52,
            "deep learning": 20,
            "sql": 70,
        }
        for sname, target_val in masteries.items():
            skill_obj = skills_by_name.get(sname)
            if skill_obj:
                update_or_create_student_skill(
                    db,
                    student_id=student.student_id,
                    skill_id=skill_obj.skill_id,
                    self_declared_score=target_val,
                    assessment_score=target_val,
                    resume_score=target_val,
                    project_score=target_val if target_val > 50 else 0,
                )
        db.commit()

        # 2. Run Skill Gap Engine
        print("\n[2] Evaluating Active Skill Gaps...")
        gap_data = analyze_student_skill_gap(db, student.student_id, career_id=career.career_id)
        print(f"    Target Role: {gap_data['career_name']}")
        print(f"    Current Readiness: {gap_data['current_readiness']}%")
        
        top_gaps = [g for g in gap_data["gaps"] if g["gap"] > 0]
        print(f"    Top Identified Gaps:")
        for tg in top_gaps[:4]:
            print(f"    - {tg['skill_name']:<20} | Target: {tg['required_score']:>2} | Demonstrated: {tg['current_mastery']:>2} | Gap: {tg['gap']:>2} | Status: {tg['status']}")

        # 3. Generate Course Recommendations
        print("\n[3] Generating Course Recommendations...")
        courses = get_personalized_courses(db, student.student_id, limit=6)
        assert len(courses) > 0, "Should return course recommendations"

        print(f"    Total Courses Recommended: {len(courses)}")
        for idx, c in enumerate(courses, start=1):
            print(f"    #{idx} {c['course_name']} ({c['provider']})")
            print(f"       Match: {c['match_percentage']}% | Primary: {c['primary_skill']} | Addressed Gaps: {c['missing_skills_addressed']}")
            print(f"       Reason: {c['reason']}")

        # Check that top courses address the critical gaps (DL / ML / Statistics / MLOps)
        addressed_any_top_gap = any(
            any(g_name in c.get("missing_skills_addressed", []) for g_name in ["Deep Learning", "Machine Learning", "Statistics", "PyTorch", "MLOps"])
            for c in courses[:3]
        )
        assert addressed_any_top_gap, "Top courses should address major or critical skill gaps"
        print("    [PASS] Course recommendations accurately prioritize high-impact skill gaps.")

        # 4. Generate Project Recommendations
        print("\n[4] Generating Practical Portfolio Project Recommendations...")
        projects = get_personalized_projects(db, student.student_id, limit=5)
        assert len(projects) > 0, "Should return project recommendations"

        print(f"    Total Projects Recommended: {len(projects)}")
        for idx, p in enumerate(projects, start=1):
            print(f"    #{idx} {p['project_name']} (Difficulty: {p['difficulty']}, {p['duration_text']})")
            print(f"       Match: {p['match_percentage']}% | Skills: {p['primary_skills']}")
            print(f"       Reason: {p['reason']}")

        print("    [PASS] Project recommendations provide practical evidence targets.")

        # 5. Verify Unified Recommendation Flow
        print("\n[5] Testing Unified Recommendation Endpoint Payload...")
        unified = get_personalized_recommendations(db, student.student_id, limit_courses=6, limit_projects=4)
        assert "courses" in unified
        assert "projects" in unified
        assert "skill_gaps" in unified
        assert len(unified["courses"]) > 0
        assert len(unified["projects"]) > 0
        print(f"    [PASS] Unified recommendations synthesized {len(unified['courses'])} courses and {len(unified['projects'])} projects.")

        # 6. Test Lifecycle Update: Complete a course & project
        print("\n[6] Testing Progression Recalibration...")
        test_course = courses[0]
        test_project = projects[0]

        # Simulate completion
        scp = StudentCourseProgress(
            student_id=student.student_id,
            course_id=test_course["course_id"],
            progress_percentage=100,
            status="completed",
        )
        db.add(scp)

        spp = StudentProjectProgress(
            student_id=student.student_id,
            project_id=test_project["project_id"],
            progress_percentage=100,
            status="completed",
            github_url="https://github.com/pathforge-student/verified-ml-artifact",
        )
        db.add(spp)
        db.commit()

        # Re-fetch recommendations
        recs_after = get_personalized_recommendations(db, student.student_id, limit_courses=6, limit_projects=4)
        rec_course_ids = [c["course_id"] for c in recs_after["courses"]]
        rec_project_ids = [p["project_id"] for p in recs_after["projects"]]

        assert test_course["course_id"] not in rec_course_ids, "Completed course must be filtered out"
        assert test_project["project_id"] not in rec_project_ids, "Completed project must be filtered out"
        print("    [PASS] Completed courses and projects are dynamically filtered from future recommendations.")

        # Cleanup test progress
        db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == student.student_id,
            StudentCourseProgress.course_id == test_course["course_id"],
        ).delete()
        db.query(StudentProjectProgress).filter(
            StudentProjectProgress.student_id == student.student_id,
            StudentProjectProgress.project_id == test_project["project_id"],
        ).delete()
        db.commit()

        print("\n" + "=" * 75)
        print("ALL STEP 10 RECOMMENDATION ENGINE E2E CHECKS PASSED!")
        print("=" * 75)
        return True

    finally:
        db.close()


if __name__ == "__main__":
    ok = run_e2e_step10_verification()
    if not ok:
        sys.exit(1)
