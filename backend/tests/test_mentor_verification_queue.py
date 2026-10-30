import io
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from config import settings

client = TestClient(app)

def test_mentor_verification_lifecycle():
    # -------------------------------------------------------------
    # Step A: Test File Upload Endpoint for Verification Evidence
    # -------------------------------------------------------------
    # 1. Reject invalid file format
    bad_file = io.BytesIO(b"malicious script content")
    res_bad = client.post(
        "/api/auth/register/mentor/upload-verification",
        files={"file": ("malware.exe", bad_file, "application/octet-stream")},
    )
    assert res_bad.status_code == 400
    assert "unsupported file format" in res_bad.json()["detail"].lower()

    # 2. Reject empty file
    empty_file = io.BytesIO(b"")
    res_empty = client.post(
        "/api/auth/register/mentor/upload-verification",
        files={"file": ("empty.pdf", empty_file, "application/pdf")},
    )
    assert res_empty.status_code == 400
    assert "empty" in res_empty.json()["detail"].lower()

    # 3. Successful evidence document upload (PDF)
    doc_content = b"%PDF-1.4 Mock verification credential document for Dr. Elena Vance"
    good_file = io.BytesIO(doc_content)
    upload_res = client.post(
        "/api/auth/register/mentor/upload-verification",
        files={"file": ("elena_stanford_phd.pdf", good_file, "application/pdf")},
    )
    assert upload_res.status_code == 200, upload_res.text
    upload_data = upload_res.json()
    assert upload_data["status"] == "success"
    uploaded_filename = upload_data["file_name"]
    assert uploaded_filename.startswith("verif_")

    # 4. Verify that verification file is NOT publicly accessible via static /uploads mount
    public_attempt = client.get(f"/uploads/{uploaded_filename}")
    assert public_attempt.status_code == 404, "Verification files must not be publicly exposed via static /uploads"

    # -------------------------------------------------------------
    # Step B: Register a new mentor with the uploaded verification file
    # -------------------------------------------------------------
    unique = uuid.uuid4().hex[:6]
    mentor_email = f"applicant.mentor.{unique}@pathforge.ai"
    reg_res = client.post("/api/auth/register/mentor", json={
        "name": f"Dr. Elena Vance {unique}",
        "email": mentor_email,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "title": "Senior AI Research Scientist",
        "experience_years": 8,
        "expertise_areas": ["Machine Learning", "Generative AI"],
        "company": "Black Mesa Research Labs",
        "linkedin_url": "https://linkedin.com/in/elena-vance",
        "verification_document": uploaded_filename,
        "verification_notes": "Ph.D. in Computer Science from Stanford University, 8 years industry research at Black Mesa.",
        "bio": "Specialized in deep learning architectures and reinforcement learning.",
    })
    assert reg_res.status_code == 200, reg_res.text
    reg_data = reg_res.json()
    assert reg_data["verification_status"] == "Pending Review"
    mentor_id = reg_data["mentor_id"]
    mentor_token = reg_data["access_token"]
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}

    # -------------------------------------------------------------
    # Step C: Register a student and have student request mentorship
    # -------------------------------------------------------------
    student_email = f"student.applicant.{unique}@pathforge.ai"
    s_reg = client.post("/api/auth/register/student", json={
        "first_name": "Gordon",
        "last_name": "Freeman",
        "email": student_email,
        "password": "Password123!",
    })
    assert s_reg.status_code == 200, s_reg.text
    student_token = s_reg.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    req_res = client.post("/api/mentor/request", json={
        "mentor_id": mentor_id,
        "career_goal": "Machine Learning Engineer",
        "message": "Hello Dr. Vance, I would like guidance on reinforcement learning research.",
    }, headers=student_headers)
    assert req_res.status_code == 200, req_res.text
    request_id = req_res.json()["request_id"]

    # -------------------------------------------------------------
    # Step D: Pending mentor attempts to accept -> Must be blocked (403 Forbidden)
    # -------------------------------------------------------------
    block_res = client.post(
        f"/api/mentor/requests/{request_id}/accept",
        json={"status": "accepted", "response_note": "Welcome to my research group!"},
        headers=mentor_headers,
    )
    assert block_res.status_code == 403, "Pending mentor must be forbidden from accepting requests"
    assert "pending or rejected" in block_res.json()["detail"].lower()

    # -------------------------------------------------------------
    # Step E: Admin audits verification queue
    # -------------------------------------------------------------
    admin_login = client.post("/api/auth/login", json={
        "email": "organizer@gmail.com",
        "password": "admin@123",
    })
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    queue_res = client.get("/api/admin/mentors/verification-queue?status=Pending Review", headers=admin_headers)
    assert queue_res.status_code == 200, queue_res.text
    queue_data = queue_res.json()
    assert "counts" in queue_data
    assert queue_data["counts"]["pending"] >= 1
    found = [m for m in queue_data["items"] if m["mentor_id"] == mentor_id]
    assert len(found) == 1
    applicant = found[0]
    assert applicant["verification_document"] == uploaded_filename
    assert "Ph.D." in applicant["verification_notes"]

    # -------------------------------------------------------------
    # Step F: Admin securely inspects and downloads proof file
    # -------------------------------------------------------------
    # Unauthorized download without token must fail
    unauth_doc = client.get(f"/api/admin/mentors/{mentor_id}/document-file")
    assert unauth_doc.status_code == 401

    # Student cannot download mentor's proof document
    student_doc = client.get(f"/api/admin/mentors/{mentor_id}/document-file", headers=student_headers)
    assert student_doc.status_code == 403

    # Admin downloads securely
    admin_doc = client.get(f"/api/admin/mentors/{mentor_id}/document-file", headers=admin_headers)
    assert admin_doc.status_code == 200
    assert admin_doc.content == doc_content

    # -------------------------------------------------------------
    # Step G: Admin approves mentor & Notification is delivered
    # -------------------------------------------------------------
    approve_res = client.post(f"/api/admin/mentors/{mentor_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["verification_status"] == "Approved"

    # Verify notification created for mentor
    notif_res = client.get("/api/mentor/notifications", headers=mentor_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    approval_notif = next((n for n in notifs if n.get("type") == "verification_approved"), None)
    assert approval_notif is not None, "Notification must be generated when mentor application is approved"
    assert "approved" in approval_notif["title"].lower()

    # Approved mentor can now accept the mentorship request
    accept_res = client.post(
        f"/api/mentor/requests/{request_id}/accept",
        json={"status": "accepted", "response_note": "Approved by admin. Welcome to the cohort!"},
        headers=mentor_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # -------------------------------------------------------------
    # Step H: Rejection workflow & Notification
    # -------------------------------------------------------------
    unique2 = uuid.uuid4().hex[:6]
    reject_email = f"unverified.mentor.{unique2}@pathforge.ai"
    reg_res2 = client.post("/api/auth/register/mentor", json={
        "name": f"Invalid Applicant {unique2}",
        "email": reject_email,
        "password": "Password123!",
        "title": "Junior Hobbyist",
        "experience_years": 1,
        "expertise_areas": ["Web Design"],
        "verification_document": "https://invalid-proof.example/none",
        "verification_notes": "Self-taught hobbyist",
    })
    assert reg_res2.status_code == 200
    mentor_id2 = reg_res2.json()["mentor_id"]
    mentor_token2 = reg_res2.json()["access_token"]
    mentor_headers2 = {"Authorization": f"Bearer {mentor_token2}"}

    reject_res = client.post(
        f"/api/admin/mentors/{mentor_id2}/reject",
        json={"reason": "Insufficient verified industry experience (minimum 3 years required)."},
        headers=admin_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["verification_status"] == "Rejected"
    assert "Insufficient" in reject_res.json()["rejection_reason"]

    # Verify rejection notification
    notif_res2 = client.get("/api/mentor/notifications", headers=mentor_headers2)
    assert notif_res2.status_code == 200
    notifs2 = notif_res2.json()
    reject_notif = next((n for n in notifs2 if n.get("type") == "verification_rejected"), None)
    assert reject_notif is not None, "Notification must be generated when mentor application is rejected"
    assert "Insufficient" in reject_notif["message"]


def test_mentor_registration_validation_errors():
    """Verify input validation errors on mentor registration."""
    # 1. Missing name
    res1 = client.post("/api/auth/register/mentor", json={
        "name": "",
        "email": "test@pathforge.ai",
        "password": "Password123!",
        "title": "Engineer",
    })
    assert res1.status_code in [400, 422]

    # 2. Password mismatch
    res2 = client.post("/api/auth/register/mentor", json={
        "name": "Dr. Name",
        "email": f"mismatch.{uuid.uuid4().hex[:6]}@pathforge.ai",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
        "title": "Engineer",
    })
    assert res2.status_code == 400
    assert "match" in res2.json()["detail"].lower()

    # 3. Password too short (< 6 chars)
    res3 = client.post("/api/auth/register/mentor", json={
        "name": "Dr. Name",
        "email": f"short.{uuid.uuid4().hex[:6]}@pathforge.ai",
        "password": "123",
        "title": "Engineer",
    })
    assert res3.status_code in [400, 422]
