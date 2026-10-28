import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err_json = json.loads(e.read().decode())
        except Exception:
            err_json = {"detail": str(e)}
        return e.code, err_json
    except Exception as ex:
        return 0, {"error": str(ex)}

def main():
    print("=" * 60)
    print("PATHFORGE AI — REGISTRATION & LOGIN COMPREHENSIVE TEST")
    print("=" * 60)

    # 1. Health check
    code, data = request("GET", "/health")
    print(f"\n[1] Health Check: Code {code}, Response: {data}")
    assert code == 200, "Health check failed"

    # Unique test emails
    uid = uuid.uuid4().hex[:6]
    student_email = f"student.test.{uid}@example.com"
    mentor_email = f"mentor.test.{uid}@example.com"
    password = "SecurePassword123!"

    # 2. Register New Student (Direct without email OTP)
    print(f"\n[2] Registering New Student ({student_email})...")
    st_payload = {
        "first_name": "TestStudent",
        "last_name": "Direct",
        "email": student_email,
        "password": password,
        "confirm_password": password,
        "college": "MIT",
        "department": "EECS",
        "degree": "B.S. CS",
        "graduation_year": 2026,
        "cgpa": 9.2,
        "target_career_id": "C001",
        "terms_agreed": True
    }
    st_code, st_res = request("POST", "/api/auth/register/student", st_payload)
    print(f"    Response Code: {st_code}")
    print(f"    Returned Student ID: {st_res.get('student_id')}")
    print(f"    Role: {st_res.get('role')}")
    print(f"    Access Token Present: {'access_token' in st_res}")
    assert st_code == 200, f"Student registration failed: {st_res}"
    assert "access_token" in st_res, "Access token missing from student registration response"
    assert st_res.get("role") == "student", "Role mismatch"
    new_student_token = st_res["access_token"]

    # 3. Log in with the New Student Account
    print(f"\n[3] Logging in as New Student ({student_email})...")
    login_code, login_res = request("POST", "/api/auth/login", {
        "email": student_email,
        "password": password,
        "role": "student"
    })
    print(f"    Login Code: {login_code}, Access Token Present: {'access_token' in login_res}")
    assert login_code == 200, f"Student login failed: {login_res}"
    student_auth_token = login_res["access_token"]

    # 4. Access Student Dashboard / Profile with token
    print("\n[4] Accessing Student Profile with New Student Token...")
    prof_code, prof_res = request("GET", "/api/profile", token=student_auth_token)
    print(f"    Profile Code: {prof_code}, Name: {prof_res.get('full_name')}, Email: {prof_res.get('email')}")
    assert prof_code == 200, f"Failed accessing student profile: {prof_res}"

    # 5. Register New Mentor (Direct without email OTP)
    print(f"\n[5] Registering New Mentor ({mentor_email})...")
    mentor_payload = {
        "name": "Dr. Sarah Direct",
        "email": mentor_email,
        "password": password,
        "confirm_password": password,
        "title": "Principal AI Researcher",
        "experience_years": 8,
        "expertise_areas": ["Machine Learning", "System Design"],
        "company": "DeepMind AI Labs",
        "bio": "Experienced researcher in deep learning architectures.",
        "terms_agreed": True
    }
    m_code, m_res = request("POST", "/api/auth/register/mentor", mentor_payload)
    print(f"    Response Code: {m_code}")
    print(f"    Returned Mentor ID: {m_res.get('mentor_id') or m_res.get('student_id')}")
    print(f"    Role: {m_res.get('role')}")
    print(f"    Access Token Present: {'access_token' in m_res}")
    assert m_code == 200, f"Mentor registration failed: {m_res}"
    assert "access_token" in m_res, "Access token missing from mentor registration response"
    assert m_res.get("role") == "mentor", "Role mismatch"

    # 6. Log in with the New Mentor Account
    print(f"\n[6] Logging in as New Mentor ({mentor_email})...")
    m_login_code, m_login_res = request("POST", "/api/auth/login", {
        "email": mentor_email,
        "password": password,
        "role": "mentor"
    })
    print(f"    Mentor Login Code: {m_login_code}, Access Token Present: {'access_token' in m_login_res}")
    assert m_login_code == 200, f"Mentor login failed: {m_login_res}"
    mentor_auth_token = m_login_res["access_token"]

    # 7. Access Mentor Portal (Dashboard, Students, Messages)
    print("\n[7] Accessing Mentor Portal Endpoints...")
    dash_code, dash_res = request("GET", "/api/mentor/dashboard", token=mentor_auth_token)
    print(f"    GET /api/mentor/dashboard -> Code {dash_code}")
    assert dash_code == 200, f"Mentor dashboard failed: {dash_res}"

    st_list_code, st_list_res = request("GET", "/api/mentor/students", token=mentor_auth_token)
    print(f"    GET /api/mentor/students -> Code {st_list_code}, Students count: {len(st_list_res)}")
    assert st_list_code == 200, f"Mentor students endpoint failed: {st_list_res}"

    msg_code, msg_res = request("GET", "/api/mentor/messages", token=mentor_auth_token)
    print(f"    GET /api/mentor/messages -> Code {msg_code}, Conversations count: {len(msg_res)}")
    assert msg_code == 200, f"Mentor messages endpoint failed: {msg_res}"

    # 8. Test Existing Pre-seeded Accounts
    print("\n[8] Testing Existing Accounts Compatibility...")
    alex_code, alex_res = request("POST", "/api/auth/login", {
        "email": "alex.chen@stanford.edu",
        "password": "password123",
        "role": "student"
    })
    print(f"    Existing Student (Alex Chen) Login -> Code {alex_code}, Name: {alex_res.get('name')}")
    assert alex_code == 200, f"Alex Chen login failed: {alex_res}"

    arun_code, arun_res = request("POST", "/api/auth/login", {
        "email": "arun.kumar@pathforge.ai",
        "password": "password123",
        "role": "mentor"
    })
    print(f"    Existing Mentor (Dr. Arun Kumar) Login -> Code {arun_code}, Name: {arun_res.get('name')}")
    assert arun_code == 200, f"Dr. Arun Kumar login failed: {arun_res}"

    # 9. Test Security: Duplicate Email Rejection
    print("\n[9] Testing Security: Duplicate Email Registration Rejection...")
    dup_code, dup_res = request("POST", "/api/auth/register/student", st_payload)
    print(f"    Duplicate Student Registration -> Code {dup_code} (Expected 400), Detail: {dup_res.get('detail')}")
    assert dup_code == 400, "Duplicate email was not rejected with 400!"

    # 10. Test Security: Invalid Credentials Handling
    print("\n[10] Testing Security: Invalid Credentials Handling...")
    bad_pw_code, bad_pw_res = request("POST", "/api/auth/login", {
        "email": student_email,
        "password": "wrongpassword999",
        "role": "student"
    })
    print(f"    Wrong Password Login -> Code {bad_pw_code} (Expected 401), Detail: {bad_pw_res.get('detail')}")
    assert bad_pw_code == 401, "Invalid password was not rejected with 401!"

    print("\n" + "=" * 60)
    print("ALL REGISTRATION & LOGIN TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()

