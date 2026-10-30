import os
import pandas as pd
import numpy as np

d = 'datasets'

PREFIX_MAP = {
    'careers.csv': '01_careers.csv',
    'skills.csv': '02_skills.csv',
    'career_skills.csv': '03_career_skills.csv',
    'skill_prerequisites.csv': '04_skill_prerequisites.csv',
    'courses.csv': '05_courses.csv',
    'course_skills.csv': '06_course_skills.csv',
    'projects.csv': '07_projects.csv',
    'project_skills.csv': '08_project_skills.csv',
    'assessment_questions.csv': '09_assessment_questions.csv',
    'assessment_answers.csv': '10_assessment_answers.csv',
    'student_profiles.csv': '11_student_profiles.csv',
    'student_skills.csv': '12_student_skills.csv',
    'resume_analysis.csv': '13_resume_analysis.csv',
    'companies.csv': '14_companies.csv',
    'company_skills.csv': '15_company_skills.csv',
    'company_jobs.csv': '16_company_jobs.csv',
    'mentor_profiles.csv': '17_mentor_profiles.csv',
    'mentor_feedback.csv': '18_mentor_feedback.csv',
    'learning_activity.csv': '19_learning_activity.csv',
    'certificates.csv': '20_certificates.csv',
    'job_applications.csv': '21_job_applications.csv',
    'feedback.csv': '22_feedback.csv',
    'notifications.csv': '23_notifications.csv',
}

def resolve_path(fname):
    num = PREFIX_MAP.get(fname, fname)
    p = os.path.join(d, num)
    if os.path.exists(p):
        return p
    return os.path.join(d, fname)


print('=' * 70)
print('CHECK 1: ID UNIQUENESS (Primary & Composite Keys)')
print('=' * 70)
pks = [
    ('careers.csv', 'career_id'),
    ('skills.csv', 'skill_id'),
    ('skill_prerequisites.csv', 'prerequisite_id'),
    ('courses.csv', 'course_id'),
    ('projects.csv', 'project_id'),
    ('assessment_questions.csv', 'question_id'),
    ('assessment_answers.csv', 'attempt_id'),
    ('student_profiles.csv', 'student_id'),
    ('resume_analysis.csv', 'resume_id'),
    ('companies.csv', 'company_id'),
    ('company_jobs.csv', 'job_id'),
    ('mentor_profiles.csv', 'mentor_id'),
    ('mentor_feedback.csv', 'feedback_id'),
    ('learning_activity.csv', 'activity_id'),
    ('certificates.csv', 'certificate_id'),
    ('job_applications.csv', 'application_id'),
    ('feedback.csv', 'feedback_id'),
    ('notifications.csv', 'notification_id'),
    ('career_skills.csv', ['career_id', 'skill_id']),
    ('course_skills.csv', ['course_id', 'skill_id']),
    ('project_skills.csv', ['project_id', 'skill_id']),
    ('student_skills.csv', ['student_id', 'skill_id']),
    ('company_skills.csv', ['company_id', 'career_id', 'skill_id']),
]

all_pks_ok = True
for f, pk in pks:
    df = pd.read_csv(resolve_path(f))
    if isinstance(pk, list):
        dups = df.duplicated(subset=pk).sum()
        col_str = '+'.join(pk)
        nulls = df[pk].isnull().any(axis=1).sum()
    else:
        dups = df.duplicated(subset=[pk]).sum()
        col_str = pk
        nulls = df[pk].isnull().sum()
    status = 'PASS' if dups == 0 and nulls == 0 else 'FAIL'
    if status != 'PASS':
        all_pks_ok = False
    print(f"{f:<28} Key: {col_str:<32} Duplicates: {dups:<3} Nulls: {nulls:<3} [{status}]")

print(f"\n>>> CHECK 1 VERDICT: {'ALL UNIQUE (PASS)' if all_pks_ok else 'FAILED'}\n")

print('=' * 70)
print('CHECK 2: FOREIGN KEYS MATCH (Zero Orphan References)')
print('=' * 70)
careers = set(pd.read_csv(resolve_path('careers.csv'))['career_id'])
skills = set(pd.read_csv(resolve_path('skills.csv'))['skill_id'])
courses = set(pd.read_csv(resolve_path('courses.csv'))['course_id'])
projects = set(pd.read_csv(resolve_path('projects.csv'))['project_id'])
students = set(pd.read_csv(resolve_path('student_profiles.csv'))['student_id'])
companies = set(pd.read_csv(resolve_path('companies.csv'))['company_id'])
jobs = set(pd.read_csv(resolve_path('company_jobs.csv'))['job_id'])
mentors = set(pd.read_csv(resolve_path('mentor_profiles.csv'))['mentor_id'])
questions = set(pd.read_csv(resolve_path('assessment_questions.csv'))['question_id'])

fks = [
    ('career_skills.csv', 'career_id', careers, 'careers.career_id'),
    ('career_skills.csv', 'skill_id', skills, 'skills.skill_id'),
    ('skill_prerequisites.csv', 'prerequisite_skill_id', skills, 'skills.skill_id'),
    ('skill_prerequisites.csv', 'dependent_skill_id', skills, 'skills.skill_id'),
    ('course_skills.csv', 'course_id', courses, 'courses.course_id'),
    ('course_skills.csv', 'skill_id', skills, 'skills.skill_id'),
    ('projects.csv', 'career_id', careers, 'careers.career_id'),
    ('project_skills.csv', 'project_id', projects, 'projects.project_id'),
    ('project_skills.csv', 'skill_id', skills, 'skills.skill_id'),
    ('assessment_questions.csv', 'career_id', careers, 'careers.career_id'),
    ('assessment_questions.csv', 'skill_id', skills, 'skills.skill_id'),
    ('assessment_answers.csv', 'student_id', students, 'student_profiles.student_id'),
    ('assessment_answers.csv', 'question_id', questions, 'assessment_questions.question_id'),
    ('student_profiles.csv', 'target_career_id', careers, 'careers.career_id'),
    ('student_skills.csv', 'student_id', students, 'student_profiles.student_id'),
    ('student_skills.csv', 'skill_id', skills, 'skills.skill_id'),
    ('resume_analysis.csv', 'student_id', students, 'student_profiles.student_id'),
    ('resume_analysis.csv', 'skill_id', skills, 'skills.skill_id'),
    ('company_skills.csv', 'company_id', companies, 'companies.company_id'),
    ('company_skills.csv', 'career_id', careers, 'careers.career_id'),
    ('company_skills.csv', 'skill_id', skills, 'skills.skill_id'),
    ('company_jobs.csv', 'company_id', companies, 'companies.company_id'),
    ('company_jobs.csv', 'career_id', careers, 'careers.career_id'),
    ('mentor_feedback.csv', 'mentor_id', mentors, 'mentor_profiles.mentor_id'),
    ('mentor_feedback.csv', 'student_id', students, 'student_profiles.student_id'),
    ('mentor_feedback.csv', 'project_id', projects, 'projects.project_id'),
    ('mentor_feedback.csv', 'skill_id', skills, 'skills.skill_id'),
    ('learning_activity.csv', 'student_id', students, 'student_profiles.student_id'),
    ('certificates.csv', 'student_id', students, 'student_profiles.student_id'),
    ('certificates.csv', 'skill_id', skills, 'skills.skill_id'),
    ('job_applications.csv', 'student_id', students, 'student_profiles.student_id'),
    ('job_applications.csv', 'job_id', jobs, 'company_jobs.job_id'),
    ('feedback.csv', 'student_id', students, 'student_profiles.student_id'),
    ('notifications.csv', 'student_id', students, 'student_profiles.student_id')
]

all_fks_ok = True
for f, col, parent_set, ref_name in fks:
    df = pd.read_csv(resolve_path(f))
    orphans = set(df[col].dropna()) - parent_set
    status = 'PASS' if len(orphans) == 0 else f'FAIL ({len(orphans)} orphans)'
    if len(orphans) > 0:
        all_fks_ok = False
    print(f"{f:<25} {col:<22} -> {ref_name:<30} [{status}]")

print(f"\n>>> CHECK 2 VERDICT: {'ALL MATCH (PASS)' if all_fks_ok else 'FAILED'}\n")

print('=' * 70)
print('CHECK 3: NO MISSING IMPORTANT VALUES')
print('=' * 70)
important_cols = {
    'careers.csv': ['career_id', 'career_name', 'category', 'difficulty', 'estimated_preparation_months'],
    'skills.csv': ['skill_id', 'skill_name', 'category', 'description'],
    'career_skills.csv': ['career_id', 'skill_id', 'required_level', 'importance', 'weight'],
    'courses.csv': ['course_id', 'course_name', 'provider', 'difficulty', 'duration_hours', 'rating'],
    'projects.csv': ['project_id', 'project_name', 'career_id', 'difficulty', 'estimated_duration_weeks'],
    'assessment_questions.csv': ['question_id', 'career_id', 'skill_id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'],
    'student_profiles.csv': ['student_id', 'first_name', 'last_name', 'email', 'target_career_id', 'cgpa'],
    'student_skills.csv': ['student_id', 'skill_id', 'self_declared_score', 'final_mastery', 'mastery_level']
}
all_important_ok = True
for f, cols in important_cols.items():
    df = pd.read_csv(resolve_path(f))
    null_counts = {c: int(df[c].isnull().sum()) for c in cols}
    has_null = any(v > 0 for v in null_counts.values())
    if has_null:
        all_important_ok = False
    status = 'PASS' if not has_null else 'FAIL'
    print(f"{f:<28} Checked {len(cols)} columns | Missing counts: {null_counts} [{status}]")

print(f"\n>>> CHECK 3 VERDICT: {'ZERO MISSING VALUES (PASS)' if all_important_ok else 'FAILED'}\n")

print('=' * 70)
print('CHECK 4: SCORES & NUMERICS ARE WITHIN VALID RANGES')
print('=' * 70)
ranges_ok = True
ss = pd.read_csv(resolve_path('student_skills.csv'))
for col in ['self_declared_score', 'resume_score', 'assessment_score', 'project_score', 'certificate_score', 'mentor_score', 'final_mastery']:
    valid = ((ss[col] >= 0) & (ss[col] <= 100)).all()
    if not valid:
        ranges_ok = False
    status = 'PASS' if valid else 'FAIL'
    print(f"student_skills.{col:<22} min={ss[col].min():<3} max={ss[col].max():<3} (expected 0..100) [{status}]")

cs = pd.read_csv(resolve_path('career_skills.csv'))
weights_valid = ((cs['weight'] > 0) & (cs['weight'] <= 1.0)).all()
if not weights_valid:
    ranges_ok = False
status = 'PASS' if weights_valid else 'FAIL'
print(f"career_skills.weight            min={cs['weight'].min():.4f} max={cs['weight'].max():.4f} (expected 0..1) [{status}]")

courses = pd.read_csv(resolve_path('courses.csv'))
cr_valid = ((courses['rating'] >= 1.0) & (courses['rating'] <= 5.0)).all()
if not cr_valid:
    ranges_ok = False
status = 'PASS' if cr_valid else 'FAIL'
print(f"courses.rating                  min={courses['rating'].min()} max={courses['rating'].max()} (expected 1..5) [{status}]")

sp = pd.read_csv(resolve_path('student_profiles.csv'))
cgpa_valid = ((sp['cgpa'] >= 0.0) & (sp['cgpa'] <= 10.0)).all()
if not cgpa_valid:
    ranges_ok = False
status = 'PASS' if cgpa_valid else 'FAIL'
print(f"student_profiles.cgpa           min={sp['cgpa'].min()} max={sp['cgpa'].max()} (expected 0..10) [{status}]")

apps = pd.read_csv(resolve_path('job_applications.csv'))
app_valid = ((apps['application_readiness'] >= 0) & (apps['application_readiness'] <= 100)).all()
if not app_valid:
    ranges_ok = False
status = 'PASS' if app_valid else 'FAIL'
print(f"job_applications.readiness      min={apps['application_readiness'].min()} max={apps['application_readiness'].max()} (expected 0..100) [{status}]")

print(f"\n>>> CHECK 4 VERDICT: {'ALL RANGES VALID (PASS)' if ranges_ok else 'FAILED'}\n")

print('=' * 70)
print('CHECK 5: CAREER -> SKILLS RELATIONSHIPS WORK')
print('=' * 70)
careers_df = pd.read_csv(resolve_path('careers.csv'))
skills_df = pd.read_csv(resolve_path('skills.csv'))
cs_merged = cs.merge(careers_df, on='career_id').merge(skills_df, on='skill_id')
print(f"Total mapped career-skill rows: {len(cs_merged)}")

sample_cid = 'C001'
c_title = careers_df[careers_df['career_id'] == sample_cid]['career_name'].values[0]
c001_skills = cs_merged[cs_merged['career_id'] == sample_cid][['skill_id', 'skill_name', 'required_level', 'importance', 'weight', 'is_core_skill']]
print(f"\nSample Career {sample_cid}: {c_title} (Top 7 Skills):")
print(c001_skills.head(7).to_string(index=False))
c001_sum = c001_skills['weight'].sum()
print(f"Total Skills for C001: {len(c001_skills)} | Weight Sum: {c001_sum:.4f}")

career_counts = cs.groupby('career_id')['skill_id'].count()
career_weight_sums = cs.groupby('career_id')['weight'].sum()
c_rel_ok = (len(career_counts) == len(careers_df)) and ((career_counts >= 10).all()) and (((career_weight_sums >= 0.95) & (career_weight_sums <= 1.05)).all())
print(f"\nAll {len(careers_df)} careers mapped with >= 10 skills and sum(weights) ~ 1.0: [{'PASS' if c_rel_ok else 'FAIL'}]")
print(f">>> CHECK 5 VERDICT: {'CAREER -> SKILLS FUNCTIONAL (PASS)' if c_rel_ok else 'FAILED'}\n")

print('=' * 70)
print('CHECK 6: COURSE -> SKILLS RELATIONSHIPS WORK')
print('=' * 70)
course_skills = pd.read_csv(resolve_path('course_skills.csv'))
crs_merged = course_skills.merge(courses, on='course_id').merge(skills_df, on='skill_id')
print(f"Total mapped course-skill rows: {len(crs_merged)}")

sample_cr = 'CR001'
cr_title = courses[courses['course_id'] == sample_cr]['course_name'].values[0]
cr001_skills = crs_merged[crs_merged['course_id'] == sample_cr][['course_id', 'course_name', 'provider', 'skill_name', 'coverage_level', 'importance']]
print(f"\nSample Course {sample_cr}: {cr_title}:")
print(cr001_skills.to_string(index=False))

courses_with_skills = course_skills['course_id'].nunique()
all_courses_have_skills = courses_with_skills == len(courses)
print(f"\nAll {len(courses)} courses mapped to skills: {courses_with_skills}/{len(courses)} [{'PASS' if all_courses_have_skills else 'FAIL'}]")
print(f">>> CHECK 6 VERDICT: {'COURSE -> SKILLS FUNCTIONAL (PASS)' if all_courses_have_skills else 'FAILED'}\n")

print('=' * 70)
print('CHECK 7: PROJECT -> SKILLS RELATIONSHIPS WORK')
print('=' * 70)
proj_skills = pd.read_csv(resolve_path('project_skills.csv'))
projects_df = pd.read_csv(resolve_path('projects.csv'))
ps_merged = proj_skills.merge(projects_df, on='project_id').merge(skills_df, on='skill_id')
print(f"Total mapped project-skill rows: {len(ps_merged)}")

sample_p = 'P001'
p_title = projects_df[projects_df['project_id'] == sample_p]['project_name'].values[0]
p001_skills = ps_merged[ps_merged['project_id'] == sample_p][['project_id', 'project_name', 'difficulty', 'skill_name', 'required_level', 'importance']]
print(f"\nSample Project {sample_p}: {p_title}:")
print(p001_skills.to_string(index=False))

projs_with_skills = proj_skills['project_id'].nunique()
all_projs_have_skills = projs_with_skills == len(projects_df)
print(f"\nAll {len(projects_df)} projects mapped to skills: {projs_with_skills}/{len(projects_df)} [{'PASS' if all_projs_have_skills else 'FAIL'}]")
print(f">>> CHECK 7 VERDICT: {'PROJECT -> SKILLS FUNCTIONAL (PASS)' if all_projs_have_skills else 'FAILED'}\n")
