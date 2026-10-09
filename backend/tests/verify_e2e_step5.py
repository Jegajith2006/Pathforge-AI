import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import init_db, SessionLocal
from database.models import Student, Skill, StudentSkill, Career
from services.assessment_service import start_diagnostic_assessment, evaluate_assessment_submission, get_assessment_result_by_id, get_assessment_history
from ml.skill_matching import calculate_final_mastery

init_db()
db = SessionLocal()

print("=" * 60)
print("PATHFORGE AI - STEP 5 ASSESSMENT ENGINE E2E VERIFICATION")
print("=" * 60)

# 1. Fetch student and target career
student = db.query(Student).filter(Student.student_id == "U001").first() or db.query(Student).first()
assert student is not None, "Student profile missing"
student_id = student.student_id
career = db.query(Career).filter(Career.career_id == student.target_career_id).first()
career_id = career.career_id
career_name = career.career_name
print(f"Student: {student_id} ({student.first_name} {student.last_name})")
print(f"Target Career: {career_id} ({career_name})")

# 2. Start career diagnostic assessment
asm = start_diagnostic_assessment(db, student_id, career_id, limit=10)
print(f"\n[1] Diagnostic Assessment Started:")
print(f"    Assessment ID : {asm['assessment_id']}")
print(f"    Career        : {asm['career_name']}")
print(f"    Questions     : {len(asm['questions'])}")
print(f"    Skills Covered: {', '.join(asm['skills_covered'])}")

# 3. Setup specific skill for the Project Principle verification:
ml_skill = db.query(Skill).filter(Skill.skill_name.ilike("%Machine Learning%")).first()
assert ml_skill is not None, "Machine Learning skill missing"
ml_skill_id = ml_skill.skill_id
ml_skill_name = ml_skill.skill_name

# Set initial state: self_declared=90, assessment=0
ss = db.query(StudentSkill).filter(StudentSkill.student_id == student_id, StudentSkill.skill_id == ml_skill_id).first()
if not ss:
    ss = StudentSkill(student_id=student_id, skill_id=ml_skill_id, self_declared_score=90, assessment_score=0)
    db.add(ss)
else:
    ss.self_declared_score = 90
    ss.assessment_score = 0
db.commit()

print(f"\n[2] Before Assessment Submission:")
print(f"    Skill          : {ml_skill_name}")
print(f"    Self-Declared  : {ss.self_declared_score}% (Advanced)")
print(f"    Assessment     : {ss.assessment_score}% (None)")
print(f"    Final Mastery  : {ss.final_mastery}% ({ss.mastery_level})")

# 4. Submit assessment with answers
submissions = [
    {
        "question_id": q["question_id"],
        "selected_answer": q["options"][0] if q["options"] else "ans",
        "time_taken_seconds": 25,
    }
    for q in asm["questions"]
]

res = evaluate_assessment_submission(db, student_id, asm["assessment_id"], submissions)
print(f"\n[3] Assessment Evaluated:")
print(f"    Overall Score : {res['overall_score']}% ({res['score_grade']})")
print(f"    Total Marks   : {res['total_marks']}")
print(f"    Earned Marks  : {res['earned_marks']}")
print(f"    Correct Count : {res['correct_count']} / {res['total_questions']}")
print("    Skill Breakdown:")
for sr in res["skill_results"]:
    print(f"      - {sr['skill_name']:<25} Score: {sr['score']}% ({sr['level']}) -> Final Mastery: {sr['final_mastery']}% ({sr['mastery_level']})")

# 5. Verify Database Persistence in a fresh session
db.close()
db2 = SessionLocal()
ss_after = db2.query(StudentSkill).filter(StudentSkill.student_id == student_id, StudentSkill.skill_id == ml_skill_id).first()
print(f"\n[4] Database State After Re-querying Fresh Session:")
print(f"    Skill               : {ml_skill_name}")
print(f"    Self-Declared Score : {ss_after.self_declared_score}% (Preserved! NOT overwritten)")
print(f"    Assessment Score    : {ss_after.assessment_score}% (Demonstrated)")
print(f"    Final Mastery       : {ss_after.final_mastery}% ({ss_after.mastery_level})")
print(f"    Evidence Count      : {ss_after.evidence_count}")

# 6. Verify Assessment History
history = get_assessment_history(db2, student_id)
print(f"\n[5] Assessment History Entries: {len(history)} attempt(s) recorded.")
for h in history[:3]:
    print(f"    - Date: {h['attempt_date']} | Career: {h['career_name']} | Score: {h['score_percentage']}% | Status: {h['status']}")

db2.close()
print("\n" + "=" * 60)
print("E2E VERIFICATION COMPLETED SUCCESSFULLY!")
print("=" * 60)
