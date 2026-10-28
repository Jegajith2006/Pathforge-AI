import urllib.request
import urllib.error
import json
import sys

BACKEND_DIRECT = "http://127.0.0.1:8000"

# Auto-detect whether frontend is running on port 5175 or 5173
FRONTEND_PROXY = "http://localhost:5175"
for _p in [5175, 5173]:
    try:
        urllib.request.urlopen(f"http://localhost:{_p}", timeout=1)
        FRONTEND_PROXY = f"http://localhost:{_p}"
        break
    except Exception:
        pass

def make_request(base, method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(f"{base}{path}", data=body, headers=headers, method=method)
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

results = {}

print("=== 1. BACKEND DIRECT CONNECTIVITY & HEALTH ===")
code, data = make_request(BACKEND_DIRECT, "GET", "/health")
print(f"GET {BACKEND_DIRECT}/health -> Code {code}, Data: {data}")
results["backend_health"] = code == 200 and data.get("status") == "healthy"

print("\n=== 2. FRONTEND VITE PROXY CONNECTIVITY ===")
p_code, p_data = make_request(FRONTEND_PROXY, "GET", "/health")
print(f"GET {FRONTEND_PROXY}/health (proxied to backend) -> Code {p_code}, Data: {p_data}")
results["proxy_health"] = p_code == 200 and p_data.get("status") == "healthy"

print("\n=== 3. AUTHENTICATION: STUDENT LOGIN ===")
s_code, s_data = make_request(FRONTEND_PROXY, "POST", "/api/auth/login", {
    "email": "alex.chen@stanford.edu",
    "password": "password123",
    "role": "student"
})
print(f"Student Login -> Code {s_code}, Token present: {'access_token' in s_data}, Student: {s_data.get('name')}")
results["student_login"] = s_code == 200 and "access_token" in s_data
student_token = s_data.get("access_token")

print("\n=== 4. AUTHENTICATION: MENTOR LOGIN ===")
m_code, m_data = make_request(FRONTEND_PROXY, "POST", "/api/auth/login", {
    "email": "arun.kumar@pathforge.ai",
    "password": "password123",
    "role": "mentor"
})
print(f"Mentor Login -> Code {m_code}, Token present: {'access_token' in m_data}, Mentor: {m_data.get('name')}")
results["mentor_login"] = m_code == 200 and "access_token" in m_data
mentor_token = m_data.get("access_token")

print("\n=== 5. AUTHENTICATION: INVALID CREDENTIALS TEST ===")
inv_code, inv_data = make_request(FRONTEND_PROXY, "POST", "/api/auth/login", {
    "email": "arun.kumar@pathforge.ai",
    "password": "wrongpassword999",
    "role": "mentor"
})
print(f"Invalid Login -> Code {inv_code} (Expected 401), Detail: {inv_data.get('detail')}")
results["invalid_login_handled"] = inv_code == 401

print("\n=== 6. MENTOR PORTAL: MY STUDENTS ===")
st_code, st_data = make_request(FRONTEND_PROXY, "GET", "/api/mentor/students", token=mentor_token)
print(f"GET /api/mentor/students -> Code {st_code}, Total Active Students: {len(st_data) if isinstance(st_data, list) else 0}")
if isinstance(st_data, list) and len(st_data) > 0:
    st = st_data[0]
    print(f"Sample Student: {st.get('name')} | Dept: {st.get('department')} | Goal: {st.get('target_career_name')}")
    print(f"Connection Status: {st.get('connection_status')} | Connected Date: {st.get('connection_date')}")
    print(f"Skills: {st.get('skills_text')}")
results["my_students"] = st_code == 200 and isinstance(st_data, list) and len(st_data) > 0

print("\n=== 7. MENTOR PORTAL: MESSAGES ===")
msg_code, msg_data = make_request(FRONTEND_PROXY, "GET", "/api/mentor/messages", token=mentor_token)
print(f"GET /api/mentor/messages (Conversations) -> Code {msg_code}, Conversations Count: {len(msg_data) if isinstance(msg_data, list) else 0}")
results["mentor_conversations"] = msg_code == 200 and isinstance(msg_data, list)

# Two-way messaging verification
print("\n=== 8. TWO-WAY MESSAGING INTEGRATION ===")
send_code, send_data = make_request(FRONTEND_PROXY, "POST", "/api/mentor/messages", {
    "student_id": "U001",
    "content": "Hi Alex, please review the latest MLOps CI/CD deployment pipeline module."
}, token=mentor_token)
print(f"Mentor -> Student Send: Code {send_code}, Status: {send_data.get('message')}")

reply_code, reply_data = make_request(FRONTEND_PROXY, "POST", "/api/student/messages", {
    "mentor_id": "M001",
    "content": "Thank you Dr. Arun, I have reviewed the pipeline module and completed the task!"
}, token=student_token)
print(f"Student -> Mentor Reply: Code {reply_code}, Status: {reply_data.get('message')}")

thread_code, thread_data = make_request(FRONTEND_PROXY, "GET", "/api/mentor/messages?student_id=U001", token=mentor_token)
print(f"Mentor reads thread: Code {thread_code}, Message Count: {len(thread_data) if isinstance(thread_data, list) else 0}")
results["two_way_messaging"] = (
    send_code == 200 and reply_code == 200 and thread_code == 200 and
    isinstance(thread_data, list) and len(thread_data) >= 2
)

print("\n================ TEST SUMMARY ================")
for k, v in results.items():
    print(f"[{'PASS' if v else 'FAIL'}] {k}")

all_pass = all(results.values())
print(f"\nOVERALL RESULT: {'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")
sys.exit(0 if all_pass else 1)
