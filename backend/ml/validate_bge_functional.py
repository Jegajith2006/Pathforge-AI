"""
PathForge AI - Comprehensive BGE Model and ML Intelligence Layer Functional Validation
Executes tests 1 through 18 with realistic PathForge AI inputs, actual local model execution,
and verified numerical calculations.
"""

import sys
import time
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

# Ensure backend root is in sys.path
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
import sentence_transformers

# Test 18 imports
print("=" * 70)
print("TEST 18: ML MODULE IMPORTS VERIFICATION")
print("=" * 70)
import_errors = []
try:
    import ml.model_config as model_config
    print("[OK] ml.model_config imported successfully.")
except Exception as e:
    import_errors.append(f"ml.model_config: {e}")

try:
    import ml.embedding_service as embedding_service
    print("[OK] ml.embedding_service imported successfully.")
except Exception as e:
    import_errors.append(f"ml.embedding_service: {e}")

try:
    import ml.skill_matching as skill_matching
    print("[OK] ml.skill_matching imported successfully.")
except Exception as e:
    import_errors.append(f"ml.skill_matching: {e}")

try:
    import ml.career_matching as career_matching
    print("[OK] ml.career_matching imported successfully.")
except Exception as e:
    import_errors.append(f"ml.career_matching: {e}")

try:
    import ml.course_recommendation as course_recommendation
    print("[OK] ml.course_recommendation imported successfully.")
except Exception as e:
    import_errors.append(f"ml.course_recommendation: {e}")

try:
    import ml.project_recommendation as project_recommendation
    print("[OK] ml.project_recommendation imported successfully.")
except Exception as e:
    import_errors.append(f"ml.project_recommendation: {e}")

try:
    import ml.job_matching as job_matching
    print("[OK] ml.job_matching imported successfully.")
except Exception as e:
    import_errors.append(f"ml.job_matching: {e}")

if import_errors:
    print(f"FAILED imports: {import_errors}")
else:
    print("PASSED: All 7 ML intelligence layer modules imported without errors.\n")


# ---------------------------------------------------------------------------
# Test 16: Model Resource Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 16: MODEL RESOURCE TEST")
print("=" * 70)
device_name = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Python version:               {sys.version.split()[0]}")
print(f"PyTorch version:              {torch.__version__}")
print(f"Sentence Transformers version:{sentence_transformers.__version__}")
print(f"Model name:                   {model_config.EMBEDDING_MODEL}")
print(f"Model local path:             {model_config.LOCAL_MODEL_DIR.resolve()}")
print(f"Local model files exist:      {model_config.LOCAL_MODEL_DIR.exists()}")
print(f"Device being used:            {device_name.upper()}")
print(f"Embedding dimension config:   {model_config.EMBEDDING_DIMENSION}")
print()


# ---------------------------------------------------------------------------
# Test 1: Model Basic Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 1: MODEL BASIC TEST")
print("=" * 70)
test1_input = "Python machine learning engineer"
t0 = time.perf_counter()
emb1 = embedding_service.generate_embedding(test1_input)
t1 = time.perf_counter()

dim1 = len(emb1)
is_finite = bool(np.all(np.isfinite(emb1)))
norm1 = float(np.linalg.norm(emb1))

print(f"Model:                        {model_config.EMBEDDING_MODEL}")
print(f"Input text:                   '{test1_input}'")
print(f"Embedding dimension:          {dim1}")
print(f"Is finite numerical values:   {is_finite}")
print(f"Embedding norm:               {norm1:.6f} (Normalized: {abs(norm1 - 1.0) < 1e-4})")
first_10_clean = [round(float(v), 6) for v in emb1[:10]]
print(f"Embedding first 10 values:    {first_10_clean}")
print(f"Inference latency:            {(t1 - t0)*1000:.2f} ms")
print()


# ---------------------------------------------------------------------------
# Test 2: Semantic Similarity Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 2: SEMANTIC SIMILARITY TEST")
print("=" * 70)
pair_a_1 = "Python machine learning engineer"
pair_a_2 = "Machine learning engineer using Python and Scikit-learn"
sim_a = embedding_service.semantic_similarity(pair_a_1, pair_a_2)

pair_b_1 = "Python machine learning engineer"
pair_b_2 = "Traditional South Indian cooking recipes"
sim_b = embedding_service.semantic_similarity(pair_b_1, pair_b_2)

print(f"Pair A:")
print(f"  Text 1: '{pair_a_1}'")
print(f"  Text 2: '{pair_a_2}'")
print(f"  Similarity: {sim_a:.4f} ({sim_a*100:.1f}%)")
print()
print(f"Pair B:")
print(f"  Text 1: '{pair_b_1}'")
print(f"  Text 2: '{pair_b_2}'")
print(f"  Similarity: {sim_b:.4f} ({sim_b*100:.1f}%)")
print()
print(f"Similarity difference (Pair A - Pair B): {sim_a - sim_b:.4f}")
print(f"Semantic distinction verified: {sim_a > sim_b}")
print()


# ---------------------------------------------------------------------------
# Test 3: Skill Matching Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 3: SKILL MATCHING TEST")
print("=" * 70)
resume_profile = (
    "I am a third-year Artificial Intelligence and Data Science student. "
    "I have built projects using Python, Pandas, NumPy, Scikit-learn, "
    "SQL and Streamlit. I have implemented machine learning models "
    "including Random Forest and classification algorithms."
)

candidate_skill_names = [
    "Python", "SQL", "Machine Learning", "Deep Learning", "React",
    "Docker", "Pandas", "Scikit-learn", "Statistics", "TensorFlow"
]

candidate_skill_dicts = [
    {"skill_id": f"SK{i+1:03d}", "skill_name": name, "category": "Technical"}
    for i, name in enumerate(candidate_skill_names)
]

# Run hybrid semantic skill detection
detected_skills = skill_matching.semantic_skill_detection(
    resume_text=resume_profile,
    candidate_skills=candidate_skill_dicts,
    threshold=0.55,
)
detected_id_map = {d["skill_name"].lower(): d for d in detected_skills}

# Individual semantic similarity scores directly against the resume text
resume_vec = embedding_service.generate_embedding(resume_profile)
skill_sim_results = []
for name in candidate_skill_names:
    s_vec = embedding_service.generate_embedding(name)
    sim = embedding_service.cosine_similarity(resume_vec, s_vec)
    is_det = name.lower() in detected_id_map
    mode = detected_id_map[name.lower()].get("detection_mode", "direct_text_match") if is_det else "not_detected"
    conf = detected_id_map[name.lower()].get("confidence", round(float(sim), 3)) if is_det else round(float(sim), 3)
    skill_sim_results.append({
        "skill": name,
        "similarity": round(float(sim), 4),
        "matched": is_det,
        "confidence": conf,
        "mode": mode,
    })

print("Skill Matching Results against Student Resume:")
print(f"{'Skill':<18} | {'Semantic Sim':<12} | {'Matched':<10} | {'Confidence':<10} | {'Status'}")
print("-" * 70)
for r in skill_sim_results:
    match_str = "MATCHED" if r["matched"] else "NOT MATCHED"
    print(f"{r['skill']:<18} | {r['similarity']:<12.4f} | {match_str:<10} | {r['confidence']:<10.3f} | {r['mode']}")
print()


# ---------------------------------------------------------------------------
# Test 4: Career Matching Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 4: CAREER MATCHING TEST")
print("=" * 70)
student_career_profile = (
    "Third-year AI and Data Science student with Python, SQL, Pandas, NumPy, "
    "Scikit-learn and machine learning project experience. Interested in "
    "artificial intelligence and data-driven software systems."
)
student_skills_list = ["Python", "SQL", "Pandas", "NumPy", "Scikit-learn", "Machine Learning"]

career_candidates = [
    {
        "career_id": "C001",
        "career_name": "Machine Learning Engineer",
        "description": "Build and deploy machine learning systems using Python, machine learning algorithms, model evaluation, APIs and MLOps.",
        "core_focus": "Model training, ML pipelines, APIs, MLOps, Python",
        "required_skills": [
            {"skill_name": "Python", "required_level": "Expert"},
            {"skill_name": "Machine Learning", "required_level": "Advanced"},
            {"skill_name": "Scikit-learn", "required_level": "Advanced"},
            {"skill_name": "APIs", "required_level": "Intermediate"},
            {"skill_name": "MLOps", "required_level": "Intermediate"},
        ],
    },
    {
        "career_id": "C002",
        "career_name": "Data Scientist",
        "description": "Analyze datasets, perform statistical analysis, build predictive models and communicate data-driven insights.",
        "core_focus": "Statistical analysis, predictive modeling, data visualization, Python",
        "required_skills": [
            {"skill_name": "Python", "required_level": "Advanced"},
            {"skill_name": "Pandas", "required_level": "Advanced"},
            {"skill_name": "Machine Learning", "required_level": "Advanced"},
            {"skill_name": "Statistical Analysis", "required_level": "Advanced"},
            {"skill_name": "Data Insights", "required_level": "Intermediate"},
        ],
    },
    {
        "career_id": "C003",
        "career_name": "Frontend Developer",
        "description": "Build responsive web applications using HTML, CSS, JavaScript, React and modern frontend frameworks.",
        "core_focus": "Web UI, React, CSS, JavaScript, frontend state",
        "required_skills": [
            {"skill_name": "HTML", "required_level": "Intermediate"},
            {"skill_name": "CSS", "required_level": "Intermediate"},
            {"skill_name": "JavaScript", "required_level": "Advanced"},
            {"skill_name": "React", "required_level": "Advanced"},
        ],
    },
    {
        "career_id": "C004",
        "career_name": "Cybersecurity Analyst",
        "description": "Monitor systems, analyze security events, identify vulnerabilities and implement security controls.",
        "core_focus": "Network security, vulnerability assessment, SIEM, incident response",
        "required_skills": [
            {"skill_name": "Network Security", "required_level": "Advanced"},
            {"skill_name": "Vulnerability Assessment", "required_level": "Advanced"},
            {"skill_name": "Security Controls", "required_level": "Intermediate"},
            {"skill_name": "Incident Response", "required_level": "Intermediate"},
        ],
    },
]

career_matches = career_matching.compute_career_matches(
    student_skills=student_skills_list,
    student_background_text=student_career_profile,
    careers=career_candidates,
)

print(f"{'Career':<28} | {'Semantic':<9} | {'Skill Match':<11} | {'Final Match':<11}")
print("-" * 70)
for cm in career_matches:
    matched_names = [s["skill_name"] for s in cm["matching_skills"]]
    missing_names = [s["skill_name"] for s in cm["missing_skills"]]
    print(f"{cm['career_name']:<28} | {cm['semantic_score']:<9.1f} | {cm['skill_match_score']:<11.1f} | {cm['match_percentage']:<11.1f}")
    print(f"  Matched Skills ({len(matched_names)}): {', '.join(matched_names) if matched_names else 'None'}")
    print(f"  Missing Skills ({len(missing_names)}): {', '.join(missing_names) if missing_names else 'None'}")
    print(f"  Reason: {cm['reason']}")
    print()


# ---------------------------------------------------------------------------
# Test 5: Course Recommendation Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 5: COURSE RECOMMENDATION TEST")
print("=" * 70)
course_gaps = [
    {"skill_name": "Deep Learning", "gap": 65, "priority": "High"},
    {"skill_name": "Statistics", "gap": 50, "priority": "High"},
    {"skill_name": "MLOps", "gap": 45, "priority": "Medium"},
    {"skill_name": "Docker", "gap": 40, "priority": "Medium"},
]

course_catalog = [
    {
        "course_id": "CRS01",
        "course_name": "Deep Learning with PyTorch",
        "description": "Learn neural networks, deep learning architectures, backpropagation and PyTorch.",
        "provider": "DeepLearning.AI",
        "rating": 4.9,
        "difficulty": "Intermediate",
        "duration_hours": 35,
        "category": "Artificial Intelligence",
        "skills": [{"skill_name": "Deep Learning"}],
    },
    {
        "course_id": "CRS02",
        "course_name": "Statistics for Data Science",
        "description": "Learn probability, descriptive statistics, hypothesis testing and statistical inference.",
        "provider": "Coursera",
        "rating": 4.8,
        "difficulty": "Intermediate",
        "duration_hours": 25,
        "category": "Data Science",
        "skills": [{"skill_name": "Statistics"}],
    },
    {
        "course_id": "CRS03",
        "course_name": "Docker Fundamentals",
        "description": "Learn containers, images, Dockerfiles and deployment.",
        "provider": "Linux Academy",
        "rating": 4.7,
        "difficulty": "Beginner",
        "duration_hours": 15,
        "category": "Cloud & DevOps",
        "skills": [{"skill_name": "Docker"}],
    },
    {
        "course_id": "CRS04",
        "course_name": "Advanced React Development",
        "description": "Learn React components, state management and frontend architecture.",
        "provider": "Frontend Masters",
        "rating": 4.8,
        "difficulty": "Advanced",
        "duration_hours": 20,
        "category": "Web Development",
        "skills": [{"skill_name": "React"}],
    },
]

course_recs = course_recommendation.rank_course_recommendations(
    skill_gaps=course_gaps,
    courses=course_catalog,
    top_k=4,
    career_name="Machine Learning Engineer",
)

print(f"{'Course':<32} | {'Score':<7} | {'Target Skill Gaps':<22} | {'Reason'}")
print("-" * 80)
for cr in course_recs:
    gaps_str = ", ".join(cr["missing_skills_addressed"]) if cr["missing_skills_addressed"] else "Broader alignment"
    print(f"{cr['course_name']:<32} | {cr['relevance_score']:<7.1f}% | {gaps_str:<22} | {cr['reason']}")
print()


# ---------------------------------------------------------------------------
# Test 6: Project Recommendation Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 6: PROJECT RECOMMENDATION TEST")
print("=" * 70)
project_gaps = [
    {"skill_name": "Deep Learning", "gap": 60, "priority": "High"},
    {"skill_name": "Computer Vision", "gap": 50, "priority": "High"},
    {"skill_name": "MLOps", "gap": 45, "priority": "Medium"},
]

project_catalog = [
    {
        "project_id": "P01",
        "project_name": "Image Classification System",
        "description": "Build a computer vision system using CNNs and image datasets.",
        "category": "Artificial Intelligence",
        "difficulty": "Intermediate",
        "estimated_duration_weeks": 4,
        "career_id": "C001",
        "skills": [{"skill_name": "Deep Learning"}, {"skill_name": "Computer Vision"}],
    },
    {
        "project_id": "P02",
        "project_name": "ML Model Deployment API",
        "description": "Deploy a machine learning model using FastAPI and Docker.",
        "category": "Machine Learning",
        "difficulty": "Intermediate",
        "estimated_duration_weeks": 3,
        "career_id": "C001",
        "skills": [{"skill_name": "MLOps"}, {"skill_name": "Docker"}],
    },
    {
        "project_id": "P03",
        "project_name": "Sales Dashboard",
        "description": "Create an interactive business dashboard using SQL and visualization.",
        "category": "Data Analytics",
        "difficulty": "Beginner",
        "estimated_duration_weeks": 2,
        "career_id": "C002",
        "skills": [{"skill_name": "SQL"}, {"skill_name": "Data Visualization"}],
    },
    {
        "project_id": "P04",
        "project_name": "React Portfolio",
        "description": "Build a frontend portfolio using React and CSS.",
        "category": "Web Development",
        "difficulty": "Beginner",
        "estimated_duration_weeks": 1,
        "career_id": "C003",
        "skills": [{"skill_name": "React"}, {"skill_name": "CSS"}],
    },
]

proj_recs = project_recommendation.rank_project_recommendations(
    skill_gaps=project_gaps,
    projects=project_catalog,
    target_career_id="C001",
    top_k=4,
    career_name="Machine Learning Engineer",
)

print(f"{'Project':<30} | {'Score':<7} | {'Addressed Gaps':<24} | {'Reason'}")
print("-" * 80)
for pr in proj_recs:
    addressed = ", ".join(pr["matched_missing_skills"]) if pr["matched_missing_skills"] else "General portfolio"
    print(f"{pr['project_name']:<30} | {pr['relevance_score']:<7.1f}% | {addressed:<24} | {pr['reason']}")
print()


# ---------------------------------------------------------------------------
# Test 7: Job Matching Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 7: JOB MATCHING TEST")
print("=" * 70)
job_student_skills = ["Python", "SQL", "Pandas", "Scikit-learn", "Random Forest", "Streamlit"]
job_student_bg = "Python, SQL, Pandas, Scikit-learn, Random Forest, machine learning projects, Streamlit."

job_catalog = [
    {
        "job_id": "J01",
        "job_title": "Junior Machine Learning Engineer",
        "company_name": "DataTech Labs",
        "description": "Python, machine learning, Scikit-learn, model evaluation, data preprocessing and deployment.",
        "required_skills": "Python, Machine Learning, Scikit-learn, Data Preprocessing",
    },
    {
        "job_id": "J02",
        "job_title": "Frontend Developer",
        "company_name": "WebCraft Solutions",
        "description": "React, JavaScript, TypeScript, CSS and frontend development.",
        "required_skills": "React, JavaScript, TypeScript, CSS",
    },
    {
        "job_id": "J03",
        "job_title": "Data Analyst",
        "company_name": "Insight Partners",
        "description": "SQL, Python, Pandas, Excel, dashboards and data analysis.",
        "required_skills": "SQL, Python, Pandas, Excel",
    },
    {
        "job_id": "J04",
        "job_title": "DevOps Engineer",
        "company_name": "CloudOps Systems",
        "description": "Docker, Kubernetes, Linux, CI/CD and cloud infrastructure.",
        "required_skills": "Docker, Kubernetes, Linux, CI/CD",
    },
]

job_matches = job_matching.compute_job_matches(
    student_skills=job_student_skills,
    student_background_text=job_student_bg,
    jobs=job_catalog,
)

print(f"{'Job Title':<32} | {'Semantic':<9} | {'Skill Match':<11} | {'Final Match':<11}")
print("-" * 75)
for jm in job_matches:
    matched = ", ".join(jm["matched_skills"]) if jm["matched_skills"] else "None"
    missing = ", ".join(jm["missing_skills"]) if jm["missing_skills"] else "None"
    print(f"{jm['job_title']:<32} | {jm['semantic_score']:<9.1f} | {jm['skill_match_score']:<11.1f} | {float(jm['match_score']):<11.1f}")
    print(f"  Matched: {matched}")
    print(f"  Missing: {missing}")
    print()


# ---------------------------------------------------------------------------
# Test 8: Resume -> Skill Semantic Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 8: RESUME -> SKILL SEMANTIC TEST")
print("=" * 70)
ecobite_resume = (
    "Developed ECOBITE, an AI-based supermarket inventory waste "
    "prediction and dynamic discount recommendation system using "
    "Python, Pandas, NumPy, Scikit-learn, Random Forest and Streamlit."
)
ecobite_candidate_skills = [
    "Python", "Pandas", "NumPy", "Machine Learning", "Random Forest",
    "Streamlit", "Deep Learning", "Kubernetes", "React"
]

ecobite_emb = embedding_service.generate_embedding(ecobite_resume)
print(f"Resume text snippet: '{ecobite_resume[:75]}...'")
print(f"{'Skill':<18} | {'Semantic Sim':<12} | {'Evidence Context'}")
print("-" * 65)
for s in ecobite_candidate_skills:
    s_emb = embedding_service.generate_embedding(s)
    sim = embedding_service.cosine_similarity(ecobite_emb, s_emb)
    # Notice: Semantic evidence of exposure does NOT mean mastery
    status = "Strong textual evidence" if sim >= 0.65 else ("Moderate topical affinity" if sim >= 0.50 else "Low/Unrelated")
    print(f"{s:<18} | {sim:<12.4f} | {status} (Similarity {sim*100:.1f}%)")
print("\n[PathForge Note]: High semantic exposure reflects candidate evidence; it does NOT assign automatic 'Advanced' mastery.\n")


# ---------------------------------------------------------------------------
# Test 9: Semantic Search Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 9: SEMANTIC SEARCH TEST")
print("=" * 70)
search_query = "I want to learn how to deploy machine learning models."
search_corpus = [
    {"type": "Course", "id": "C_MLOPS", "text": "Production MLOps and Model Deployment with FastAPI and Docker"},
    {"type": "Course", "id": "C_REACT", "text": "Modern Frontend Web Development with React and Redux"},
    {"type": "Project", "id": "P_DEPLOY", "text": "End-to-End ML Pipeline Deployment with Docker containerization"},
    {"type": "Project", "id": "P_DASH", "text": "Interactive Business Intelligence Sales Dashboard in Tableau"},
    {"type": "Skill", "id": "S_MLOPS", "text": "MLOps and automated machine learning model continuous deployment"},
    {"type": "Skill", "id": "S_CSS", "text": "CSS responsive typography and Flexbox layouts"},
    {"type": "Job", "id": "J_MLE", "text": "Machine Learning Engineer responsible for production model serving and APIs"},
    {"type": "Job", "id": "J_FED", "text": "Frontend Web Developer building reusable UI component libraries"},
]

search_results = embedding_service.semantic_search(
    query=search_query,
    corpus=search_corpus,
    text_key="text",
    top_k=5,
)

print(f"Search Query: '{search_query}'\n")
print(f"{'Rank':<5} | {'Type':<8} | {'ID':<10} | {'Score':<8} | {'Item Description'}")
print("-" * 80)
for idx, res in enumerate(search_results, start=1):
    print(f"#{idx:<4} | {res['type']:<8} | {res['id']:<10} | {res['similarity_score']:<8.4f} | {res['text']}")
print()


# ---------------------------------------------------------------------------
# Test 10: Batch Embedding Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 10: BATCH EMBEDDING TEST")
print("=" * 70)
batch_input = [
    "Python programming",
    "Machine learning",
    "Deep learning",
    "SQL database",
    "React frontend development",
    "Docker containerization"
]

batch_embs = embedding_service.generate_embeddings(batch_input)
all_dim_384 = all(emb.shape == (384,) for emb in batch_embs)
all_finite = np.all(np.isfinite(batch_embs))
shape_match = len(batch_input) == len(batch_embs)

print(f"Input batch size:             {len(batch_input)}")
print(f"Output embeddings count:      {len(batch_embs)}")
print(f"Shape match:                  {shape_match}")
print(f"Every embedding dim == 384:   {all_dim_384}")
print(f"All values finite (no NaN):   {all_finite}")
print()


# ---------------------------------------------------------------------------
# Test 11: Duplicate / Consistency Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 11: DUPLICATE / CONSISTENCY TEST")
print("=" * 70)
dup_text = "Python machine learning engineer"
# Bypass cache for verification by encoding directly via model
emb_run_1 = embedding_service.model.encode(dup_text, normalize_embeddings=True)
emb_run_2 = embedding_service.model.encode(dup_text, normalize_embeddings=True)

max_abs_diff = float(np.max(np.abs(emb_run_1 - emb_run_2)))
dup_cos_sim = float(embedding_service.cosine_similarity(emb_run_1, emb_run_2))

print(f"Input text:                   '{dup_text}'")
print(f"Maximum absolute difference:  {max_abs_diff:.10f}")
print(f"Cosine similarity:            {dup_cos_sim:.10f}")
print(f"Deterministic consistency:    {max_abs_diff == 0.0 or max_abs_diff < 1e-6}")
print()


# ---------------------------------------------------------------------------
# Test 12: Cross-Domain Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 12: CROSS-DOMAIN TEST")
print("=" * 70)
anchor_text = "Machine learning model using Python and Scikit-learn"
candidates = {
    "A (Deep learning)": "Deep learning neural network training",
    "B (Frontend web)": "React frontend web development",
    "C (Music theory)": "Indian classical music theory",
    "D (ML deployment)": "Machine learning model deployment",
}

print(f"Anchor: '{anchor_text}'\n")
print(f"{'Option':<20} | {'Similarity':<12} | {'Domain Assessment'}")
print("-" * 65)
for label, cand_text in candidates.items():
    sim = embedding_service.semantic_similarity(anchor_text, cand_text)
    print(f"{label:<20} | {sim:<12.4f} | '{cand_text}'")
print()


# ---------------------------------------------------------------------------
# Test 13: Empty / Invalid Input Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 13: EMPTY / INVALID INPUT TEST")
print("=" * 70)
test_cases = [
    ("", "Empty string"),
    (None, "None type"),
    ("   ", "Whitespace-only string"),
    ("Python", "Very short single word"),
]

for val, desc in test_cases:
    try:
        res = embedding_service.generate_embedding(val)
        norm = float(np.linalg.norm(res))
        is_all_zeros = bool(np.all(res == 0.0))
        print(f"Test case: {desc:<25} | Shape: {res.shape} | All zeros: {is_all_zeros:<5} | Handled safely: True")
    except Exception as e:
        print(f"Test case: {desc:<25} | Crashed with exception: {e}")
print()


# ---------------------------------------------------------------------------
# Test 14: Long Input Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 14: LONG INPUT TEST")
print("=" * 70)
long_text = (
    "Senior Artificial Intelligence and Machine Learning Engineer with extensive experience in "
    "Python, SQL, Machine Learning, Deep Learning, Pandas, NumPy, Scikit-learn, TensorFlow, Docker, "
    "FastAPI, Streamlit, and React. Architected end-to-end predictive modeling pipelines, trained deep "
    "convolutional and transformer networks, containerized inference microservices using Docker, and "
    "deployed high-throughput APIs serving millions of requests. Spearheaded statistical data analysis "
    "using Pandas and NumPy, integrated relational SQL databases for high-speed feature retrieval, and "
    "built interactive real-time monitoring dashboards in Streamlit and React with state-of-the-art UI/UX. "
    "Demonstrated mastery across full-stack machine learning lifecycle from data extraction to production MLOps."
)

t0 = time.perf_counter()
long_emb = embedding_service.generate_embedding(long_text)
t_long = (time.perf_counter() - t0) * 1000

print(f"Input text length (characters): {len(long_text)}")
print(f"Input text length (words):      {len(long_text.split())}")
print(f"Embedding dimension:            {len(long_emb)}")
print(f"Execution time:                 {t_long:.2f} ms")
print(f"Finite values:                  {bool(np.all(np.isfinite(long_emb)))}")
print()


# ---------------------------------------------------------------------------
# Test 15: Performance Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 15: PERFORMANCE TEST")
print("=" * 70)
sample_phrases = [
    f"Software engineering skill topic number {i} involving machine learning, web systems, and data pipelines"
    for i in range(50)
]

# 1 embedding
t0 = time.perf_counter()
embedding_service.generate_embedding(sample_phrases[0])
t_1 = time.perf_counter() - t0

# 10 embeddings (uncached via direct batch encode)
t0 = time.perf_counter()
embedding_service.model.encode(sample_phrases[:10], batch_size=16, normalize_embeddings=True)
t_10 = time.perf_counter() - t0

# 50 embeddings (uncached via direct batch encode)
t0 = time.perf_counter()
embedding_service.model.encode(sample_phrases, batch_size=32, normalize_embeddings=True)
t_50 = time.perf_counter() - t0

print(f"{'Count':<8} | {'Total Time (ms)':<18} | {'Avg Time per Item (ms)':<22}")
print("-" * 55)
print(f"{1:<8} | {t_1*1000:<18.2f} | {t_1*1000:<22.2f}")
print(f"{10:<8} | {t_10*1000:<18.2f} | {(t_10/10)*1000:<22.2f}")
print(f"{50:<8} | {t_50*1000:<18.2f} | {(t_50/50)*1000:<22.2f}")
print()


# ---------------------------------------------------------------------------
# Test 17: PathForge Evidence Model Test
# ---------------------------------------------------------------------------
print("=" * 70)
print("TEST 17: PATHFORGE EVIDENCE MODEL TEST")
print("=" * 70)
# Skill: Machine Learning
# Self-declared: 90
# Resume evidence: 80
# Assessment: 52
# Project: 70
# Certificate: 60
# Mentor: No evidence (0 / missing)

evidence_res = skill_matching.calculate_final_mastery(
    self_declared_score=90,
    resume_score=80,
    assessment_score=52,
    project_score=70,
    certificate_score=60,
    mentor_score=0,
)

print("Evidence Mastery Calculation:")
print(f"  Target Skill:               Machine Learning")
print(f"  Self-declared Score:        90 (Weight: {model_config.WEIGHT_SELF_DECLARED*100:.0f}%)")
print(f"  Resume Evidence Score:      80 (Weight: {model_config.WEIGHT_RESUME*100:.0f}%)")
print(f"  Assessment Score:           52 (Weight: {model_config.WEIGHT_ASSESSMENT*100:.0f}%)")
print(f"  Project Score:              70 (Weight: {model_config.WEIGHT_PROJECT*100:.0f}%)")
print(f"  Certificate Score:          60 (Weight: {model_config.WEIGHT_CERTIFICATE*100:.0f}%)")
print(f"  Mentor Score:               None / No evidence (Dynamically excluded from denominator)")
print(f"  Calculated Final Mastery:   {evidence_res['final_mastery']} / 100")
print(f"  Calibrated Skill Level:     {evidence_res['mastery_level']}")
print(f"  Evidence Sources Count:     {evidence_res['evidence_count']}")
print(f"  Normalized Active Weights:  {evidence_res['active_weights']}")
print(f"  Raw Evidence Inputs:        {evidence_res['raw_scores']}")
print()
print("=" * 70)
print("VALIDATION SUITE COMPLETE")
print("=" * 70)
