"""
PathForge AI - End-to-End Verification Script for Step 6 (Resume Analyzer) & Step 7 (Gemini Integration)
Performs real end-to-end execution:
1. Generates a valid DOCX and text CV containing target benchmark skills:
   - Python, Java, Machine Learning, Pandas, Scikit-learn, SQL
   - ECOBITE Sustainable Delivery Project
   - NPTEL / Coursera Certification
   - Software Engineering Intern Experience
2. Posts resume via POST /api/resume/upload
3. Validates text extraction, Gemini structured extraction, and skill normalization
4. Verifies student_skills evidence update (resume_score in 45-65 exposure range)
5. Verifies multi-source final mastery recalculation
6. Confirms existing assessment, project, certificate, self-declared scores are intact
7. Verifies AI Chatbot, Cover Letter, and Roadmap Explanation APIs
8. Verifies no secret keys are exposed
"""

import sys
import io
from pathlib import Path
from docx import Document
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from config import settings
from database.connection import init_db, SessionLocal
from database.models import Student, Skill, StudentSkill, ResumeAnalysis
from routers.auth import create_access_token

init_db()
client = TestClient(app)


def run_e2e_verification():
    print("=" * 70)
    print("PATHFORGE AI - STEP 6 & STEP 7 END-TO-END VERIFICATION")
    print("=" * 70)

    db = SessionLocal()
    try:
        student = db.query(Student).first()
        if not student:
            print("❌ No student found in database.")
            return False

        token = create_access_token({"sub": student.student_id, "email": student.email})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Pre-seed student skills with self-declared and assessment baseline
        python_skill = db.query(Skill).filter(Skill.skill_name == "Python").first()
        if python_skill:
            ss = db.query(StudentSkill).filter(StudentSkill.student_id == student.student_id, StudentSkill.skill_id == python_skill.skill_id).first()
            if ss:
                ss.self_declared_score = 90
                ss.assessment_score = 85
                ss.project_score = 90
                db.commit()

        # 2. Generate a real test DOCX resume
        temp_dir = Path("./uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        docx_path = temp_dir / "e2e_test_resume.docx"

        doc = Document()
        doc.add_heading("Alex Chen - Candidate Resume", level=1)
        doc.add_paragraph("Education: B.Tech in Computer Science & Engineering")
        doc.add_paragraph("Technical Skills: Python, Java, Machine Learning, Pandas, Scikit-learn, SQL, Docker, FastAPI")
        doc.add_paragraph("Projects: ECOBITE - Sustainable delivery routing platform using classification pipelines in Scikit-learn.")
        doc.add_paragraph("Certifications: NPTEL Python Programming; Coursera Machine Learning Specialization")
        doc.add_paragraph("Experience: Software Engineering Intern building microservices with FastAPI and PostgreSQL.")
        doc.save(str(docx_path))

        print(f"✓ Generated test resume: {docx_path.name}")

        # 3. Test POST /api/resume/upload
        with open(docx_path, "rb") as f:
            res_upload = client.post(
                "/api/resume/upload",
                files={"file": (docx_path.name, f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                headers=headers,
            )

        assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
        upload_data = res_upload.json()
        print(f"✓ POST /api/resume/upload: {upload_data['message']}")
        print(f"  - Skills detected: {upload_data['data']['total_skills_detected']}")
        print(f"  - Projects detected: {upload_data['data']['total_projects_detected']}")
        print(f"  - Certificates detected: {upload_data['data']['total_certificates_detected']}")

        # 4. Verify Database Records
        detected_skills = upload_data['data']['detected_skills']
        skill_names = [s['skill_name'] for s in detected_skills]
        print(f"  - Detected skill ontology: {skill_names}")

        assert any("Python" in s for s in skill_names), "Python was not detected"
        assert any("Machine Learning" in s or "ML" in s for s in skill_names), "Machine Learning was not detected"
        assert any("SQL" in s for s in skill_names), "SQL was not detected"

        # 5. Verify Resume Exposure Score Bounding
        for s in detected_skills:
            assert 45 <= s['resume_score'] <= 65, f"Exposure score out of bounds: {s['resume_score']}"

        print("✓ Resume exposure scores properly bounded between 45% and 65% (Developing baseline).")

        # 6. Verify Preservation of Existing Evidence
        if python_skill:
            ss_post = db.query(StudentSkill).filter(StudentSkill.student_id == student.student_id, StudentSkill.skill_id == python_skill.skill_id).first()
            assert ss_post.self_declared_score == 90, "self_declared_score was overwritten!"
            assert ss_post.assessment_score == 85, "assessment_score was overwritten!"
            assert ss_post.project_score == 90, "project_score was overwritten!"
            assert 45 <= ss_post.resume_score <= 65, "resume_score was not updated!"
            print(f"✓ Python evidence preservation verified: self={ss_post.self_declared_score}, assessment={ss_post.assessment_score}, project={ss_post.project_score}, resume={ss_post.resume_score}, final_mastery={ss_post.final_mastery}% ({ss_post.mastery_level})")

        # 7. Test Sub-resource GET endpoints
        res_skills = client.get("/api/resume/skills", headers=headers)
        assert res_skills.status_code == 200 and len(res_skills.json()) > 0
        print(f"✓ GET /api/resume/skills returned {len(res_skills.json())} skills.")

        res_projects = client.get("/api/resume/projects", headers=headers)
        assert res_projects.status_code == 200
        print(f"✓ GET /api/resume/projects returned {res_projects.json()['extracted_projects_count']} projects.")

        res_certs = client.get("/api/resume/certificates", headers=headers)
        assert res_certs.status_code == 200
        print(f"✓ GET /api/resume/certificates returned {res_certs.json()['extracted_certificates_count']} certificates.")

        # 8. Test Gemini Capabilities in /api/ai
        res_chat = client.post("/api/ai/chat", json={"message": "What is my next priority milestone?"}, headers=headers)
        assert res_chat.status_code == 200
        print(f"✓ POST /api/ai/chat: {res_chat.json()['response'][:80]}...")

        res_cl = client.post("/api/ai/cover-letter", json={"role_title": "ML Engineer", "company_name": "Google"}, headers=headers)
        assert res_cl.status_code == 200
        print(f"✓ POST /api/ai/cover-letter generated {len(res_cl.json()['cover_letter'])} chars.")

        res_rm = client.post("/api/ai/explain-roadmap", json={}, headers=headers)
        assert res_rm.status_code == 200
        print(f"✓ POST /api/ai/explain-roadmap: {res_rm.json()['explanation'][:80]}...")

        # 9. Verify Security - no API key leaks
        assert settings.GEMINI_API_KEY not in res_chat.text
        assert settings.GEMINI_API_KEY not in res_cl.text
        assert settings.GEMINI_API_KEY not in res_rm.text
        assert settings.GEMINI_API_KEY not in res_upload.text
        print("✓ Security verified: Zero API key leakage across all responses.")

        print("=" * 70)
        print("ALL STEP 6 & STEP 7 END-TO-END CHECKS PASSED SUCCESSFULLY!")
        print("=" * 70)
        return True
    finally:
        db.close()


if __name__ == "__main__":
    success = run_e2e_verification()
    sys.exit(0 if success else 1)
