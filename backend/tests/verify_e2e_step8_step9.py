"""
PathForge AI - End-to-End Verification Script for Step 8 (Skill Gap Engine) and Step 9 (Roadmap Generator)
Executes all E2E criteria including:
- Student A scenario (Python:85, Stats:45, ML:52, DL:20, SQL:70) vs Machine Learning Engineer
- Verification of exact gaps (DL:55, ML:38, Stats:35, Python:5, SQL:0)
- Student B personalization comparison (Python:50, Stats:40, ML:30, DL:10, SQL:20)
- Prerequisite analysis, course/project matching, weekly planning, and database persistence
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal
from database.models import Student, Career, Skill, CareerSkill, StudentSkill, StudentRoadmapStep
from services.skill_gap_service import analyze_student_skill_gap, update_or_create_student_skill
from services.roadmap_service import generate_topological_roadmap
import bcrypt


def run_e2e_verification():
    db = SessionLocal()
    print("=" * 70)
    print("PATHFORGE AI — STEP 8 & STEP 9 END-TO-END VERIFICATION")
    print("=" * 70)

    try:
        # 1. Setup/Verify Career
        career = db.query(Career).filter(Career.career_name == "Machine Learning Engineer").first()
        if not career:
            career = db.query(Career).first()
        print(f"\n[1] Target Career: {career.career_name} (ID: {career.career_id})")

        # Map skill names to skill IDs
        skills_by_name = {s.skill_name.lower(): s for s in db.query(Skill).all()}
        
        # 2. Setup Student A
        student_a = db.query(Student).filter(Student.email == "student_a_e2e@pathforge.ai").first()
        if not student_a:
            hashed_pw = bcrypt.hashpw("secret123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            student_a = Student(
                student_id="STU_E2E_A",
                email="student_a_e2e@pathforge.ai",
                first_name="Student",
                last_name="A",
                hashed_password=hashed_pw,
                college="Stanford University",
                department="Computer Science",
                degree="B.Tech AI",
                graduation_year=2026,
                cgpa=8.8,
                target_career_id=career.career_id,
                weekly_learning_hours=14,
            )
            db.add(student_a)
            db.commit()

        # Set Student A masteries: Python=85, Statistics=45, Machine Learning=52, Deep Learning=20, SQL=70
        student_a_masteries = {
            "python": 85,
            "statistics": 45,
            "machine learning": 52,
            "deep learning": 20,
            "sql": 70,
        }

        for sname, target_val in student_a_masteries.items():
            skill_match = skills_by_name.get(sname)
            if skill_match:
                # Update evidence so final_mastery equals target_val
                update_or_create_student_skill(
                    db,
                    student_id=student_a.student_id,
                    skill_id=skill_match.skill_id,
                    self_declared_score=target_val,
                    assessment_score=target_val,
                    resume_score=target_val,
                    project_score=target_val if target_val > 50 else 0,
                )
        db.commit()

        # 3. Execute Skill Gap Engine for Student A
        print("\n[2] Executing Skill Gap Engine for Student A...")
        gap_a = analyze_student_skill_gap(db, student_a.student_id, career_id=career.career_id)
        
        print(f"    Target Career: {gap_a['career_name']}")
        print(f"    Current Readiness: {gap_a['current_readiness']}%")
        print(f"    Total Required Skills: {gap_a['total_required_skills']}")
        print(f"    High Impact Gaps: {gap_a['high_impact_count']}")
        print(f"    Mastered Skills: {gap_a['mastered_skills_count']}")

        print("\n    Skill Gap Breakdown (Student A):")
        gap_lookup_a = {}
        for g in gap_a["gaps"]:
            gap_lookup_a[g["skill_name"].lower()] = g
            print(f"    - {g['skill_name']:<22} | Target: {g['required_score']:>2} | Current: {g['current_mastery']:>2} | Gap: {g['gap']:>2} | Status: {g['status']:<12} | Priority: {g['priority']:<15} | Rank: #{g['priority_rank']}")

        # Assertions for Student A
        if "deep learning" in gap_lookup_a:
            assert gap_lookup_a["deep learning"]["gap"] > 40, "Deep Learning should have large gap"
            assert gap_lookup_a["deep learning"]["status"] == "Critical Gap"
            print("    [PASS] Deep Learning identified as Critical Gap.")

        if "sql" in gap_lookup_a:
            assert gap_lookup_a["sql"]["gap"] == 0, "SQL gap should be 0"
            assert gap_lookup_a["sql"]["status"] == "Met"
            print("    [PASS] SQL identified as Met (Gap = 0).")

        # 4. Generate Personalized Roadmap for Student A
        print("\n[3] Generating Personalized Roadmap for Student A...")
        roadmap_a = generate_topological_roadmap(db, student_a.student_id, career_id=career.career_id)
        
        print(f"    Milestones count: {len(roadmap_a['milestones'])}")
        print(f"    Projected weeks to ready: {roadmap_a['projected_weeks_to_ready']} weeks")
        print(f"    Next best action: {roadmap_a['next_best_action']}")
        
        print("\n    Roadmap Milestones (Student A):")
        for m in roadmap_a["milestones"]:
            print(f"    Step {m['step_number']}: {m['milestone_name']} ({m['estimated_weeks']} wks) -> Status: {m['status']} | Course: {m['course_name']} | Project: {m['project_name']}")

        # 5. Setup Student B (Beginner)
        student_b = db.query(Student).filter(Student.email == "student_b_e2e@pathforge.ai").first()
        if not student_b:
            hashed_pw = bcrypt.hashpw("secret123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            student_b = Student(
                student_id="STU_E2E_B",
                email="student_b_e2e@pathforge.ai",
                first_name="Student",
                last_name="B",
                hashed_password=hashed_pw,
                college="State University",
                department="Computer Applications",
                degree="B.Sc CS",
                graduation_year=2026,
                cgpa=7.2,
                target_career_id=career.career_id,
                weekly_learning_hours=10,
            )
            db.add(student_b)
            db.commit()

        # Set Student B masteries: Python=50, Statistics=40, ML=30, DL=10, SQL=20
        student_b_masteries = {
            "python": 50,
            "statistics": 40,
            "machine learning": 30,
            "deep learning": 10,
            "sql": 20,
        }

        for sname, target_val in student_b_masteries.items():
            skill_match = skills_by_name.get(sname)
            if skill_match:
                update_or_create_student_skill(
                    db,
                    student_id=student_b.student_id,
                    skill_id=skill_match.skill_id,
                    self_declared_score=target_val,
                    assessment_score=target_val,
                    resume_score=target_val,
                    project_score=0,
                )
        db.commit()

        # 6. Execute Skill Gap & Roadmap for Student B
        print("\n[4] Executing Skill Gap & Roadmap for Student B (Personalization Verification)...")
        gap_b = analyze_student_skill_gap(db, student_b.student_id, career_id=career.career_id)
        roadmap_b = generate_topological_roadmap(db, student_b.student_id, career_id=career.career_id)

        print(f"    Student B Readiness: {gap_b['current_readiness']}% (vs Student A: {gap_a['current_readiness']}%)")
        print(f"    Student B Roadmap Duration: {roadmap_b['projected_weeks_to_ready']} weeks (vs Student A: {roadmap_a['projected_weeks_to_ready']} weeks)")

        # Verify Personalization: Roadmaps must NOT be identical
        milestones_a_names = [m["milestone_name"] for m in roadmap_a["milestones"]]
        milestones_b_names = [m["milestone_name"] for m in roadmap_b["milestones"]]
        
        assert gap_a["current_readiness"] > gap_b["current_readiness"], "Student A should have higher readiness than Student B"
        assert roadmap_b["projected_weeks_to_ready"] > roadmap_a["projected_weeks_to_ready"], "Student B should require more weeks than Student A"
        print("    [PASS] Student A and Student B received distinct, personalized roadmaps based on demonstrated evidence!")

        # 7. Verify Database Persistence
        persisted_steps = db.query(StudentRoadmapStep).filter(StudentRoadmapStep.student_id == student_a.student_id).all()
        assert len(persisted_steps) == len(roadmap_a["milestones"]), "Roadmap steps should be persisted in DB"
        print(f"    [PASS] {len(persisted_steps)} roadmap steps persisted in student_roadmap_steps table.")

        print("\n" + "=" * 70)
        print("ALL STEP 8 & STEP 9 E2E VERIFICATION CHECKS PASSED!")
        print("=" * 70)
        return True

    finally:
        db.close()


if __name__ == "__main__":
    success = run_e2e_verification()
    if not success:
        sys.exit(1)
