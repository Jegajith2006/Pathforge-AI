# PathForge AI

> **Machine Learning-Based Personalized Learning Roadmap and Career Skill Intelligence System**

PathForge AI is an explainable career intelligence platform and adaptive learning roadmap system. It evaluates student competencies against verified industry role requirements, resolves self-declared claims against multi-modal empirical evidence (assessments, projects, certifications, mentor reviews, and resume extractions), and generates personalized Directed Acyclic Graph (DAG) learning roadmaps.

---

## 📁 Project Architecture

The project is structured into three clean, decoupled tiers:

```
PathForge-AI/
│
├── frontend/                   # React + TypeScript + Vite + Vanilla CSS SaaS UI
│   ├── src/
│   │   ├── services/api.ts     # Centralized TypeScript API client
│   │   ├── App.tsx             # Complete multi-page application views
│   │   ├── index.css           # Premium design system tokens and styling
│   │   └── main.tsx            # React application root
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── backend/                    # Python 3.11+ FastAPI + SQLAlchemy + SQLite
│   ├── main.py                 # FastAPI application entry point with CORS
│   ├── config.py               # Application settings, secrets, and evidence weights
│   ├── requirements.txt        # Python backend dependencies
│   ├── .env.example            # Environment variables template
│   ├── README.md               # Backend engineering manual
│   │
│   ├── database/
│   │   ├── connection.py       # SQLAlchemy engine, sessionmaker, get_db()
│   │   ├── models.py           # 23 ORM models + progress tracking tables
│   │   └── seed.py             # CSV ingestion pipeline importing from datasets/
│   │
│   ├── routers/                # Modular REST API endpoints
│   │   ├── auth.py             # JWT authentication, registration, login
│   │   ├── profile.py          # Student demographics and preferences
│   │   ├── career.py           # Career goal selection and TF-IDF matching
│   │   ├── resume.py           # Multipart resume upload (PDF/DOCX/TXT) & parsing
│   │   ├── assessment.py       # Diagnostic evaluations and test scoring
│   │   ├── skill_gap.py        # Explainable skill gap and multi-source mastery
│   │   ├── roadmap.py          # DAG topological learning roadmap
│   │   ├── courses.py          # Course recommendations and progress tracking
│   │   ├── projects.py         # Practical project recommendations
│   │   ├── mentor.py           # Mentor connect, reviews, and session bookings
│   │   ├── companies.py        # Company intelligence and role requirements
│   │   ├── jobs.py             # Jobs assistant and application readiness
│   │   ├── certificates.py     # Certification evidence and verification
│   │   ├── activity.py         # Learning activity telemetry and heatmaps
│   │   ├── feedback.py         # Student feedback and sentiment analysis
│   │   └── dashboard.py        # Unified student dashboard aggregator
│   │
│   ├── schemas/                # Pydantic v2 validation schemas
│   ├── services/               # Core business logic layer
│   ├── ml/                     # ML modules (TF-IDF, Cosine Similarity, Jaccard)
│   │   ├── skill_matching.py   # Token-based Jaccard similarity matcher
│   │   ├── career_matching.py  # TF-IDF + Cosine Similarity career match engine
│   │   ├── course_recommendation.py # Gap-weighted course relevance ranker
│   │   └── project_recommendation.py# Portfolio project relevance ranker
│   │
│   ├── tests/                  # Automated integration test suite (pytest)
│   │   ├── __init__.py
│   │   └── test_api.py         # 13 comprehensive API endpoint tests
│   │
│   ├── data/
│   │   └── pathforge.db        # SQLite database (migratable to PostgreSQL)
│   └── uploads/                # Resume and credential storage directory
│
├── datasets/                   # 23 Canonical Relational CSV Datasets (01_ to 23_)
│   ├── 01_careers.csv
│   ├── 02_skills.csv
│   ├── 03_career_skills.csv
│   ├── 04_skill_prerequisites.csv
│   ├── 05_courses.csv
│   ├── 06_course_skills.csv
│   ├── 07_projects.csv
│   ├── 08_project_skills.csv
│   ├── 09_assessment_questions.csv
│   ├── 10_assessment_answers.csv
│   ├── 11_student_profiles.csv
│   ├── 12_student_skills.csv
│   ├── 13_resume_analysis.csv
│   ├── 14_companies.csv
│   ├── 15_company_skills.csv
│   ├── 16_company_jobs.csv
│   ├── 17_mentor_profiles.csv
│   ├── 18_mentor_feedback.csv
│   ├── 19_learning_activity.csv
│   ├── 20_certificates.csv
│   ├── 21_job_applications.csv
│   ├── 22_feedback.csv
│   ├── 23_notifications.csv
│   ├── archive_duplicate_datasets/ # Preserved legacy duplicate replicas + manifest
│   ├── generate_datasets.py
│   ├── validate_datasets.py
│   ├── schema.md               # Data dictionary & relational schema reference
│   └── README.md               # Dataset architecture documentation
│
├── package.json                # Root proxy scripts
└── README.md                   # This documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: Version `3.11+`
- **Node.js**: Version `18+`

---

### Step 1: Backend Setup & Database Seeding

Open a terminal in the project root:

```powershell
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Seed SQLite database from datasets/
python backend/database/seed.py

# 3. Start the FastAPI backend server
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **API Base**: `http://127.0.0.1:8000/`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

> **Default Seeded Account**:
> - Email: `alex.chen@stanford.edu`
> - Password: `password123`

---

### Step 2: Run the Backend Tests

In a separate terminal window from the project root:

```powershell
python -m pytest backend/tests/test_api.py -v
```

All 13 integration tests validate:
- Authentication & JWT issuance
- Profile CRUD & skill matrix updates
- Career and course catalogs
- Project recommendations
- Adaptive diagnostic tests & scoring
- Skill gap analysis & topological roadmap

---

### Step 3: Start the React Frontend

Open a new terminal window in the project root:

```powershell
cd frontend
npm run dev
```

Or from the root directory directly:
```powershell
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173/`**

---

## 🧠 Key Algorithmic Formulations

### 1. Multi-Source Skill Mastery Calibration
A student does **not** automatically receive an advanced skill level purely from self-declaration. The system calibrates ground-truth mastery using evidence weights:

$$\text{Final Mastery} = \frac{\sum_{i} \text{Score}_i \times w_i}{\sum_{i} w_i \quad (\text{active sources})}$$

| Evidence Source | Weight | Description |
|---|:---:|---|
| **Self-Declared** | $10\%$ | Student initial estimate |
| **Resume Extraction** | $15\%$ | Detected occurrences in projects / experience |
| **Assessment Verification** | $35\%$ | Proctored diagnostic question accuracy |
| **Project Implementation** | $20\%$ | Evaluated repository / code artifact |
| **Certificate Credential** | $10\%$ | Verified certificate completion |
| **Mentor Review** | $10\%$ | Expert practitioner rating |

### 2. PathForge AI Career Readiness Indicator
$$\text{Readiness} = (0.50 \times \text{Skill Match}) + (0.30 \times \text{Skill Mastery}) + (0.20 \times \text{Practical Evidence})$$

> **Academic Disclaimer**: *"This is a project-based career readiness indicator, not an official employment or hiring score."*

### 3. Machine Learning Recommendation Engine
- **Career Matching**: TF-IDF vectorization with `ngram_range=(1, 2)` + Cosine Similarity matching student profile and demonstrated skills against career descriptions and required competencies.
- **Course Recommendations**: Gap-weighted relevance algorithm prioritizing courses that resolve critical skill deficits and offer the highest readiness boost.
- **Learning Roadmap**: Directed Acyclic Graph (DAG) topological sorting respecting skill prerequisites to generate an acyclic, logical learning order.

---

## 🛠 Tech Stack# URGENT BUG: MENTOR STUDENTS AND MESSAGES PAGES ARE COMPLETELY BLANK

Project: PathForge AI

I have two critical problems in my existing application.

**Problem 1:** `http://localhost:5175/mentor/students` displays a completely blank white page.

**Problem 2:** `http://localhost:5175/mentor/messages` displays a completely blank white page.

Both pages previously remained broken even after earlier fixes. Antigravity previously modified 17 files and reported passing backend tests, but the actual browser still shows blank pages.

This means the previous backend test results do not prove that the frontend works.

I have provided screenshots showing both failures.

## RULE 1 — DO NOT REBUILD THE PROJECT

- Work with the existing source code.
- Do not redesign the entire application.
- Do not generate another generic audit report.
- Do not add another implementation of the same features.
- Do not reset Git or delete existing changes.
- Do not reset the database.
- Diagnose the actual browser failure before modifying code.

## STEP 1 — IDENTIFY THE RUNNING FRONTEND

The browser is using port 5175.

Inspect:
- The running frontend process.
- The frontend project directory.
- The Vite configuration, if applicable.
- The routes for `/mentor/students` and `/mentor/messages`.
- The application entry point.
- The router and authentication guards.
- The actual files used by the running application.

Do not assume port 5173 is the correct frontend.

Verify that you are editing the same project that is running in the browser.

## STEP 2 — FIND WHY THE PAGES ARE BLANK

Inspect the browser console and reproduce both routes.

Check for:
- Uncaught JavaScript exceptions.
- React rendering errors.
- Missing or incorrect imports.
- Undefined variables or properties.
- Invalid component exports.
- Invalid JSX.
- Incorrect route configuration.
- Broken authentication state.
- Incorrect role checks.
- Failed API requests.
- Components that throw when data is empty or null.
- Loading states that never finish.
- Invalid assumptions about API response structures.
- CSS that hides the entire page or makes the content invisible.

Inspect the actual page components and all their important dependencies.

If browser developer tools are available, inspect the console and Network panel.

If they are unavailable, use the available browser or test tools, inspect the source code, and run the application to reproduce the problem.

**Identify the specific error and file responsible for each blank page. Do not guess.**

## STEP 3 — RESTORE PAGE RENDERING FIRST

Fix the root cause preventing each page from rendering.

Requirements:
- Both routes must render their page layout.
- The existing mentor sidebar and header must remain visible.
- Page titles and primary content must appear.
- API failures must not crash the entire page.
- Empty API responses must display a useful empty state.
- Loading indicators must stop after success or failure.
- Errors must be visible and understandable.
- Existing navigation and authentication must continue working.

Add an error boundary or local error handling if appropriate, but do not use it to hide the original bug.

Do not replace the pages with static mockups.

## STEP 4 — FIX MY STUDENTS FUNCTIONALITY

Once the page renders, trace the existing data flow:

Authenticated mentor
→ Frontend API request
→ Backend endpoint
→ Database query
→ API response
→ Student list.

Inspect the actual endpoint and response format.

Verify:
- The logged-in mentor ID is correct.
- Accepted mentorship relationships are queried correctly.
- The student records are linked to the correct mentor.
- The frontend reads the actual response structure.
- Missing profile fields do not crash rendering.
- The loading and error states work.
- Accepted students appear after refreshing.

If no accepted students exist, show a proper empty state with an explanation.

Do not fabricate student records.

## STEP 5 — FIX MESSAGES FUNCTIONALITY

Once the page renders, trace:

Authenticated mentor
→ Conversation-list API
→ Database query
→ Conversation list
→ Selected conversation
→ Message history
→ Send-message API
→ Database persistence.

Verify:
- The conversation-list endpoint is correct.
- The authenticated mentor can retrieve authorized conversations.
- Conversation IDs and participant IDs are correct.
- The message-history endpoint works.
- The frontend handles an empty message list.
- Sending a message uses the actual backend.
- Backend errors are displayed instead of crashing the page.
- Messages persist after refreshing.

Then verify two-way messaging:

1. Mentor sends a message.
2. The student sees the message.
3. The student replies.
4. The mentor sees the reply.
5. Both messages remain available after refreshing.

Do not use hardcoded messages or localStorage as a replacement for database persistence.

## STEP 6 — CHECK THE PREVIOUS 17 FILE CHANGES

The previous execution reportedly changed 17 files.

Inspect the current Git status and diff.

Determine whether those changes introduced:
- Invalid imports.
- Incorrect component exports.
- Incompatible API response handling.
- Duplicate routes.
- Conflicting state management.
- Incorrect authentication assumptions.
- Syntax or type errors.

Preserve valid work and existing user data. Correct only the problems that are actually present.

Do not discard all previous changes.

## STEP 7 — RUN REAL FRONTEND TESTS

Run the available project checks, including the frontend build and relevant tests.

Test these exact URLs in the browser:

`http://localhost:5175/mentor/students`

`http://localhost:5175/mentor/messages`

Verify that both pages render without uncaught JavaScript exceptions.

Then test the features using a valid authenticated mentor account.

Also verify:
- Mentor login.
- Sidebar navigation.
- Student list loading.
- Conversation list loading.
- Message sending.
- Student replies.
- Refresh persistence.

Do not mark a feature PASS just because its API returns a successful response.

## STEP 8 — FINAL REPORT

Report:

### My Students
- Root cause of the blank page.
- Relevant file and error.
- API status.
- Fix applied.
- Browser rendering result.
- Actual functionality test result.

### Messages
- Root cause of the blank page.
- Relevant file and error.
- API status.
- Fix applied.
- Browser rendering result.
- Mentor-to-student messaging result.
- Student-to-mentor reply result.

### Final checks
- Frontend port verified.
- Frontend build result.
- Backend result.
- Tests actually executed.
- Remaining blockers.

Use PASS, FAIL, or BLOCKED for each result.

If the browser cannot be controlled or inspected directly, explicitly state that limitation and provide the exact browser test still required.

**Start by finding why both React pages render as completely blank. Fix page rendering first, then verify the real student and messaging workflows. Do not stop after modifying code or running backend tests.**

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS, Lucide Icons
- **Backend**: FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2, Python-Multipart
- **Database**: SQLite (local production file: `backend/data/pathforge.db`, migratable to PostgreSQL)
- **Machine Learning**: Scikit-learn (TF-IDF, Cosine Similarity), NumPy, Pandas
- **Security**: Passlib / Bcrypt password hashing, RFC 7519 HMAC-SHA256 JWT tokens
- **Testing**: Pytest, HTTPX TestClient
