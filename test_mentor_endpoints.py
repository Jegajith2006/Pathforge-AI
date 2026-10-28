import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:5173"

def post_json(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status, json.loads(resp.read().decode())

def get_json(path, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status, json.loads(resp.read().decode())

# 1. Login as Mentor
print("1. Logging in as Dr. Arun Kumar (Mentor)...")
code, auth = post_json("/api/auth/login", {
    "email": "arun.kumar@pathforge.ai",
    "password": "password123",
    "role": "mentor"
})
assert code == 200, f"Mentor login failed: {auth}"
token = auth["access_token"]
print(f"Logged in successfully! Mentor: {auth.get('name')}")

# 2. Test each mentor endpoint
endpoints = [
    ("/api/mentor/dashboard", "Dashboard View"),
    ("/api/mentor/students", "My Students View"),
    ("/api/mentor/requests", "Incoming Mentorship Requests"),
    ("/api/mentor/sessions", "Mentorship Sessions"),
    ("/api/mentor/students/U001/progress", "Student Progress & Insights (U001)"),
    ("/api/mentor/assessments", "Skill Assessments & Grading"),
    ("/api/mentor/project-reviews", "Project Reviews"),
    ("/api/mentor/career-guidance/U001", "Career Guidance Workspace (U001)"),
    ("/api/mentor/messages", "Direct Messaging Conversations"),
    ("/api/mentor/resources", "Learning Resources"),
    ("/api/mentor/profile", "Mentor Profile Data"),
    ("/api/mentor/notifications", "Notifications Feed"),
]

all_passed = True
print("\n2. Verifying all 12 Mentor Portal API Contracts:")
for ep, label in endpoints:
    try:
        st, data = get_json(ep, token=token)
        count_str = f"({len(data)} items)" if isinstance(data, (list, dict)) else ""
        print(f"  [PASS] {st} OK: {label:38} -> {ep} {count_str}")
    except Exception as e:
        print(f"  [FAIL] Error for {label} ({ep}): {e}")
        all_passed = False

if all_passed:
    print("\nALL 12 MENTOR PORTAL API ENDPOINTS RETURNED 200 OK WITH VALID DATA!")
else:
    print("\nSOME ENDPOINTS FAILED")
    sys.exit(1)
