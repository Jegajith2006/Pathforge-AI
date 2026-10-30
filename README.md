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
