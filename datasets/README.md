# PathForge AI — Complete Production Dataset Layer

Welcome to the data layer of **PathForge AI** — an AI-powered personalized career roadmapping, diagnostic assessment, and skill-gap intelligence platform.

This directory contains 23 interconnected relational datasets providing ground truth, historical evidence, assessment questions, job intelligence, and activity telemetry.

---

## Directory Overview

```
datasets/
├── 01_careers.csv               # 25 career targets & difficulty levels
├── 02_skills.csv                # 151 categorized technical and soft skills
├── 03_career_skills.csv         # 437 weighted career-skill requirements
├── 04_skill_prerequisites.csv   # 165 acyclic learning DAG prerequisites
├── 05_courses.csv               # 160 curated courses from leading providers
├── 06_course_skills.csv         # 557 course-to-skill coverage mappings
├── 07_projects.csv              # 105 portfolio project recommendations
├── 08_project_skills.csv        # 471 project-to-skill mappings
├── 09_assessment_questions.csv  # 530 validated technical questions & explanations
├── 10_assessment_answers.csv    # 5,199 student diagnostic attempt logs
├── 11_student_profiles.csv      # 100 synthetic student profiles
├── 12_student_skills.csv        # 778 evidence-grounded skill mastery states
├── 13_resume_analysis.csv       # 610 parsed resume signals & confidence scores
├── 14_companies.csv             # 35 tech enterprise & startup profiles
├── 15_company_skills.csv        # 741 company-to-role skill requirements
├── 16_company_jobs.csv          # 165 active job postings
├── 17_mentor_profiles.csv       # 35 verified domain expert mentors
├── 18_mentor_feedback.csv       # 519 qualitative mentor project evaluations
├── 19_learning_activity.csv     # 10,500 activity records (heatmap & streaks)
├── 20_certificates.csv          # 350 credentials & verification statuses
├── 21_job_applications.csv      # 350 job application tracking records
├── 22_feedback.csv              # 350 app experience & usability reviews
├── 23_notifications.csv         # 350 system & milestone alert notifications
│
├── archive_duplicate_datasets/  # Archived redundant unnumbered replica CSVs with full manifest
├── generate_datasets.py         # Deterministic data generator (seed: 42)
├── validate_datasets.py         # 20-rule comprehensive validation test suite
├── schema.md                    # Data dictionary & column specifications
└── README.md                    # System architecture & algorithmic documentation
```

---

## Dataset Inventory & Usage

| # | Dataset | Records | Primary Usage | Priority |
| :--- | :--- | :---: | :--- | :--- |
| **01** | `01_careers.csv` | 25 | Target role selection, difficulty tiers, preparation benchmarks | ⭐⭐⭐⭐⭐ |
| **02** | `02_skills.csv` | 151 | Canonical ontology of technical, mathematical, and soft skills | ⭐⭐⭐⭐⭐ |
| **03** | `03_career_skills.csv` | 437 | Normalized weights for Career vs Required Skills | ⭐⭐⭐⭐⭐ |
| **04** | `04_skill_prerequisites.csv`| 165 | Topological learning graph (DAG) for milestone sequencing | ⭐⭐⭐⭐⭐ |
| **05** | `05_courses.csv` | 160 | Course recommendations from Coursera, NPTEL, DeepLearning.AI | ⭐⭐⭐⭐⭐ |
| **06** | `06_course_skills.csv` | 557 | Vector representation for content-based course filtering | ⭐⭐⭐⭐⭐ |
| **07** | `07_projects.csv` | 105 | Capstone & portfolio project recommendations | ⭐⭐⭐⭐⭐ |
| **08** | `08_project_skills.csv` | 471 | Practical skill requirements per project | ⭐⭐⭐⭐⭐ |
| **09** | `09_assessment_questions.csv`| 530 | Adaptive diagnostic testing questions across 5 difficulty levels | ⭐⭐⭐⭐⭐ |
| **10** | `10_assessment_answers.csv` | 5,199 | Student assessment responses, correctness, and time metrics | ⭐⭐⭐⭐⭐ |
| **11** | `11_student_profiles.csv` | 100 | Student academic credentials, target career, and study habits | ⭐⭐⭐⭐⭐ |
| **12** | `12_student_skills.csv` | 778 | Evidence-grounded mastery engine (Claims vs Verified Proof) | ⭐⭐⭐⭐⭐ |
| **13** | `13_resume_analysis.csv` | 610 | Extracted resume signals, confidence scores, and sections | ⭐⭐⭐⭐ |
| **14** | `14_companies.csv` | 35 | Corporate profiles, sizes, locations, and hiring sectors | ⭐⭐⭐⭐ |
| **15** | `15_company_skills.csv` | 741 | Company role-to-skill intelligence and screening bars | ⭐⭐⭐⭐ |
| **16** | `16_company_jobs.csv` | 165 | Active job vacancies with required and preferred skill tags | ⭐⭐⭐⭐ |
| **17** | `17_mentor_profiles.csv`| 35 | Mentor connect directory, ratings, and domains | ⭐⭐⭐ |
| **18** | `18_mentor_feedback.csv`| 519 | Mentor project code reviews and rubric evaluations | ⭐⭐⭐ |
| **19** | `19_learning_activity.csv`| 10,500 | Daily session telemetry (GitHub-style calendar heatmap) | ⭐⭐⭐ |
| **20** | `20_certificates.csv` | 350 | Uploaded certificates and verified credential statuses | ⭐⭐⭐ |
| **21** | `21_job_applications.csv`| 350 | AI Job Application Assistant readiness & stage tracking | ⭐⭐⭐ |
| **22** | `22_feedback.csv` | 350 | Usability feedback and NLP sentiment analysis | ⭐⭐ |
| **23** | `23_notifications.csv` | 350 | Real-time event notifications for assessments and roadmaps | ⭐⭐⭐ |

---

## Core ML & Algorithmic Pipelines Supported

### 1. Course Recommendation Engine (TF-IDF + Cosine Similarity)
- **Inputs**:
  - `Student Skill Gap`: Derived from `03_career_skills.csv` minus `12_student_skills.csv`
  - `Course Vectors`: Derived from `06_course_skills.csv` and `05_courses.csv`
- **Methodology**:
  - Vectorize course skill coverage using TF-IDF:
    $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{|D|}{|\{d \in D : t \in d\}|}\right)$$
  - Formulate student gap vector $\vec{G}$ where non-zero dimensions represent unmastered competencies weighted by career importance.
  - Calculate cosine similarity:
    $$\text{Cosine Similarity}(\vec{G}, \vec{C}_i) = \frac{\vec{G} \cdot \vec{C}_i}{\|\vec{G}\| \|\vec{C}_i\|}$$
  - Rank top-N courses maximizing gap closure while penalizing redundant skills already mastered.

### 2. Evidence-Grounded Skill Mastery Engine
- **Problem**: Self-reported competence is notoriously prone to the Dunning-Kruger effect ("I know 90% Machine Learning").
- **Solution**: Multi-modal evidence synthesis in `12_student_skills.csv`:
  $$\text{Final Mastery} = w_1 S_{\text{assess}} + w_2 S_{\text{project}} + w_3 S_{\text{cert}} + w_4 S_{\text{mentor}} + w_5 S_{\text{resume}}$$
  - If evidence count is 0, claims receive an unverified penalty:
    $$\text{Final Mastery} = \text{Self-Declared} \times 0.30$$
  - Categorizes calibrated mastery into 5 discrete states:
    `Missing` (<25%), `Beginner` (25-44%), `Developing` (45-64%), `Proficient` (65-79%), `Strong` (80-100%).

### 3. Personalized Adaptive Roadmap Generator (DAG Traversal)
- **Inputs**:
  - `04_skill_prerequisites.csv` (directed edges $u \to v$)
  - `12_student_skills.csv` (student verified mastery)
  - `03_career_skills.csv` (target career requirements)
- **Algorithm**:
  1. Identify target career skills where $\text{Final Mastery} < \text{Required Level}$.
  2. Compute ancestral closure in the prerequisite DAG to identify prerequisite gaps.
  3. Perform topological sort ensuring no dependent skill is scheduled before its prerequisite.
  4. Segment sorted skills into chronological milestones (Phase 1: Foundations, Phase 2: Core Engineering, Phase 3: Specialization).

### 4. Career Readiness & Radar Alignment
- **Readiness Formula**:
  $$\text{Readiness Index} = \sum_{s \in \text{CareerSkills}} \text{Weight}_s \times \min\left(1.0, \frac{\text{StudentMastery}_s}{\text{RequiredMastery}_s}\right) \times 100$$
- Accurately generates the 6-axis Radar chart and career progress metrics shown in the dashboard.

### 5. Project Recommendation Engine
- **Methodology**: Content-based filtering matching student current mastery tier to project required skills in `08_project_skills.csv`. Recommends projects where:
  $$\text{Difficulty} \approx \text{Student Tier} + 1$$
  providing an optimal zone of proximal development without inducing frustration.

### 6. Company & Job Matching Engine
- **Inputs**: `15_company_skills.csv`, `16_company_jobs.csv`, `12_student_skills.csv`.
- Computes multi-factor match percentages:
  - **Resume Match**: Extracted skill overlap from `13_resume_analysis.csv`
  - **Skill Match**: Evidence-backed mastery against required job tags
  - **Project Match**: Completed projects addressing job description domains
  - Overall Readiness index stored in `21_job_applications.csv`.

---

## How to Regenerate the Datasets

To regenerate all 23 CSV files deterministically with seed `42`:

```bash
# From workspace root
python datasets/generate_datasets.py
```

Expected output:
```
============================================================
PATHFORGE AI — GENERATING PRODUCTION DATASET PACKAGE
Directory: .../datasets
============================================================
Generated 01_careers.csv with 25 records.
Generated 02_skills.csv with 151 records.
...
SUCCESS: ALL 23 DATASETS GENERATED CLEANLY.
============================================================
```

---

## How to Validate the Datasets

To execute the 20-rule relational integrity validation test suite:

```bash
python datasets/validate_datasets.py
```

### Verified Validation Rules:
1. **Primary Key & ID Uniqueness**: No duplicate or null primary/composite keys.
2. **Foreign Key Integrity**: All references map to existing IDs (zero broken links).
3. **Numeric Ranges**:
   - `weights`: $(0.0, 1.0]$
   - `ratings`: $[1.0, 5.0]$
   - `scores`: $[0, 100]$
   - `confidence`: $[0.0, 1.0]$
   - `durations`: $> 0$
4. **Mastery Enums**: Strictly `Missing`, `Beginner`, `Developing`, `Proficient`, `Strong`.
5. **Difficulty Enums**: Strictly `Beginner`, `Intermediate`, `Advanced`, `Adaptive`.
6. **Prerequisites DAG Cycle Check**: Uses Kahn's topological sort algorithm to mathematically guarantee zero cyclic dependencies.
7. **Career Skill Weights Normalization**: Weights per career sum to $1.000 \pm 0.05$.
8. **Mandatory Non-Null Integrity**: Required columns are populated without null values.
9. **Assessment Correct Answer Alignment**: Every `correct_answer` is present in `[option_a, option_b, option_c, option_d]`.
10. **Question Text Uniqueness**: Zero duplicate questions.

---

## Next Steps for Stage 2

The dataset package is now 100% ready to be consumed by:
1. **FastAPI Backend**: `backend/` utilizing SQLAlchemy models or SQLite direct ingest.
2. **ML Recommendation Engine**: `ml/recommender.py` running Scikit-Learn TF-IDF models.
3. **Frontend Integration**: Linking Vite frontend to real API endpoints querying this data layer.
