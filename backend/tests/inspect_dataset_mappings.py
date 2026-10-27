import pandas as pd
from pathlib import Path

root = Path("d:/Downloads/s5/s5 mini project/datasets")

careers_df = pd.read_csv(root / "01_careers.csv")
skills_df = pd.read_csv(root / "02_skills.csv")
career_skills_df = pd.read_csv(root / "03_career_skills.csv")
courses_df = pd.read_csv(root / "05_courses.csv")
course_skills_df = pd.read_csv(root / "06_course_skills.csv")

print(f"Total Careers: {len(careers_df)}")
print(f"Total Skills: {len(skills_df)}")
print(f"Total Career-Skill Mappings: {len(career_skills_df)}")
print(f"Total Courses: {len(courses_df)}")
print(f"Total Course-Skill Mappings: {len(course_skills_df)}")

# 1. Careers without skills
careers_with_skills = set(career_skills_df["career_id"])
all_careers = set(careers_df["career_id"])
missing_career_skills = all_careers - careers_with_skills
print(f"Careers without any skills mapped: {len(missing_career_skills)}")
if missing_career_skills:
    print(f"Missing careers: {missing_career_skills}")

# 2. Courses without skills
courses_with_skills = set(course_skills_df["course_id"])
all_courses = set(courses_df["course_id"])
missing_course_skills = all_courses - courses_with_skills
print(f"Courses without any skills mapped: {len(missing_course_skills)}")
if missing_course_skills:
    print(f"Missing courses: {missing_course_skills}")

# 3. Check invalid skill_ids referenced in career_skills
all_skills = set(skills_df["skill_id"])
invalid_career_skills = set(career_skills_df["skill_id"]) - all_skills
print(f"Career-skills referencing invalid skill IDs: {len(invalid_career_skills)}")

# 4. Check invalid skill_ids referenced in course_skills
invalid_course_skills = set(course_skills_df["skill_id"]) - all_skills
print(f"Course-skills referencing invalid skill IDs: {len(invalid_course_skills)}")

# 5. Course counts per career across all careers
print("\n--- Course counts per career ---")
for _, c in careers_df.iterrows():
    c_id = c["career_id"]
    c_name = c["career_name"]
    c_skill_ids = set(career_skills_df[career_skills_df["career_id"] == c_id]["skill_id"])
    matching_courses = set(course_skills_df[course_skills_df["skill_id"].isin(c_skill_ids)]["course_id"])
    print(f"{c_id}: {c_name:<35} -> {len(c_skill_ids):2d} skills -> {len(matching_courses):2d} courses")
