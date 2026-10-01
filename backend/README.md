# PathForge AI - Backend API Foundation (Stage 12)

> **PathForge AI**: An Explainable Machine Learning-Based Personalized Learning, Skill Intelligence, and Career Readiness Platform.  
> *“Your skills. Your path. Your future.”*

---

## 1. Overview

The PathForge AI backend provides the high-performance API foundation for personalized learning paths, real-time skill intelligence telemetry, readiness scoring, and portfolio evidence tracking.

Built with **Python 3.10+**, **FastAPI**, **SQLAlchemy 2.0+**, and **SQLite**, the architecture is designed to seamlessly transition to explainable machine learning models (SHAP/XAI, skill gap classifiers, recommendation engines) in subsequent development stages.

---

## 2. Quickstart & Installation

### Step 1: Create Virtual Environment

- **Linux / macOS**:
  ```bash
  python3 -m venv venv
  ```
- **Windows**:
  ```powershell
  python -m venv venv
  ```

### Step 2: Activate Virtual Environment

- **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```
- **Windows**:
  ```powershell
  venv\Scripts\activate
  ```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Copy the provided template:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
APP_NAME=PathForge AI API
APP_VERSION=1.0.0
DEBUG=true
DATABASE_URL=sqlite:///./pathforge.db
FRONTEND_URL=http://localhost:5173
```

### Step 5: Run Development Server

Using the runner script:
```bash
python run.py
```

Or directly via Uvicorn with auto-reload:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. Interactive API Documentation

Once the server is running:

- **Swagger UI Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Alternative API Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema (JSON)**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 4. Health Check Endpoint

Test the health check endpoint using `curl` or any browser:

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "pathforge-api"
}
```

This endpoint is integrated into the frontend **Settings** diagnostic tab to verify backend connectivity.

---

## 5. Database Location & Auto-Seeding

- **Database**: SQLite file stored locally at `backend/pathforge.db`.
- **Automatic Initialization**: On server startup, SQLAlchemy automatically provisions all database tables.
- **Idempotent Demo Data**: If the database is newly created, the `seed_service` automatically populates:
  - 1 Primary User (`Alex Morgan`)
  - 11 Core AI, ML Engineering, and Infrastructure Skills (0-100 proficiency scale)
  - 6 Recommended and ongoing courses
  - 5 Capstone and industry projects
  - 5 Ordered career roadmap phases
  - Verified evidence records, mentor reviews, readiness snapshot, and company benchmarks.
- **Data Persistence**: Existing records are strictly preserved on server restarts without duplicate insertions.

---

## 6. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI entry point, CORS, lifespan handler
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic Settings & environment variables
│   │   └── database.py          # SQLAlchemy engine, SessionLocal, get_db()
│   │
│   ├── models/                  # SQLAlchemy ORM Database Models
│   │   ├── __init__.py
│   │   ├── user.py              # User profiles & learning parameters
│   │   ├── skill.py             # Skill inventory & numeric proficiency (0-100)
│   │   ├── course.py            # Course catalog & curriculum progress
│   │   ├── project.py           # Hands-on projects & status tracking
│   │   ├── roadmap.py           # Multi-phase career roadmap
│   │   ├── progress.py          # Chronological activity logs
│   │   ├── evidence.py          # Verified portfolio artifacts & credentials
│   │   ├── mentor.py            # Industry reviews & feedback items
│   │   ├── readiness.py         # Sub-dimensional readiness score snapshots
│   │   ├── company.py           # Target companies & role benchmark matches
│   │   └── notification.py      # User notifications & alert triggers
│   │
│   ├── schemas/                 # Pydantic v2 Request/Response Schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── skill.py
│   │   ├── course.py
│   │   ├── project.py
│   │   ├── roadmap.py
│   │   ├── progress.py
│   │   ├── evidence.py
│   │   ├── mentor.py
│   │   ├── readiness.py
│   │   ├── company.py
│   │   └── notification.py
│   │
│   ├── routers/                 # Modular API Route Controllers
│   │   ├── __init__.py
│   │   ├── health.py            # /health monitoring probe
│   │   ├── users.py             # /api/users/me, /api/profile, /api/settings
│   │   ├── skills.py            # /api/skills (CRUD)
│   │   ├── courses.py           # /api/courses
│   │   ├── projects.py          # /api/projects
│   │   ├── roadmap.py           # /api/roadmap
│   │   ├── progress.py          # /api/progress
│   │   ├── evidence.py          # /api/evidence (CRUD)
│   │   ├── mentor.py            # /api/mentor-feedback
│   │   ├── readiness.py         # /api/readiness
│   │   ├── companies.py         # /api/company-matches
│   │   └── notifications.py     # /api/notifications
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── seed_service.py      # Idempotent demo database seeder
│   │
│   └── utils/
│       ├── __init__.py
│       └── response.py          # Standardized response wrappers
│
├── tests/
│   ├── __init__.py
│   └── test_api.py              # Automated Pytest suite
│
├── requirements.txt             # Core backend dependencies
├── .env.example                 # Environment configuration template
├── .gitignore                   # Version control ignore rules
├── README.md                    # Backend documentation & run guide
└── run.py                       # Python execution entry point
```

---

## 7. Running the Automated Test Suite

Run the backend test suite using pytest:

```bash
pytest
```

Or for verbose output with execution timing:
```bash
pytest -v
```

---

## 8. Future Machine Learning (ML) Integration Plan

The backend architecture in Stage 12 is intentionally structured for plug-and-play machine learning extensions in subsequent stages:

1. **Readiness Prediction Model**:
   - Multi-dimensional regression/classification model predicting interview readiness based on skill coverage, project completions, streak consistency, and mentor ratings.
2. **Explainable AI (XAI) Engine**:
   - SHAP (SHapley Additive exPlanations) values calculating exact percentage contributions of each skill and project to the overall readiness score.
3. **Personalized Course & Project Recommender**:
   - Content-based and collaborative filtering pipelines recommending optimal learning modules to close target role skill gaps with highest leverage.
4. **Market Competency Alignment**:
   - Dynamic role matching based on live job market vector embeddings and company benchmark requirements.
