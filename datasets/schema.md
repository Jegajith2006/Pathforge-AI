# PathForge AI — Relational Dataset Schema Architecture

This document defines the schema, data types, constraints, entity relationships, and production standards for all 23 CSV datasets powering **PathForge AI**.

---

## Entity Relationship Overview

```
                      +-------------------+
                      |   01_careers.csv  |
                      +---------+---------+
                                |
             +------------------+-------------------+
             |                  |                   |
             v                  v                   v
   +------------------+ +-----------------+ +-------------------+
   | 03_career_skills | | 07_projects.csv | | 16_company_jobs   |
   +--------+---------+ +--------+--------+ +---------+---------+
            |                    |                    |
            |                    |                    v
            |                    |          +-------------------+
            |                    |          | 21_job_apps.csv   |
            |                    |          +-------------------+
            |                    v
            |           +-----------------+
            |           | 18_mentor_feed  |
            |           +-----------------+
            v
   +------------------+
   |   02_skills.csv  |<--------+--------------------+
   +--------+---------+         |                    |
            |                   |                    |
            +-------------------+                    |
            | (DAG prerequisites)                    |
            v                                        v
   +-----------------------+               +--------------------+
   | 04_skill_prereqs.csv  |               | 06_course_skills   |
   +-----------------------+               +---------+----------+
                                                     |
                                                     v
                                           +--------------------+
                                           |   05_courses.csv   |
                                           +--------------------+

                       +--------------------+
                       | 11_student_profile |
                       +---------+----------+
                                 |
       +------------+------------+-----------+-------------+
       |            |            |           |             |
       v            v            v           v             v
+-------------+ +----------+ +--------+ +----------+ +-----------+
| 12_student_ | | 10_assess| | 13_res_| | 19_learn_| | 20_certs_ |
|   skills    | |  _answers| | analysis| | activity | |    csv    |
+-------------+ +----------+ +--------+ +----------+ +-----------+
```

---

## 1. `01_careers.csv`
**Purpose**: Primary registry of industry career roles, competencies, and benchmarks.
- **Primary Key**: `career_id` (e.g., `C001`)

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `career_id` | String (PK) | No | Unique identifier (`C001`–`C025`) | `C001` |
| `career_name` | String | No | Official industry title | `Machine Learning Engineer` |
| `category` | String | No | Functional domain | `AI & Machine Learning` |
| `description` | String | No | Role scope & operational duties | `Designs, builds, trains...` |
| `difficulty` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Advanced` |
| `estimated_preparation_months` | Integer | No | Typical study duration (months) | `8` |
| `core_focus` | String | No | Key technical domain concentration | `Deep Learning & Production MLOps` |
| `typical_entry_level` | String | No | Typical hiring criteria | `B.Tech / M.Tech in CS / AI` |

---

## 2. `02_skills.csv`
**Purpose**: Master ontology of technical and soft skills tracked by PathForge AI.
- **Primary Key**: `skill_id` (e.g., `S001`)

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `skill_id` | String (PK) | No | Unique identifier (`S001`–`S151`) | `S001` |
| `skill_name` | String | No | Canonical skill designation | `Python` |
| `category` | String | No | High-level disciplinary grouping | `Programming` |
| `subcategory` | String | No | Granular domain | `Core Language` |
| `description` | String | No | Technical description | `High-level general-purpose...` |
| `beginner_definition` | String | No | Expected baseline mastery criteria | `Basic syntax, loops, data types` |
| `intermediate_definition` | String | No | Expected intermediate mastery criteria | `OOP, decorators, generators` |
| `advanced_definition` | String | No | Expected advanced production mastery | `Metaclasses, C-extensions, GIL` |

---

## 3. `03_career_skills.csv`
**Purpose**: Weighted skill requirements for each career. Used by the **Skill Gap Analyzer** and **Career Readiness Model**.
- **Composite Primary Key**: (`career_id`, `skill_id`)
- **Foreign Keys**: `career_id` -> `01_careers.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `career_id` | String (FK) | No | References `01_careers.csv` | `C001` |
| `skill_id` | String (FK) | No | References `02_skills.csv` | `S028` |
| `required_level` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Advanced` |
| `importance` | Integer | No | Criticality scale from 1 to 5 | `5` |
| `weight` | Float | No | Decimal weight (Career sums to ~1.000) | `0.065` |
| `is_core_skill` | Boolean | No | Indicates non-negotiable core competency | `True` |

---

## 4. `04_skill_prerequisites.csv`
**Purpose**: Defines a strict Directed Acyclic Graph (DAG) for learning dependencies. Used to generate **Personalized Learning Roadmaps**.
- **Primary Key**: `prerequisite_id` (e.g., `PR001`)
- **Foreign Keys**: `prerequisite_skill_id` -> `02_skills.csv`, `dependent_skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `prerequisite_id` | String (PK) | No | Unique relation identifier | `PR001` |
| `prerequisite_skill_id` | String (FK) | No | Prerequisite skill ID | `S001` |
| `dependent_skill_id` | String (FK) | No | Successor skill ID (must be acyclic) | `S012` |
| `relationship` | String | No | Type of dependency (`Prerequisite`) | `Prerequisite` |
| `priority` | Enum | No | `Critical`, `High`, `Recommended` | `Critical` |

---

## 5. `05_courses.csv`
**Purpose**: Curated inventory of online courses for targeted skill gap closure.
- **Primary Key**: `course_id` (e.g., `CR001`)

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `course_id` | String (PK) | No | Unique course identifier | `CR001` |
| `course_name` | String | No | Course title | `Machine Learning Specialization` |
| `provider` | String | No | Educational platform / university | `Coursera / DeepLearning.AI` |
| `description` | String | No | Pedagogical summary | `Master foundational ML concepts...` |
| `category` | String | No | Academic discipline | `Machine Learning` |
| `difficulty` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Intermediate` |
| `duration_hours` | Integer | No | Total estimated workload (hours) | `60` |
| `format` | String | No | Delivery format | `Self-Paced with Labs` |
| `rating` | Float | No | User rating between 1.0 and 5.0 | `4.9` |
| `url` | String | No | Canonical link (`demo://course/CR001`) | `demo://course/CR001` |
| `language` | String | No | Primary instruction language | `English` |

---

## 6. `06_course_skills.csv`
**Purpose**: Skill vectorization mappings for courses. Used by **TF-IDF & Cosine Similarity Course Recommendation**.
- **Composite Primary Key**: (`course_id`, `skill_id`)
- **Foreign Keys**: `course_id` -> `05_courses.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `course_id` | String (FK) | No | References `05_courses.csv` | `CR001` |
| `skill_id` | String (FK) | No | References `02_skills.csv` | `S028` |
| `coverage_level` | Enum | No | Depth of coverage (`Beginner`, `Intermediate`, `Advanced`) | `Intermediate` |
| `importance` | Integer | No | Syllabus weight (1 to 5) | `5` |

---

## 7. `07_projects.csv`
**Purpose**: Hands-on portfolio project templates recommended to bridge practical skill gaps.
- **Primary Key**: `project_id` (e.g., `P001`)
- **Foreign Key**: `career_id` -> `01_careers.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `project_id` | String (PK) | No | Unique project identifier | `P001` |
| `project_name` | String | No | Project title | `Customer Churn Prediction Platform` |
| `description` | String | No | Architecture and objectives | `End-to-end classification pipeline...` |
| `category` | String | No | Domain category | `Machine Learning & Analytics` |
| `difficulty` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Intermediate` |
| `estimated_duration_weeks` | Integer | No | Workload in weeks | `4` |
| `career_id` | String (FK) | No | Primary career role application | `C001` |
| `learning_outcomes` | String | No | Verifiable demonstrable skills | `Feature pipelines, PR-AUC tuning...` |

---

## 8. `08_project_skills.csv`
**Purpose**: Links practical projects to their required constituent skills.
- **Composite Primary Key**: (`project_id`, `skill_id`)
- **Foreign Keys**: `project_id` -> `07_projects.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `project_id` | String (FK) | No | References `07_projects.csv` | `P001` |
| `skill_id` | String (FK) | No | References `02_skills.csv` | `S028` |
| `required_level` | Enum | No | Target difficulty level | `Intermediate` |
| `importance` | Integer | No | Project dependency weighting (1 to 5) | `5` |

---

## 9. `09_assessment_questions.csv`
**Purpose**: Item bank for dynamic, adaptive diagnostic assessments.
- **Primary Key**: `question_id` (e.g., `Q001`)
- **Foreign Keys**: `career_id` -> `01_careers.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `question_id` | String (PK) | No | Unique question identifier | `Q001` |
| `career_id` | String (FK) | No | Relevant career domain | `C001` |
| `skill_id` | String (FK) | No | Target evaluated skill | `S001` |
| `difficulty` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Beginner` |
| `question_type` | Enum | No | `MCQ`, `Code Output`, `Conceptual`, `Problem Solving`, `Scenario Based` | `MCQ` |
| `question` | String | No | Technical question text (unique) | `Which built-in type in Python is mutable?` |
| `option_a` | String | No | First choice | `tuple` |
| `option_b` | String | No | Second choice | `list` |
| `option_c` | String | No | Third choice | `str` |
| `option_d` | String | No | Fourth choice | `int` |
| `correct_answer` | String | No | Must exactly equal one of options a, b, c, d | `list` |
| `explanation` | String | No | Pedagogical explanation | `Lists are mutable sequences...` |
| `weight` | Float | No | Item discrimination weight (`1.0`–`2.0`) | `1.0` |

---

## 10. `10_assessment_answers.csv`
**Purpose**: Student assessment attempt logs used for calculating verified assessment scores.
- **Primary Key**: `attempt_id` (e.g., `A00001`)
- **Foreign Keys**: `student_id` -> `11_student_profiles.csv`, `question_id` -> `09_assessment_questions.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `attempt_id` | String (PK) | No | Unique attempt record | `A00001` |
| `student_id` | String (FK) | No | References `11_student_profiles.csv` | `U001` |
| `question_id` | String (FK) | No | References `09_assessment_questions.csv` | `Q001` |
| `selected_answer` | String | No | Student's submitted answer | `list` |
| `correct` | Boolean | No | Scoring outcome | `True` |
| `time_taken_seconds` | Integer | No | Execution latency in seconds (> 0) | `24` |
| `attempt_date` | Date/ISO | No | Timestamp of submission | `2026-08-14` |

---

## 11. `11_student_profiles.csv`
**Purpose**: Core student demographics, academic background, and career targets.
- **Primary Key**: `student_id` (e.g., `U001`)
- **Foreign Key**: `target_career_id` -> `01_careers.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `student_id` | String (PK) | No | Unique student identifier | `U001` |
| `first_name` | String | No | Student first name | `Alex` |
| `last_name` | String | No | Student last name | `Chen` |
| `email` | String | No | Contact address | `alex.chen@stanford.edu` |
| `college` | String | No | Academic institution | `Stanford University` |
| `department` | String | No | Faculty / department | `Department of Computer Science` |
| `degree` | String | No | Program of study | `B.Tech AI & Data Science` |
| `graduation_year` | Integer | No | Anticipated graduation year | `2026` |
| `cgpa` | Float | No | Cumulative GPA (0.0 to 10.0) | `8.8` |
| `target_career_id` | String (FK) | No | Primary target role from `01_careers.csv` | `C001` |
| `weekly_learning_hours` | Integer | No | Self-allocated weekly commitment | `12` |
| `preferred_difficulty` | Enum | No | `Adaptive`, `Beginner`, `Intermediate`, `Advanced` | `Adaptive` |
| `learning_mode` | String | No | Pedagogical style preference | `Project-based` |

---

## 12. `12_student_skills.csv`
**Purpose**: The central **Evidence Grounding Matrix**. Resolves self-declared claims against multi-modal empirical evidence.
- **Composite Primary Key**: (`student_id`, `skill_id`)
- **Foreign Keys**: `student_id` -> `11_student_profiles.csv`, `skill_id` -> `02_skills.csv`

$$\text{Final Mastery} = f(\text{Assessment}, \text{Projects}, \text{Certificates}, \text{Mentor}, \text{Resume})$$

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `student_id` | String (FK) | No | References `11_student_profiles.csv` | `U001` |
| `skill_id` | String (FK) | No | References `02_skills.csv` | `S001` |
| `self_declared_score` | Integer | No | User-claimed competency (0–100) | `90` |
| `resume_score` | Integer | No | Extracted resume presence (0–100) | `85` |
| `assessment_score` | Integer | No | Verified test result (0–100) | `88` |
| `project_score` | Integer | No | Evaluated project implementation (0–100) | `85` |
| `certificate_score` | Integer | No | Verified credential weight (0–100) | `90` |
| `mentor_score` | Integer | No | Human expert rating (0–100) | `85` |
| `final_mastery` | Integer | No | Calibrated ground-truth mastery (0–100) | `88` |
| `mastery_level` | Enum | No | `Missing`, `Beginner`, `Developing`, `Proficient`, `Strong` | `Strong` |
| `evidence_count` | Integer | No | Independent verification sources (0–5) | `5` |
| `last_updated` | Date/ISO | No | Recency timestamp | `2026-09-28` |

---

## 13. `13_resume_analysis.csv`
**Purpose**: Raw entity extraction and confidence metrics from student resume parsing.
- **Primary Key**: `resume_id` (e.g., `R0001`)
- **Foreign Keys**: `student_id` -> `11_student_profiles.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `resume_id` | String (PK) | No | Unique extraction entry | `R0001` |
| `student_id` | String (FK) | No | References `11_student_profiles.csv` | `U001` |
| `skill_id` | String (FK) | No | Detected skill entity | `S001` |
| `detected` | Boolean | No | Presence flag | `True` |
| `confidence` | Float | No | Extraction confidence (0.0 to 1.0) | `0.94` |
| `evidence_type` | String | No | Section (`Project Section`, `Skill Section`, etc.) | `Project Section` |
| `project_evidence` | Boolean | No | Backed by a project description | `True` |
| `experience_evidence`| Boolean | No | Backed by work / internship history | `False` |
| `certificate_evidence`| Boolean | No | Backed by documented certification | `True` |

---

## 14. `14_companies.csv`
**Purpose**: Corporate profiles for the **Company Intelligence** portal.
- **Primary Key**: `company_id` (e.g., `COMP001`)

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | String (PK) | No | Unique company ID | `COMP001` |
| `company_name` | String | No | Registered business name | `Tata Consultancy Services (TCS)` |
| `industry` | String | No | Primary sector | `IT Services & Consulting` |
| `company_size` | String | No | Headcount bracket | `Enterprise (100k+)` |
| `location` | String | No | Geographic headquarters / campuses | `Chennai, India` |
| `description` | String | No | Corporate overview | `Global leader in IT services...` |
| `career_categories`| String | No | Active hiring categories | `Software Development, Data Science` |

---

## 15. `15_company_skills.csv`
**Purpose**: Company-specific hiring criteria mapped to roles.
- **Composite Primary Key**: (`company_id`, `career_id`, `skill_id`)
- **Foreign Keys**: `company_id` -> `14_companies.csv`, `career_id` -> `01_careers.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | String (FK) | No | References `14_companies.csv` | `COMP001` |
| `career_id` | String (FK) | No | Targeted role ID | `C001` |
| `skill_id` | String (FK) | No | Required skill ID | `S001` |
| `required_level` | Enum | No | `Beginner`, `Intermediate`, `Advanced` | `Advanced` |
| `importance` | Integer | No | Screening priority (1 to 5) | `5` |

---

## 16. `16_company_jobs.csv`
**Purpose**: Active employment opportunities and job postings.
- **Primary Key**: `job_id` (e.g., `J001`)
- **Foreign Keys**: `company_id` -> `14_companies.csv`, `career_id` -> `01_careers.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `job_id` | String (PK) | No | Unique job posting ID | `J001` |
| `company_id` | String (FK) | No | Hiring company | `COMP001` |
| `career_id` | String (FK) | No | Associated career role | `C001` |
| `job_title` | String | No | Job opening title | `Machine Learning Engineer` |
| `location` | String | No | Job location / Remote | `Chennai, India` |
| `experience_required` | String | No | Required tenure bracket | `0–2 years` |
| `employment_type` | String | No | `Full-Time`, `Contract`, `Internship` | `Full-Time` |
| `description` | String | No | Job spec & requirements | `Design, train, and deploy production ML...` |
| `required_skills` | String | No | Must-have competencies | `Python, SQL, Machine Learning` |
| `preferred_skills`| String | No | Nice-to-have competencies | `Docker, FastAPI` |

---

## 17. `17_mentor_profiles.csv`
**Purpose**: Verified expert mentors offering guidance, code reviews, and mock assessments.
- **Primary Key**: `mentor_id` (e.g., `M001`)

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `mentor_id` | String (PK) | No | Unique mentor ID | `M001` |
| `name` | String | No | Full name | `Dr. Arun Kumar` |
| `expertise` | String | No | Primary domain expertise | `Machine Learning & AI` |
| `experience_years`| Integer | No | Professional industry tenure | `8` |
| `skills` | String | No | Mentored competencies | `Python, Machine Learning, Deep Learning` |
| `bio` | String | No | Professional background summary | `Principal ML Scientist with extensive...` |
| `availability` | String | No | Current booking status | `Available` |
| `rating` | Float | No | Cumulative mentee rating (1.0 to 5.0) | `4.8` |

---

## 18. `18_mentor_feedback.csv`
**Purpose**: Structured reviews by mentors on student projects. Directly updates `mentor_score` in `12_student_skills.csv`.
- **Primary Key**: `feedback_id` (e.g., `F0001`)
- **Foreign Keys**: `mentor_id` -> `17_mentor_profiles.csv`, `student_id` -> `11_student_profiles.csv`, `project_id` -> `07_projects.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `feedback_id` | String (PK) | No | Unique feedback entry | `F0001` |
| `mentor_id` | String (FK) | No | Evaluating mentor | `M001` |
| `student_id` | String (FK) | No | Evaluated student | `U001` |
| `project_id` | String (FK) | No | Evaluated project | `P001` |
| `skill_id` | String (FK) | No | Assessed skill | `S004` |
| `rating` | Integer | No | Score from 1 to 5 | `4` |
| `strengths` | String | No | Highlights of implementation | `Good model architecture and clean data...` |
| `improvement_areas`| String | No | Weaknesses requiring refinement | `Improve feature engineering and model...` |
| `comments` | String | No | Mentor qualitative note | `Dr. Arun Kumar reviewed your project.` |
| `recommended_action`| String | No | Prescribed next milestone | `Complete PyTorch Foundations module.` |
| `feedback_date` | Date/ISO | No | Review date | `2026-09-24` |

---

## 19. `19_learning_activity.csv`
**Purpose**: Fine-grained telemetry of daily learning sessions. Generates the **GitHub-style learning activity heatmap** and streak counters.
- **Primary Key**: `activity_id` (e.g., `ACT000001`)
- **Foreign Key**: `student_id` -> `11_student_profiles.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `activity_id` | String (PK) | No | Unique activity record | `ACT000001` |
| `student_id` | String (FK) | No | References student profile | `U001` |
| `activity_date` | Date/ISO | No | Calendar date of activity | `2026-09-15` |
| `activity_type` | Enum | No | `Coding`, `Course`, `Assessment`, `Project`, `Reading`, `Mentor Session`, `Certificate`, `Roadmap` | `Coding` |
| `activity_name` | String | No | Human-readable title of activity | `Session in coding` |
| `duration_minutes` | Integer | No | Session duration in minutes (> 0) | `90` |
| `activity_count` | Integer | No | Units / tasks completed | `1` |

---

## 20. `20_certificates.csv`
**Purpose**: Official credentials uploaded by students with independent verification tracking.
- **Primary Key**: `certificate_id` (e.g., `CERT0001`)
- **Foreign Keys**: `student_id` -> `11_student_profiles.csv`, `skill_id` -> `02_skills.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `certificate_id` | String (PK) | No | Unique certificate record | `CERT0001` |
| `student_id` | String (FK) | No | References student profile | `U001` |
| `provider` | String | No | Issuing organization | `Coursera` |
| `course_name` | String | No | Course title | `Machine Learning Specialization` |
| `skill_id` | String (FK) | No | Validated skill | `S004` |
| `issue_date` | Date/ISO | No | Issuance date | `2026-01-20` |
| `verification_status`| Enum | No | `Verified`, `Pending`, `Unverified` | `Verified` |
| `certificate_url`| String | No | Verification link (`demo://certificate/...`) | `demo://certificate/CERT0001` |

---

## 21. `21_job_applications.csv`
**Purpose**: Tracks job applications, readiness scores, and recruitment pipeline status.
- **Primary Key**: `application_id` (e.g., `APP0001`)
- **Foreign Keys**: `student_id` -> `11_student_profiles.csv`, `job_id` -> `16_company_jobs.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `application_id` | String (PK) | No | Unique application ID | `APP0001` |
| `student_id` | String (FK) | No | References student profile | `U001` |
| `job_id` | String (FK) | No | References job posting | `J001` |
| `resume_match` | Integer | No | Match percentage (0–100) | `88` |
| `skill_match` | Integer | No | Skill alignment percentage (0–100) | `82` |
| `project_match` | Integer | No | Project portfolio alignment (0–100) | `85` |
| `application_readiness`| Integer | No | Overall readiness index (0–100) | `85` |
| `status` | Enum | No | `Draft`, `Prepared`, `Applied`, `Interview`, `Selected`, `Rejected` | `Prepared` |
| `application_date`| Date/ISO | No | Submission timestamp | `2026-07-10` |

---

## 22. `22_feedback.csv`
**Purpose**: System feedback submitted by students for NLP sentiment analysis and feature iteration.
- **Primary Key**: `feedback_id` (e.g., `FDB0001`)
- **Foreign Key**: `student_id` -> `11_student_profiles.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `feedback_id` | String (PK) | No | Unique entry ID | `FDB0001` |
| `student_id` | String (FK) | No | Submitting student | `U001` |
| `category` | String | No | Target UI/ML subsystem | `Recommendations` |
| `rating` | Integer | No | User rating (1 to 5) | `5` |
| `comment` | String | No | Verbatim qualitative feedback | `Explainability notes make it easy to trust...` |
| `sentiment` | Enum | No | `Positive`, `Neutral`, `Negative` | `Positive` |
| `issue_type` | String | No | Categorized issue (`None`, `Usability`, `Feature Request`) | `None` |
| `created_at` | Date/ISO | No | Creation timestamp | `2026-06-15` |

---

## 23. `23_notifications.csv`
**Purpose**: Event-driven notification queue for assessments, recommendations, mentor reviews, and roadmap milestones.
- **Primary Key**: `notification_id` (e.g., `NOTIF0001`)
- **Foreign Key**: `student_id` -> `11_student_profiles.csv`

| Column | Data Type | Nullable | Description & Constraints | Example |
| :--- | :--- | :--- | :--- | :--- |
| `notification_id` | String (PK) | No | Unique alert ID | `NOTIF0001` |
| `student_id` | String (FK) | No | Recipient student | `U001` |
| `type` | Enum | No | `Assessment`, `Course`, `Roadmap`, `Mentor`, `Job`, `Certificate`, `System` | `Assessment` |
| `title` | String | No | Alert headline | `Assessment Result Published` |
| `message` | String | No | Detailed notification body | `Diagnostic score for Machine Learning verified.` |
| `is_read` | Boolean | No | Read status flag | `False` |
| `created_at` | Date/ISO | No | Creation timestamp | `2026-08-01` |
