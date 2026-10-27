import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"


def request(method, path, data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_headers = dict(response.info())
            resp_data = json.loads(response.read().decode("utf-8"))
            return response.status, resp_data, resp_headers
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {"detail": err_body}
        return e.code, err_json, dict(e.headers)


def test_http_sequence():
    print("--- 1. Testing Health ---")
    st, data, hd = request("GET", "/health")
    assert st == 200, f"Health failed: {data}"
    print(f"Health OK: {data}")

    # Register Student A
    email_a = f"alice_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "first_name": "Alice",
        "last_name": "Chen",
        "email": email_a,
        "password": "Password123!",
        "college": "Stanford",
        "department": "CS",
        "degree": "BS",
        "graduation_year": 2026,
        "cgpa": 9.2,
        "target_career_id": "C001",
        "weekly_learning_hours": 15,
        "preferred_difficulty": "Adaptive",
        "learning_mode": "Project-based",
    }
    st, data, hd = request("POST", "/api/auth/register", reg_payload)
    assert st == 200, f"Register failed: {data}"
    token_a = data["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"Registered Student A: {email_a}")

    # --- Test A: Machine Learning Engineer (C001) ---
    print("\n--- Test A: Machine Learning Engineer (C001) ---")
    st, data, hd = request("POST", "/api/career/select", {"career_id": "C001"}, headers_a)
    assert st == 200

    # Verify profile target career
    st, me, _ = request("GET", "/api/auth/me", headers=headers_a)
    assert st == 200
    assert me["target_career_id"] == "C001"
    print(f"Active Career: {me['target_career_name']} ({me['target_career_id']})")

    # Fetch courses
    st, courses_ml, hd_ml = request("GET", "/api/courses", headers=headers_a)
    assert st == 200
    print(f"ML Engineer course count: {len(courses_ml)}")
    assert len(courses_ml) == 94, f"Expected 94 ML courses, got {len(courses_ml)}"
    ml_ids = {c["course_id"] for c in courses_ml}
    assert "CR004" in ml_ids, "CR004 (Deep Learning) must be in ML courses"
    assert "CR005" in ml_ids, "CR005 (Advanced Deep Learning) must be in ML courses"
    assert hd_ml.get("x-active-career-id") == "C001" or hd_ml.get("X-Active-Career-Id") == "C001"
    print("PASS: Test A passed perfectly!")

    # --- Test B: Full Stack Developer (C012) ---
    print("\n--- Test B: Full Stack Developer (C012) ---")
    st, sel_b, _ = request("POST", "/api/career/select", {"career_id": "C012"}, headers=headers_a)
    assert st == 200
    print(f"Career Selection Result: {sel_b['message']}")

    # Verify profile active career
    st, me_b, _ = request("GET", "/api/auth/me", headers=headers_a)
    assert me_b["target_career_id"] == "C012"
    print(f"Switched Career: {me_b['target_career_name']} ({me_b['target_career_id']})")

    # Fetch refreshed courses
    st, courses_fsd, hd_fsd = request("GET", "/api/courses", headers=headers_a)
    assert st == 200
    print(f"Full Stack Developer course count: {len(courses_fsd)}")
    assert len(courses_fsd) == 55, f"Expected 55 FSD courses, got {len(courses_fsd)}"
    fsd_ids = {c["course_id"] for c in courses_fsd}
    assert "CR004" not in fsd_ids, "CR004 (Deep Learning) must NOT be in FSD courses"
    assert "CR005" not in fsd_ids, "CR005 (Advanced Deep Learning) must NOT be in FSD courses"
    print("PASS: Test B passed perfectly!")

    # --- Test C: Cloud Data Engineer (C023), Filters, and Logout/Login ---
    print("\n--- Test C: Cloud Data Engineer (C023) & Filters ---")
    st, _, _ = request("POST", "/api/career/select", {"career_id": "C023"}, headers=headers_a)
    assert st == 200

    st, courses_cde, _ = request("GET", "/api/courses", headers=headers_a)
    assert st == 200
    print(f"Cloud Data Engineer course count: {len(courses_cde)}")
    assert len(courses_cde) == 48, f"Expected 48 CDE courses, got {len(courses_cde)}"

    # Search filter
    st, search_sql, _ = request("GET", "/api/courses?search=SQL", headers=headers_a)
    assert st == 200
    print(f"Search 'SQL' within CDE returned: {len(search_sql)} courses")
    assert 0 < len(search_sql) < 48

    # Difficulty filter
    st, diff_int, _ = request("GET", "/api/courses?difficulty=Intermediate", headers=headers_a)
    assert st == 200
    print(f"Difficulty 'Intermediate' within CDE returned: {len(diff_int)} courses")
    assert 0 < len(diff_int) < 48

    # Priority filter
    st, prio_high, _ = request("GET", "/api/courses?priority=high_priority", headers=headers_a)
    assert st == 200
    print(f"Priority 'high_priority' within CDE returned: {len(prio_high)} courses")

    # Re-login (simulating logout/login)
    st, login_data, _ = request("POST", "/api/auth/login", {"email": email_a, "password": "Password123!"})
    assert st == 200
    new_token = login_data["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}

    st, me_restored, _ = request("GET", "/api/auth/me", headers=new_headers)
    assert st == 200
    assert me_restored["target_career_id"] == "C023"
    print(f"Saved active career persisted after re-login: {me_restored['target_career_name']} ({me_restored['target_career_id']})")

    st, courses_restored, _ = request("GET", "/api/courses", headers=new_headers)
    assert len(courses_restored) == 48
    print("PASS: Test C passed perfectly!")

    # --- Test D: Unmapped Career / Strict Empty State ---
    print("\n--- Test D: Career with 0 Courses / Strict Empty State ---")
    # Query with non-existent or unmapped career ID
    st, empty_courses, hd_empty = request("GET", "/api/courses?career_id=C999", headers=headers_a)
    assert st == 404, f"Expected 404 for invalid career, got {st}"

    # Verify view_all returns all courses (160)
    st, all_courses, _ = request("GET", "/api/courses?view_all=true", headers=headers_a)
    assert st == 200
    print(f"View All (Global Catalog) returns: {len(all_courses)} courses")
    assert len(all_courses) == 160

    print("PASS: Test D passed perfectly!")

    # --- Test E: Student Isolation ---
    print("\n--- Test E: Student Isolation ---")
    email_b = f"bob_{uuid.uuid4().hex[:6]}@example.com"
    reg_b = dict(reg_payload, email=email_b, target_career_id="C012")
    st, data_b, _ = request("POST", "/api/auth/register", reg_b)
    assert st == 200
    headers_b = {"Authorization": f"Bearer {data_b['access_token']}"}

    # Student B should see 55 courses for C012
    st, courses_b, _ = request("GET", "/api/courses", headers=headers_b)
    assert len(courses_b) == 55

    # Student A still sees 48 courses for C023
    st, courses_a, _ = request("GET", "/api/courses", headers=headers_a)
    assert len(courses_a) == 48
    print(f"Student A sees {len(courses_a)} courses (C023) and Student B sees {len(courses_b)} courses (C012)")
    print("PASS: Test E passed perfectly!")

    print("\n=======================================================")
    print("SUCCESS: ALL CAREER FILTER TESTS VERIFIED END-TO-END!")
    print("=======================================================")


if __name__ == "__main__":
    test_http_sequence()
