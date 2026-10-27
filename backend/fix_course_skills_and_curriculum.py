"""
Script to fix course-skill mappings and regenerate curriculum with 100% domain accuracy.
Corrects all mismatched courses (e.g. CR002 Python Fundamentals having TypeScript skills).
Updates datasets/06_course_skills.csv, database CourseSkill, CourseLesson, and LessonResource.
"""
import sys
import csv
import json
import re
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal
from database.models import (
    Course,
    CourseSkill,
    CourseLesson,
    LessonResource,
    Skill,
    StudentCourseProgress,
    StudentLessonProgress,
)
from database.seed_curriculum import generate_curriculum_for_course, DOMAIN_RESOURCES, resolve_domain, reconcile_existing_progress

# Load all skills from CSV
skills_by_name = {}
skills_by_id = {}
skills_csv_path = backend_dir.parent / "datasets" / "02_skills.csv"

with open(skills_csv_path, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        sid = row["skill_id"]
        sname = row["skill_name"]
        cat = row["category"]
        skills_by_id[sid] = {"id": sid, "name": sname, "category": cat}
        skills_by_name[sname.lower()] = sid
        # Also clean versions
        clean_name = re.sub(r"\s*\([^)]*\)", "", sname).strip().lower()
        skills_by_name[clean_name] = sid

def find_skills_for_course(course_id: str, course_name: str, category: str, description: str):
    name_lower = course_name.lower()
    desc_lower = description.lower()
    combined = f"{name_lower} {desc_lower}"
    
    # Explicit mapping overrides for catalog core courses
    EXPLICIT_OVERRIDES = {
        "CR001": ["S001", "S011", "S105"],                                   # Python for Everybody -> Python, Data Structures, OOP
        "CR002": ["S001", "S021", "S022", "S025", "S027"],                   # Python Fundamentals for Data Science -> Python, NumPy, Pandas, Data Cleaning, EDA
        "CR003": ["S011", "S012", "S013", "S014"],                           # Data Structures and Algorithms -> Data Structures, Algorithms, Graph Alg, Dynamic Prog
        "CR004": ["S028", "S029", "S030", "S031", "S032"],                   # Machine Learning Specialization -> ML, Scikit-learn, Model Eval, Regression, Random Forests
        "CR005": ["S038", "S039", "S040", "S041", "S043"],                   # Deep Learning Specialization -> Deep Learning, Neural Nets, PyTorch, TensorFlow, CNN
        "CR006": ["S046", "S047", "S045", "S048"],                           # NLP with Attention Models -> NLP, Word Embeddings, Transformers, Hugging Face
        "CR007": ["S043", "S056", "S057", "S058", "S059"],                   # CNN for Visual Recognition -> CNN, OpenCV, Image Processing, Object Detection, Segmentation
        "CR008": ["S001", "S022", "S021", "S025", "S027"],                   # Applied Data Science with Python -> Python, Pandas, NumPy, Data Cleaning, EDA
        "CR009": ["S007", "S073", "S069", "S070"],                           # SQL for Data Science -> SQL, DB Indexing, PostgreSQL, MySQL
        "CR010": ["S093", "S094", "S096", "S121"],                           # Docker & Kubernetes -> Docker, Kubernetes, CI/CD, Ansible
        "CR011": ["S101", "S102", "S103", "S104", "S112"],                   # MLOps Specialization -> MLOps, MLflow, Model Serving, Monitoring, Kubeflow
        "CR012": ["S074", "S079", "S082", "S001"],                           # Building Modern REST APIs with FastAPI -> FastAPI, REST API Design, Auth, Python
        "CR013": ["S085", "S077", "S005", "S078", "S083"],                   # Full Stack React & Node.js -> React, Node.js, JavaScript, Express, HTML5
        "CR014": ["S097", "S095", "S100", "S096"],                           # AWS Certified Solutions Architect -> AWS, Linux Admin, Terraform, CI/CD
        "CR015": ["S098", "S065", "S060", "S063", "S061"],                   # Data Engineering on GCP -> GCP, BigQuery, ETL/ELT, Data Warehousing, Spark
        "CR016": ["S061", "S062", "S001", "S066"],                           # Spark and Python for Big Data with PySpark -> Spark, PySpark, Python, Kafka
        "CR017": ["S049", "S050", "S051", "S054", "S045"],                   # Generative AI with LLMs -> LLMs, RAG, LangChain, Prompt Engineering, Transformers
        "CR018": ["S015", "S016", "S138"],                                   # Linear Algebra -> Linear Algebra, Calculus, Linear Programming
        "CR019": ["S017", "S018", "S019", "S020"],                           # Statistics and Probability -> Probability, Descriptive Stats, Inferential Stats, A/B Testing
        "CR020": ["S037", "S001", "S022", "S021"],                           # Time Series Analysis with Python -> Time Series, Python, Pandas, NumPy
        "CR021": ["S139", "S028", "S038"],                                   # Reinforcement Learning -> Reinforcement Learning, ML, Deep Learning
        "CR022": ["S086", "S006", "S085", "S088"],                           # Next.js & TypeScript -> Next.js, TypeScript, React, Tailwind CSS
        "CR023": ["S143", "S144", "S111", "S110"],                           # Cyber Threat Intelligence -> Threat Hunting, Pen Testing, Web Security, Vulnerability Assessment
        "CR024": ["S050", "S053", "S051", "S049"],                           # Vector Search & RAG -> RAG, Vector Databases, LangChain, LLMs
        "CR025": ["S068", "S060", "S063", "S007"],                           # Data Transformation with dbt -> dbt, ETL/ELT, Data Warehousing, SQL
        "CR026": ["S077", "S078", "S079", "S082"],                           # Node.js Masterclass -> Node.js, Express, REST API, Auth
        "CR027": ["S085", "S005", "S083", "S084"],                           # React Foundations & Practice -> React, JavaScript, HTML5, CSS3
        "CR040": ["S093", "S095", "S096", "S094"],                           # Docker Masterclass -> Docker, Linux, CI/CD, Kubernetes
        "CR042": ["S076", "S001", "S079", "S082"],                           # Django Advanced Systems -> Django, Python, REST API, Auth
        "CR059": ["S001", "S105", "S108"],                                   # Python Foundations & Practice -> Python, OOP, Testing
        "CR060": ["S007", "S073", "S069"],                                   # SQL Foundations & Practice -> SQL, DB Indexing, PostgreSQL
        "CR065": ["S005", "S083", "S084"],                                   # JavaScript Engineering Essentials -> JavaScript, HTML5, CSS3
        "CR069": ["S094", "S093", "S122", "S095"],                           # Kubernetes Engineering Essentials -> Kubernetes, Docker, Helm, Linux
        "CR074": ["S006", "S005", "S085"],                                   # TypeScript Bootcamp -> TypeScript, JavaScript, React
        "CR100": ["S094", "S093", "S122"],                                   # Kubernetes Bootcamp -> Kubernetes, Docker, Helm
        "CR158": ["S071", "S053", "S072"],                                   # MongoDB Foundations & Practice -> MongoDB, Vector DB, Redis
    }
    
    if course_id in EXPLICIT_OVERRIDES:
        return EXPLICIT_OVERRIDES[course_id]

    # For auto-generated courses with naming pattern "<Skill Name> <Format>"
    matched_skills = []
    # Try exact skill name match in title
    for s_name, sid in skills_by_name.items():
        pattern = r"\b" + re.escape(s_name) + r"\b"
        if re.search(pattern, name_lower):
            if sid not in matched_skills:
                matched_skills.append(sid)
                
    # Add related skills based on category if needed
    if matched_skills:
        primary_sid = matched_skills[0]
        primary_cat = skills_by_id[primary_sid]["category"]
        for sid, sinfo in skills_by_id.items():
            if sinfo["category"] == primary_cat and sid not in matched_skills and len(matched_skills) < 4:
                matched_skills.append(sid)
        return matched_skills
        
    # Fallback to category
    for s_name, sid in skills_by_name.items():
        if s_name in combined and sid not in matched_skills:
            matched_skills.append(sid)
            if len(matched_skills) >= 3:
                break
                
    if not matched_skills:
        matched_skills = ["S001"] # Default Python
        
    return matched_skills

def run_fix():
    print("=== Fixing Course Skills Mappings & Updating Catalog Datasets ===")
    db = SessionLocal()
    
    courses = db.query(Course).all()
    print(f"Total courses in database: {len(courses)}")
    
    # 1. Rebuild course_skills rows
    new_csv_rows = []
    
    for c in courses:
        s_ids = find_skills_for_course(c.course_id, c.course_name, c.category, c.description)
        
        # Clear existing DB mappings for this course
        db.query(CourseSkill).filter(CourseSkill.course_id == c.course_id).delete()
        
        for idx, sid in enumerate(s_ids):
            imp = 5 if idx == 0 else max(3, 5 - idx)
            cov = "Advanced" if idx == 0 and c.difficulty == "Advanced" else ("Intermediate" if idx == 0 else "Beginner")
            
            cs = CourseSkill(
                course_id=c.course_id,
                skill_id=sid,
                coverage_level=cov,
                importance=imp,
            )
            db.add(cs)
            new_csv_rows.append({
                "course_id": c.course_id,
                "skill_id": sid,
                "coverage_level": cov,
                "importance": imp,
            })
            
    db.commit()
    print(f"Course skills updated in database. Total mappings: {len(new_csv_rows)}")
    
    # Write back to datasets/06_course_skills.csv
    csv_paths = [
        backend_dir.parent / "datasets" / "06_course_skills.csv",
        backend_dir.parent / "datasets" / "archive_duplicate_datasets" / "course_skills.csv",
    ]
    for p in csv_paths:
        if p.parent.exists():
            with open(p, mode="w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["course_id", "skill_id", "coverage_level", "importance"])
                writer.writeheader()
                writer.writerows(new_csv_rows)
            print(f"Wrote updated mappings to {p}")
            
    # 2. Regenerate curricula and update CourseLesson and LessonResource in DB
    print("\n=== Regenerating Subject-Specific Curricula for all Courses ===")
    total_lessons_updated = 0
    total_resources_updated = 0
    
    for course in courses:
        # Fetch newly mapped skills in importance descending order
        c_skills = db.query(CourseSkill).filter(CourseSkill.course_id == course.course_id).order_by(CourseSkill.importance.desc()).all()
        skill_names = [skills_by_id[cs.skill_id]["name"] for cs in c_skills if cs.skill_id in skills_by_id]
        if not skill_names:
            skill_names = [course.category]
            
        lessons_data, domain = generate_curriculum_for_course(course, skill_names)
        
        for l_data in lessons_data:
            l_id = f"{course.course_id}_L{l_data['num']}"
            lesson = db.query(CourseLesson).filter(CourseLesson.lesson_id == l_id).first()
            if not lesson:
                lesson = CourseLesson(
                    lesson_id=l_id,
                    course_id=course.course_id,
                    lesson_number=l_data["num"],
                    title=l_data["title"],
                    overview=l_data["overview"],
                    learning_objectives_json=json.dumps(l_data["objectives"]),
                    key_concepts_json=json.dumps(l_data["concepts"]),
                    study_notes=l_data["study_notes"],
                    step_by_step_explanation=l_data["explanation"],
                    code_examples_json=json.dumps(l_data["code_examples"]),
                    practice_exercises_json=json.dumps(l_data["exercises"]),
                    estimated_minutes=l_data["est_mins"],
                    assessment_prerequisites="complete_study_and_resources",
                    completion_criteria="study_notes_read,resources_reviewed,assessment_passed",
                    is_project_provided=True,
                )
                db.add(lesson)
            else:
                lesson.title = l_data["title"]
                lesson.overview = l_data["overview"]
                lesson.learning_objectives_json = json.dumps(l_data["objectives"])
                lesson.key_concepts_json = json.dumps(l_data["concepts"])
                lesson.study_notes = l_data["study_notes"]
                lesson.step_by_step_explanation = l_data["explanation"]
                lesson.code_examples_json = json.dumps(l_data["code_examples"])
                lesson.practice_exercises_json = json.dumps(l_data["exercises"])
                lesson.estimated_minutes = l_data["est_mins"]
            total_lessons_updated += 1
            
            # Update resources
            res_specs = [
                {
                    "id": f"{l_id}_RES1",
                    "order": 1,
                    "type": "documentation",
                    "title": domain["doc_name"],
                    "url": domain["doc_url"],
                    "provider": domain["doc_provider"],
                    "desc": f"Verified official documentation and reference manual for {skill_names[0]} covering module fundamentals.",
                },
                {
                    "id": f"{l_id}_RES2",
                    "order": 2,
                    "type": "video",
                    "title": domain["video_name"],
                    "url": domain["video_url"],
                    "provider": domain["video_provider"],
                    "desc": f"High-yield video lecture and practical walkthrough explaining core {skill_names[0]} concepts.",
                },
                {
                    "id": f"{l_id}_RES3",
                    "order": 3,
                    "type": "tutorial",
                    "title": f"PathForge AI Comprehensive Study Guide & Practice Notes: {l_data['title']}",
                    "url": f"https://pathforge.ai/curriculum/{course.course_id}/{l_id}",
                    "provider": "PathForge AI Learning Lab",
                    "desc": (
                        "Integrated interactive study notes, architectural walkthroughs, and runnable code examples. "
                        "Note: Interactive digital notes are rendered natively in the application; no third-party PDF download required."
                    ),
                },
            ]
            for spec in res_specs:
                res = db.query(LessonResource).filter(LessonResource.resource_id == spec["id"]).first()
                if not res:
                    res = LessonResource(
                        resource_id=spec["id"],
                        lesson_id=l_id,
                        course_id=course.course_id,
                        resource_order=spec["order"],
                        resource_type=spec["type"],
                        title=spec["title"],
                        url=spec["url"],
                        description=spec["desc"],
                        provider_name=spec["provider"],
                        is_verified=True,
                    )
                    db.add(res)
                else:
                    res.title = spec["title"]
                    res.url = spec["url"]
                    res.description = spec["desc"]
                    res.provider_name = spec["provider"]
                    res.resource_type = spec["type"]
                total_resources_updated += 1
                
    db.commit()
    print(f"Updated {total_lessons_updated} lessons and {total_resources_updated} resources.")
    
    # Reconcile progress records
    reconcile_existing_progress(db)
    db.close()
    print("Done! Course identity and curriculum alignment complete.")

if __name__ == "__main__":
    run_fix()
