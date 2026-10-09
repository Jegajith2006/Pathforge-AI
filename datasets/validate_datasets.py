#!/usr/bin/env python3
"""
================================================================================
PATHFORGE AI — COMPREHENSIVE DATASET VALIDATION SUITE
================================================================================
Validates relational consistency, foreign keys, constraints, cycles, ranges,
and data integrity across all 23 production CSV datasets.
================================================================================
"""

import os
import sys
import pandas as pd
import numpy as np
from collections import defaultdict, deque

DATASETS_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = {
    "careers": "01_careers.csv",
    "skills": "02_skills.csv",
    "career_skills": "03_career_skills.csv",
    "skill_prerequisites": "04_skill_prerequisites.csv",
    "courses": "05_courses.csv",
    "course_skills": "06_course_skills.csv",
    "projects": "07_projects.csv",
    "project_skills": "08_project_skills.csv",
    "assessment_questions": "09_assessment_questions.csv",
    "assessment_answers": "10_assessment_answers.csv",
    "student_profiles": "11_student_profiles.csv",
    "student_skills": "12_student_skills.csv",
    "resume_analysis": "13_resume_analysis.csv",
    "companies": "14_companies.csv",
    "company_skills": "15_company_skills.csv",
    "company_jobs": "16_company_jobs.csv",
    "mentor_profiles": "17_mentor_profiles.csv",
    "mentor_feedback": "18_mentor_feedback.csv",
    "learning_activity": "19_learning_activity.csv",
    "certificates": "20_certificates.csv",
    "job_applications": "21_job_applications.csv",
    "feedback": "22_feedback.csv",
    "notifications": "23_notifications.csv"
}

CANONICAL_FILES = {
    "careers": "careers.csv",
    "skills": "skills.csv",
    "career_skills": "career_skills.csv",
    "skill_prerequisites": "skill_prerequisites.csv",
    "courses": "courses.csv",
    "course_skills": "course_skills.csv",
    "projects": "projects.csv",
    "project_skills": "project_skills.csv",
    "assessment_questions": "assessment_questions.csv",
    "assessment_answers": "assessment_answers.csv",
    "student_profiles": "student_profiles.csv",
    "student_skills": "student_skills.csv",
    "resume_analysis": "resume_analysis.csv",
    "companies": "companies.csv",
    "company_skills": "company_skills.csv",
    "company_jobs": "company_jobs.csv",
    "mentor_profiles": "mentor_profiles.csv",
    "mentor_feedback": "mentor_feedback.csv",
    "learning_activity": "learning_activity.csv",
    "certificates": "certificates.csv",
    "job_applications": "job_applications.csv",
    "feedback": "feedback.csv",
    "notifications": "notifications.csv"
}

class DatasetValidator:
    def __init__(self, datasets_dir):
        self.datasets_dir = datasets_dir
        self.dfs = {}
        self.errors = defaultdict(list)
        self.warnings = defaultdict(list)
        self.passed_suites = []
        self.failed_suites = []

    def load_all(self):
        print(f"Loading datasets from: {self.datasets_dir}")
        for key, fname in CANONICAL_FILES.items():
            path = os.path.join(self.datasets_dir, fname)
            pref_path = os.path.join(self.datasets_dir, FILES[key])
            
            # Prefer canonical, fallback to prefixed
            target_path = path if os.path.exists(path) else pref_path
            if not os.path.exists(target_path):
                self.errors["File Missing"].append(f"Required dataset {fname} (or {FILES[key]}) not found!")
            else:
                self.dfs[key] = pd.read_csv(target_path)
                
            # Check dual availability
            if not os.path.exists(path):
                self.warnings["Missing Canonical Name"].append(f"Expected canonical {fname}")
            if not os.path.exists(pref_path):
                self.warnings["Missing Prefixed Name"].append(f"Expected prefixed {FILES[key]}")

        print(f"Successfully loaded {len(self.dfs)} of {len(CANONICAL_FILES)} datasets.\n")

    def run_check(self, suite_name, check_fn):
        try:
            err_count_before = sum(len(v) for v in self.errors.values())
            check_fn()
            err_count_after = sum(len(v) for v in self.errors.values())
            if err_count_after == err_count_before:
                self.passed_suites.append(suite_name)
                print(f"  [PASS] {suite_name}")
            else:
                self.failed_suites.append(suite_name)
                print(f"  [FAIL] {suite_name}")
        except Exception as e:
            self.errors[suite_name].append(f"Unexpected exception during check: {str(e)}")
            self.failed_suites.append(suite_name)
            print(f"  [FAIL] {suite_name} (Exception: {e})")

    # --------------------------------------------------------------------------
    # 1 & 2: Primary Keys (Uniqueness & Non-null)
    # --------------------------------------------------------------------------
    def check_primary_keys(self):
        pk_definitions = {
            "careers": "career_id",
            "skills": "skill_id",
            "skill_prerequisites": "prerequisite_id",
            "courses": "course_id",
            "projects": "project_id",
            "assessment_questions": "question_id",
            "assessment_answers": "attempt_id",
            "student_profiles": "student_id",
            "resume_analysis": "resume_id",
            "companies": "company_id",
            "company_jobs": "job_id",
            "mentor_profiles": "mentor_id",
            "mentor_feedback": "feedback_id",
            "learning_activity": "activity_id",
            "certificates": "certificate_id",
            "job_applications": "application_id",
            "feedback": "feedback_id",
            "notifications": "notification_id"
        }
        for name, pk in pk_definitions.items():
            if name in self.dfs:
                df = self.dfs[name]
                if pk not in df.columns:
                    self.errors["Missing Primary Key Column"].append(f"{name}: missing {pk}")
                    continue
                if df[pk].isnull().any():
                    self.errors["Null Primary Key"].append(f"{name}: column {pk} contains {df[pk].isnull().sum()} null values")
                duplicates = df[pk].duplicated().sum()
                if duplicates > 0:
                    self.errors["Duplicate Primary Key"].append(f"{name}: column {pk} contains {duplicates} duplicate IDs")

        # Composite PKs
        composite_pks = {
            "career_skills": ["career_id", "skill_id"],
            "course_skills": ["course_id", "skill_id"],
            "project_skills": ["project_id", "skill_id"],
            "student_skills": ["student_id", "skill_id"],
            "company_skills": ["company_id", "career_id", "skill_id"]
        }
        for name, cols in composite_pks.items():
            if name in self.dfs:
                df = self.dfs[name]
                dups = df.duplicated(subset=cols).sum()
                if dups > 0:
                    self.errors["Duplicate Composite Key"].append(f"{name}: composite key {cols} has {dups} duplicates")

    # --------------------------------------------------------------------------
    # 3-12: Foreign Key Integrity
    # --------------------------------------------------------------------------
    def check_foreign_keys(self):
        career_ids = set(self.dfs["careers"]["career_id"])
        skill_ids = set(self.dfs["skills"]["skill_id"])
        course_ids = set(self.dfs["courses"]["course_id"])
        project_ids = set(self.dfs["projects"]["project_id"])
        student_ids = set(self.dfs["student_profiles"]["student_id"])
        company_ids = set(self.dfs["companies"]["company_id"])
        job_ids = set(self.dfs["company_jobs"]["job_id"])
        mentor_ids = set(self.dfs["mentor_profiles"]["mentor_id"])
        question_ids = set(self.dfs["assessment_questions"]["question_id"])

        fk_rules = [
            ("career_skills", "career_id", career_ids, "careers"),
            ("career_skills", "skill_id", skill_ids, "skills"),
            ("skill_prerequisites", "prerequisite_skill_id", skill_ids, "skills"),
            ("skill_prerequisites", "dependent_skill_id", skill_ids, "skills"),
            ("course_skills", "course_id", course_ids, "courses"),
            ("course_skills", "skill_id", skill_ids, "skills"),
            ("projects", "career_id", career_ids, "careers"),
            ("project_skills", "project_id", project_ids, "projects"),
            ("project_skills", "skill_id", skill_ids, "skills"),
            ("assessment_questions", "career_id", career_ids, "careers"),
            ("assessment_questions", "skill_id", skill_ids, "skills"),
            ("assessment_answers", "student_id", student_ids, "students"),
            ("assessment_answers", "question_id", question_ids, "questions"),
            ("student_profiles", "target_career_id", career_ids, "careers"),
            ("student_skills", "student_id", student_ids, "students"),
            ("student_skills", "skill_id", skill_ids, "skills"),
            ("resume_analysis", "student_id", student_ids, "students"),
            ("resume_analysis", "skill_id", skill_ids, "skills"),
            ("company_skills", "company_id", company_ids, "companies"),
            ("company_skills", "career_id", career_ids, "careers"),
            ("company_skills", "skill_id", skill_ids, "skills"),
            ("company_jobs", "company_id", company_ids, "companies"),
            ("company_jobs", "career_id", career_ids, "careers"),
            ("mentor_feedback", "mentor_id", mentor_ids, "mentors"),
            ("mentor_feedback", "student_id", student_ids, "students"),
            ("mentor_feedback", "project_id", project_ids, "projects"),
            ("mentor_feedback", "skill_id", skill_ids, "skills"),
            ("learning_activity", "student_id", student_ids, "students"),
            ("certificates", "student_id", student_ids, "students"),
            ("certificates", "skill_id", skill_ids, "skills"),
            ("job_applications", "student_id", student_ids, "students"),
            ("job_applications", "job_id", job_ids, "jobs"),
            ("feedback", "student_id", student_ids, "students"),
            ("notifications", "student_id", student_ids, "students")
        ]

        for src_table, src_col, valid_set, target_name in fk_rules:
            if src_table in self.dfs and src_col in self.dfs[src_table].columns:
                actual = set(self.dfs[src_table][src_col].dropna())
                diff = actual - valid_set
                if diff:
                    sample = list(diff)[:3]
                    self.errors["Broken Foreign Key"].append(
                        f"{src_table}.{src_col} references non-existent {target_name} ID(s): {sample} (total invalid: {len(diff)})"
                    )

    # --------------------------------------------------------------------------
    # 13 & 14: Numeric Ranges and Rating Bounds
    # --------------------------------------------------------------------------
    def check_numeric_ranges(self):
        # 1. Career skill weights: 0.001 to 1.00
        cs = self.dfs["career_skills"]
        if (cs["weight"] <= 0).any() or (cs["weight"] > 1.0).any():
            self.errors["Invalid Range"].append("career_skills.weight contains values outside (0.0, 1.0]")

        # 2. Mentor ratings: 1.0 to 5.0
        mr = self.dfs["mentor_profiles"]
        if (mr["rating"] < 1.0).any() or (mr["rating"] > 5.0).any():
            self.errors["Invalid Rating"].append("mentor_profiles.rating outside [1.0, 5.0]")

        # 3. Mentor feedback rating: 1 to 5
        mf = self.dfs["mentor_feedback"]
        if (mf["rating"] < 1).any() or (mf["rating"] > 5).any():
            self.errors["Invalid Rating"].append("mentor_feedback.rating outside [1, 5]")

        # 4. Student skills scores: 0 to 100
        ss = self.dfs["student_skills"]
        score_cols = ["self_declared_score", "resume_score", "assessment_score", "project_score", "certificate_score", "mentor_score", "final_mastery"]
        for col in score_cols:
            if (ss[col] < 0).any() or (ss[col] > 100).any():
                self.errors["Invalid Range"].append(f"student_skills.{col} contains values outside [0, 100]")

        # 5. Course rating: 1.0 to 5.0
        courses = self.dfs["courses"]
        if (courses["rating"] < 1.0).any() or (courses["rating"] > 5.0).any():
            self.errors["Invalid Rating"].append("courses.rating outside [1.0, 5.0]")

        # 6. Student CGPA: 0.0 to 10.0
        students = self.dfs["student_profiles"]
        if (students["cgpa"] < 0.0).any() or (students["cgpa"] > 10.0).any():
            self.errors["Invalid Range"].append("student_profiles.cgpa outside [0.0, 10.0]")

        # 7. Resume analysis confidence: 0.0 to 1.0
        res = self.dfs["resume_analysis"]
        if (res["confidence"] < 0.0).any() or (res["confidence"] > 1.0).any():
            self.errors["Invalid Range"].append("resume_analysis.confidence outside [0.0, 1.0]")

        # 8. Learning activity durations: > 0
        act = self.dfs["learning_activity"]
        if (act["duration_minutes"] <= 0).any():
            self.errors["Invalid Range"].append("learning_activity.duration_minutes contains non-positive values")

        # 9. Job application matches: 0 to 100
        apps = self.dfs["job_applications"]
        for col in ["resume_match", "skill_match", "project_match", "application_readiness"]:
            if (apps[col] < 0).any() or (apps[col] > 100).any():
                self.errors["Invalid Range"].append(f"job_applications.{col} outside [0, 100]")

    # --------------------------------------------------------------------------
    # 15: Mastery Levels Enum
    # --------------------------------------------------------------------------
    def check_mastery_levels(self):
        valid_masteries = {"Missing", "Beginner", "Developing", "Proficient", "Strong"}
        actual = set(self.dfs["student_skills"]["mastery_level"].unique())
        invalid = actual - valid_masteries
        if invalid:
            self.errors["Invalid Mastery Level"].append(f"student_skills has invalid mastery levels: {invalid}")

    # --------------------------------------------------------------------------
    # 16: Difficulty Enums
    # --------------------------------------------------------------------------
    def check_difficulty_enums(self):
        valid_diff = {"Beginner", "Intermediate", "Advanced", "Adaptive"}
        checks = [
            ("careers", "difficulty"),
            ("courses", "difficulty"),
            ("projects", "difficulty"),
            ("assessment_questions", "difficulty")
        ]
        for tbl, col in checks:
            actual = set(self.dfs[tbl][col].unique())
            invalid = actual - valid_diff
            if invalid:
                self.errors["Invalid Difficulty"].append(f"{tbl}.{col} has invalid difficulty: {invalid}")

    # --------------------------------------------------------------------------
    # 17: Skill Prerequisites Cycle Detection (DAG Check)
    # --------------------------------------------------------------------------
    def check_prerequisites_dag(self):
        prereqs = self.dfs["skill_prerequisites"]
        graph = defaultdict(list)
        in_degree = defaultdict(int)
        all_nodes = set()

        for _, row in prereqs.iterrows():
            u = row["prerequisite_skill_id"]
            v = row["dependent_skill_id"]
            if u == v:
                self.errors["Self-Prerequisite Loop"].append(f"Skill {u} is a prerequisite of itself!")
            graph[u].append(v)
            in_degree[v] += 1
            all_nodes.add(u)
            all_nodes.add(v)

        for node in all_nodes:
            if node not in in_degree:
                in_degree[node] = 0

        # Kahn's algorithm for topological sorting
        queue = deque([node for node in all_nodes if in_degree[node] == 0])
        visited_count = 0

        while queue:
            node = queue.popleft()
            visited_count += 1
            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited_count < len(all_nodes):
            cycle_nodes = [node for node in all_nodes if in_degree[node] > 0]
            self.errors["Circular Skill Prerequisites"].append(
                f"Prerequisites graph contains a cycle! Unresolved nodes: {cycle_nodes[:5]}"
            )

    # --------------------------------------------------------------------------
    # 18: Career Skill Weights Sum Check
    # --------------------------------------------------------------------------
    def check_career_weights_sum(self):
        cs = self.dfs["career_skills"]
        sums = cs.groupby("career_id")["weight"].sum()
        for cid, total in sums.items():
            if not (0.95 <= total <= 1.05):
                self.errors["Career Weights Sum"].append(
                    f"Career {cid} skill weights sum to {total:.4f}, expected ~1.000"
                )

    # --------------------------------------------------------------------------
    # 19: Non-empty Required Fields
    # --------------------------------------------------------------------------
    def check_non_empty_fields(self):
        mandatory = {
            "careers": ["career_id", "career_name", "category", "difficulty"],
            "skills": ["skill_id", "skill_name", "category"],
            "courses": ["course_id", "course_name", "provider"],
            "projects": ["project_id", "project_name", "career_id"],
            "assessment_questions": ["question_id", "question", "correct_answer"],
            "student_profiles": ["student_id", "first_name", "last_name", "email"],
            "companies": ["company_id", "company_name", "industry"],
            "company_jobs": ["job_id", "company_id", "job_title"]
        }
        for tbl, cols in mandatory.items():
            if tbl in self.dfs:
                for col in cols:
                    if col in self.dfs[tbl].columns:
                        nulls = self.dfs[tbl][col].isnull().sum()
                        if nulls > 0:
                            self.errors["Empty Mandatory Field"].append(f"{tbl}.{col} has {nulls} missing values")

    # --------------------------------------------------------------------------
    # 20: Assessment Questions Correct Answer Validity & Non-duplicate
    # --------------------------------------------------------------------------
    def check_assessment_questions(self):
        q_df = self.dfs["assessment_questions"]
        
        # 1. Uniqueness
        dups = q_df.duplicated(subset=["question"]).sum()
        if dups > 0:
            self.errors["Duplicate Assessment Question"].append(f"Found {dups} duplicate question texts")

        # 2. Correct answer matches one of option_a, b, c, d
        for idx, row in q_df.iterrows():
            opts = [row["option_a"], row["option_b"], row["option_c"], row["option_d"]]
            if row["correct_answer"] not in opts:
                self.errors["Invalid Correct Answer"].append(
                    f"Question {row['question_id']}: correct_answer '{row['correct_answer']}' not found in options {opts}"
                )
                if len(self.errors["Invalid Correct Answer"]) >= 5:
                    break

    def run_all(self):
        print("=" * 60)
        print("PATHFORGE AI — RUNNING COMPLETE DATASET VALIDATION SUITE")
        print("=" * 60)

        self.load_all()

        suites = [
            ("Primary Key & ID Uniqueness", self.check_primary_keys),
            ("Foreign Key & Relational Consistency", self.check_foreign_keys),
            ("Numeric Ranges & Rating Constraints", self.check_numeric_ranges),
            ("Mastery Level Categorical Integrity", self.check_mastery_levels),
            ("Difficulty Values & Classification", self.check_difficulty_enums),
            ("Prerequisites Directed Acyclic Graph (DAG)", self.check_prerequisites_dag),
            ("Career Skill Weights Normalization", self.check_career_weights_sum),
            ("Mandatory Attributes Non-Null Integrity", self.check_non_empty_fields),
            ("Assessment Questions & Answer Options Validation", self.check_assessment_questions)
        ]

        for name, fn in suites:
            self.run_check(name, fn)

        print("\n" + "=" * 60)
        print("DATASET RECORD COUNTS SUMMARY")
        print("=" * 60)
        for key, df in self.dfs.items():
            print(f"  {FILES[key]:<30}: {len(df):>6} records")

        print("\n" + "=" * 60)
        print("PATHFORGE DATASET VALIDATION REPORT")
        print("=" * 60)

        per_entity_status = [
            ("Careers (01_careers.csv)", "PASS"),
            ("Skills (02_skills.csv)", "PASS"),
            ("Career Skills (03_career_skills.csv)", "PASS"),
            ("Prerequisites (04_skill_prerequisites.csv)", "PASS"),
            ("Courses (05_courses.csv)", "PASS"),
            ("Course Skills (06_course_skills.csv)", "PASS"),
            ("Projects (07_projects.csv)", "PASS"),
            ("Project Skills (08_project_skills.csv)", "PASS"),
            ("Assessment Questions (09_assessment_questions.csv)", "PASS"),
            ("Assessment Answers (10_assessment_answers.csv)", "PASS"),
            ("Students (11_student_profiles.csv)", "PASS"),
            ("Student Skills (12_student_skills.csv)", "PASS"),
            ("Resume Analysis (13_resume_analysis.csv)", "PASS"),
            ("Companies (14_companies.csv)", "PASS"),
            ("Company Skills (15_company_skills.csv)", "PASS"),
            ("Jobs (16_company_jobs.csv)", "PASS"),
            ("Mentors (17_mentor_profiles.csv)", "PASS"),
            ("Mentor Feedback (18_mentor_feedback.csv)", "PASS"),
            ("Learning Activity (19_learning_activity.csv)", "PASS"),
            ("Certificates (20_certificates.csv)", "PASS"),
            ("Job Applications (21_job_applications.csv)", "PASS"),
            ("Feedback (22_feedback.csv)", "PASS"),
            ("Notifications (23_notifications.csv)", "PASS")
        ]

        total_errors = sum(len(err_list) for err_list in self.errors.values())

        if total_errors == 0:
            for entity, status in per_entity_status:
                print(f"{entity}:\n{status}\n")
            print("=" * 60)
            print("ALL DATASETS VALID — 100% PRODUCTION READY")
            print("=" * 60)
            return True
        else:
            print(f"FAILED with {total_errors} error(s):")
            for cat, errs in self.errors.items():
                print(f"\n[Category: {cat}] ({len(errs)} issues)")
                for e in errs[:10]:
                    print(f"  - {e}")
                if len(errs) > 10:
                    print(f"  ... and {len(errs)-10} more")
            print("\n" + "=" * 60)
            print("VALIDATION FAILED — PLEASE RESOLVE DETECTED ISSUES")
            print("=" * 60)
            return False

def main():
    validator = DatasetValidator(DATASETS_DIR)
    success = validator.run_all()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
