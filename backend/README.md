# PathForge AI — Backend Engineering Documentation

**PathForge AI** is a machine learning-based personalized learning roadmap and career skill intelligence system. This backend is engineered with **Python 3.11+**, **FastAPI**, **SQLAlchemy ORM**, **Pydantic v2**, and **SQLite** (migratable to PostgreSQL), powered by scikit-learn ML recommendation algorithms.

---

## 1. System Requirements

- **Python**: Version `3.11` or higher
- **Node.js**: Version `18+` (for React frontend)
- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)

---

## 2. Directory Structure

```
backend/
├── main.py                     # FastAPI application entry point with CORS and routers
├── config.py                   # Centralized application settings and weight formulas
├── requirements.txt            # Python dependencies
├── .env.example                # Sample environment configuration template
├── README.md                   # This documentation
│
├── database/
│   ├── connection.py           # SQLite / PostgreSQL engine, session, and init_db
│   ├── models.py               # SQLAlchemy ORM models for all 23 entities
│   └── seed.py                 # Dataset importer seeding SQLite from datasets/
│
├── routers/                    # Clean modular REST API endpoints
│   ├── auth.py                 # JWT token generation, registration, login
│   ├── profile.py              # Student demographics, skills, and preferences
│   ├── career.py               # Career listing, details, and selection
│   ├── resume.py               # Multi-format resume parsing and entity extraction
│   ├── assessment.py           # Adaptive diagnostic test blueprint and scoring
│   ├── skill_gap.py            # Skill gap decomposition and multi-source calibration
│   ├── roadmap.py              # DAG topological milestone ordering
│   ├── courses.py              # Course catalog, recommendations, and progress
│   ├── projects.py             # Practical portfolio project recommendation & tracking
│   ├── mentor.py               # Verified expert network, reviews, and bookings
│   ├── companies.py            # Corporate intelligence and hiring frameworks
│   ├── jobs.py                 # Active employment opportunities and match scores
│   ├── certificates.py         # Credential uploads and verification tracking
│   ├── activity.py             # Telemetry for GitHub-style learning heatmap
│   ├── feedback.py             # Sentiment feedback recording
│   └── dashboard.py            # Unified analytics dashboard endpoint
│
├── schemas/                    # Pydantic v2 data validation schemas
│   ├── student.py              # Profile, Auth, and Skill DTOs
│   ├── career.py               # Career and SkillGap DTOs
│   ├── assessment.py           # Questions, submissions, and review DTOs
│   ├── roadmap.py              # Milestone step DTOs
│   ├── course.py               # Course and recommendation DTOs
│   ├── project.py              # Project and evidence DTOs
│   ├── resume.py               # Extracted entity DTOs
│   └── common.py               # Standard health, message, and readiness DTOs
│
├── services/                   # Core business logic layer
│   ├── resume_service.py       # Entity extraction and resume evidence calibration
│   ├── assessment_service.py   # Adaptive question selection and test grading
│   ├── skill_gap_service.py    # Multi-source formula & readiness engine
│   ├── roadmap_service.py      # Directed Acyclic Graph (DAG) topological sort
│   ├── recommendation_service.py # Orchestrator for ML recommendation pipelines
│   └── gemini_service.py       # Generative AI explainability with offline fallback
│
├── ml/                         # Machine learning algorithms
│   ├── skill_matching.py       # Token-based Jaccard and regex skill matcher
│   ├── career_matching.py      # TF-IDF + Cosine Similarity career match engine
│   ├── course_recommendation.py# Gap-weighted course ranking
│   └── project_recommendation.py# Portfolio project relevance engine
│
├── uploads/                    # Secure local resume and credential storage
└── data/
    └── pathforge.db            # SQLite database file
```

---

## 3. Installation & Setup (Windows-Friendly)

### Step 1: Open Terminal in Project Root
```powershell
cd "d:\Downloads\s5\s5 mini project"
```

### Step 2: Create Python Virtual Environment (Optional / Recommended)
```powershell
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies
```powershell
pip install -r backend/requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
copy backend\.env.example backend\.env
```

---

## 4. Database Setup & Dataset Seeding

The database seeds directly from the 23 verified CSV files in `datasets/`.

Run the automated seeding pipeline:
```powershell
python backend/database/seed.py
```

Expected output:
```
============================================================
PathForge AI Database Seeding Pipeline
Target Database: sqlite:///.../backend/data/pathforge.db
============================================================
Loading careers...
Loaded 25 careers.
Loading skills...
Loaded 151 skills.
Loading career skills...
Loaded 437 career skills.
Loading skill prerequisites...
Loaded 165 skill prerequisites.
Loading courses...
Loaded 160 courses.
Loading course skills...
Loaded 557 course skills.
Loading projects...
Loaded 105 projects.
Loading project skills...
Loaded 471 project skills.
Loading assessment questions...
Loaded 530 assessment questions.
...
Database seeding completed successfully.
============================================================
```

> **Note**: Seeded students (e.g., Alex Chen `alex.chen@stanford.edu`) are initialized with the default login password: `password123`.

---

## 5. Starting the FastAPI Backend

Run the server with Uvicorn:
```powershell
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Server endpoints:
- **Base API**: `http://127.0.0.1:8000/`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 6. Testing

Run the automated test suite using `pytest`:
```powershell
python -m pytest tests/test_api.py -v
```

All 13 integration tests validate:
- Root and health status
- Career and course catalogs
- Project recommendations
- JWT registration and login
- Profile updates
- Skill gap analysis
- Adaptive learning roadmap
- Career readiness formulation
- Diagnostic assessments and grading

---

## 7. Mathematical Formulations

### A. Multi-Source Skill Mastery Calibration
A student does **not** receive an advanced skill level purely from self-declaration. The system calibrates ground-truth mastery using evidence weights:

$$\text{Final Mastery} = \frac{\sum_{i} \text{Score}_i \times w_i}{\sum_{i} w_i \quad (\text{active sources})}$$

| Evidence Source | Weight | Description |
|---|:---:|---|
| **Self-Declared** | $10\%$ | Student initial estimate |
| **Resume Extraction** | $15\%$ | Detected occurrences in projects / history |
| **Assessment Verification** | $35\%$ | Proctored diagnostic question accuracy |
| **Project Implementation** | $20\%$ | Evaluated repository / code artifact |
| **Certificate Credential** | $10\%$ | Verified certificate completion |
| **Mentor Review** | $10\%$ | Expert practitioner rating |

### B. Career Readiness Indicator
$$\text{Readiness} = (0.50 \times \text{Skill Match}) + (0.30 \times \text{Skill Mastery}) + (0.20 \times \text{Practical Evidence})$$

> **Academic Disclaimer**: *"This is a project-based career readiness indicator, not an official employment or hiring score."*

---

## 8. Frontend Connection

The React + Vite frontend connects via `VITE_API_URL`:
- Root `.env`: `VITE_API_URL=http://127.0.0.1:8000`
- Centralized TypeScript client: `src/services/api.ts`
- Start frontend with:
  ```powershell
  npm.cmd run dev
  ```
