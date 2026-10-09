from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    ForeignKey,
    Text,
    DateTime,
)
from sqlalchemy.orm import relationship
from .connection import Base


class Student(Base):
    __tablename__ = "student_profiles"

    student_id = Column(String(50), primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    college = Column(String(200), nullable=False)
    department = Column(String(150), nullable=False)
    degree = Column(String(150), nullable=False)
    graduation_year = Column(Integer, nullable=False)
    cgpa = Column(Float, nullable=False)
    target_career_id = Column(String(50), ForeignKey("careers.career_id"), nullable=False)
    weekly_learning_hours = Column(Integer, default=12)
    preferred_difficulty = Column(String(50), default="Adaptive")
    learning_mode = Column(String(50), default="Project-based")

    # Relationships
    career = relationship("Career", back_populates="students")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    assessment_answers = relationship("AssessmentAnswer", back_populates="student", cascade="all, delete-orphan")
    resume_extractions = relationship("ResumeAnalysis", back_populates="student", cascade="all, delete-orphan")
    mentor_feedback = relationship("MentorFeedback", back_populates="student")
    activities = relationship("LearningActivity", back_populates="student", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="student", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="student")
    feedback_entries = relationship("Feedback", back_populates="student")
    notifications = relationship("Notification", back_populates="student", cascade="all, delete-orphan")
    course_progress = relationship("StudentCourseProgress", back_populates="student", cascade="all, delete-orphan")
    project_progress = relationship("StudentProjectProgress", back_populates="student", cascade="all, delete-orphan")
    roadmap_steps = relationship("StudentRoadmapStep", back_populates="student", cascade="all, delete-orphan")


class Career(Base):
    __tablename__ = "careers"

    career_id = Column(String(50), primary_key=True, index=True)
    career_name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=False)
    estimated_preparation_months = Column(Integer, nullable=False)
    core_focus = Column(String(200), nullable=False)
    typical_entry_level = Column(String(150), nullable=False)

    # Relationships
    skills = relationship("CareerSkill", back_populates="career", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="career")
    questions = relationship("AssessmentQuestion", back_populates="career")
    students = relationship("Student", back_populates="career")
    company_jobs = relationship("CompanyJob", back_populates="career")
    company_skills = relationship("CompanySkill", back_populates="career")


class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(String(50), primary_key=True, index=True)
    skill_name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    beginner_definition = Column(Text, nullable=False)
    intermediate_definition = Column(Text, nullable=False)
    advanced_definition = Column(Text, nullable=False)

    # Relationships
    career_mappings = relationship("CareerSkill", back_populates="skill")
    course_mappings = relationship("CourseSkill", back_populates="skill")
    project_mappings = relationship("ProjectSkill", back_populates="skill")
    student_mappings = relationship("StudentSkill", back_populates="skill")
    prerequisites = relationship("SkillPrerequisite", foreign_keys="[SkillPrerequisite.dependent_skill_id]", back_populates="dependent_skill")
    dependents = relationship("SkillPrerequisite", foreign_keys="[SkillPrerequisite.prerequisite_skill_id]", back_populates="prerequisite_skill")


class CareerSkill(Base):
    __tablename__ = "career_skills"

    career_id = Column(String(50), ForeignKey("careers.career_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    required_level = Column(String(50), nullable=False)
    importance = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    is_core_skill = Column(Boolean, default=False)

    # Relationships
    career = relationship("Career", back_populates="skills")
    skill = relationship("Skill", back_populates="career_mappings")


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    prerequisite_id = Column(String(50), primary_key=True, index=True)
    prerequisite_skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    dependent_skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    relationship_type = Column("relationship", String(100), default="Prerequisite")
    priority = Column(String(50), default="Critical")

    # Relationships
    prerequisite_skill = relationship("Skill", foreign_keys=[prerequisite_skill_id], back_populates="dependents")
    dependent_skill = relationship("Skill", foreign_keys=[dependent_skill_id], back_populates="prerequisites")


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(String(50), primary_key=True, index=True)
    course_name = Column(String(200), nullable=False)
    provider = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(50), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    format = Column(String(100), nullable=False)
    rating = Column(Float, nullable=False)
    url = Column(String(255), nullable=False)
    language = Column(String(50), default="English")

    # Relationships
    skills = relationship("CourseSkill", back_populates="course", cascade="all, delete-orphan")


class CourseSkill(Base):
    __tablename__ = "course_skills"

    course_id = Column(String(50), ForeignKey("courses.course_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    coverage_level = Column(String(50), nullable=False)
    importance = Column(Integer, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="skills")
    skill = relationship("Skill", back_populates="course_mappings")


class Project(Base):
    __tablename__ = "projects"

    project_id = Column(String(50), primary_key=True, index=True)
    project_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(50), nullable=False)
    estimated_duration_weeks = Column(Integer, nullable=False)
    career_id = Column(String(50), ForeignKey("careers.career_id"), nullable=False)
    learning_outcomes = Column(Text, nullable=False)

    # Relationships
    career = relationship("Career", back_populates="projects")
    skills = relationship("ProjectSkill", back_populates="project", cascade="all, delete-orphan")


class ProjectSkill(Base):
    __tablename__ = "project_skills"

    project_id = Column(String(50), ForeignKey("projects.project_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    required_level = Column(String(50), nullable=False)
    importance = Column(Integer, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="skills")
    skill = relationship("Skill", back_populates="project_mappings")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    question_id = Column(String(50), primary_key=True, index=True)
    career_id = Column(String(50), ForeignKey("careers.career_id"), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    difficulty = Column(String(50), nullable=False)
    question_type = Column(String(50), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    weight = Column(Float, default=1.0)

    # Relationships
    career = relationship("Career", back_populates="questions")
    skill = relationship("Skill")
    answers = relationship("AssessmentAnswer", back_populates="question")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    attempt_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    question_id = Column(String(50), ForeignKey("assessment_questions.question_id"), nullable=False)
    selected_answer = Column(Text, nullable=False)
    correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer, nullable=False)
    attempt_date = Column(String(50), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="assessment_answers")
    question = relationship("AssessmentQuestion", back_populates="answers")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    self_declared_score = Column(Integer, default=0)
    resume_score = Column(Integer, default=0)
    assessment_score = Column(Integer, default=0)
    project_score = Column(Integer, default=0)
    certificate_score = Column(Integer, default=0)
    mentor_score = Column(Integer, default=0)
    final_mastery = Column(Integer, default=0)
    mastery_level = Column(String(50), default="Missing")
    evidence_count = Column(Integer, default=0)
    last_updated = Column(String(50), nullable=True)

    # Relationships
    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill", back_populates="student_mappings")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    resume_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    detected = Column(Boolean, default=True)
    confidence = Column(Float, default=1.0)
    evidence_type = Column(String(100), default="Skill Section")
    project_evidence = Column(Boolean, default=False)
    experience_evidence = Column(Boolean, default=False)
    certificate_evidence = Column(Boolean, default=False)

    # Relationships
    student = relationship("Student", back_populates="resume_extractions")
    skill = relationship("Skill")


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(String(50), primary_key=True, index=True)
    company_name = Column(String(150), nullable=False, index=True)
    industry = Column(String(100), nullable=False)
    company_size = Column(String(50), nullable=False)
    location = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    career_categories = Column(String(255), nullable=False)

    # Relationships
    jobs = relationship("CompanyJob", back_populates="company")
    company_skills = relationship("CompanySkill", back_populates="company")


class CompanySkill(Base):
    __tablename__ = "company_skills"

    company_id = Column(String(50), ForeignKey("companies.company_id"), primary_key=True)
    career_id = Column(String(50), ForeignKey("careers.career_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    required_level = Column(String(50), nullable=False)
    importance = Column(Integer, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="company_skills")
    career = relationship("Career", back_populates="company_skills")
    skill = relationship("Skill")


class CompanyJob(Base):
    __tablename__ = "company_jobs"

    job_id = Column(String(50), primary_key=True, index=True)
    company_id = Column(String(50), ForeignKey("companies.company_id"), nullable=False)
    career_id = Column(String(50), ForeignKey("careers.career_id"), nullable=False)
    job_title = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)
    experience_required = Column(String(100), nullable=False)
    employment_type = Column(String(50), default="Full-Time")
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False)
    preferred_skills = Column(Text, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="jobs")
    career = relationship("Career", back_populates="company_jobs")
    applications = relationship("JobApplication", back_populates="job")


class Mentor(Base):
    __tablename__ = "mentor_profiles"

    mentor_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    expertise = Column(String(150), nullable=False)
    experience_years = Column(Integer, nullable=False)
    skills = Column(String(255), nullable=False)
    bio = Column(Text, nullable=False)
    availability = Column(String(50), default="Available")
    rating = Column(Float, default=4.8)

    # Relationships
    feedbacks = relationship("MentorFeedback", back_populates="mentor")


class MentorFeedback(Base):
    __tablename__ = "mentor_feedback"

    feedback_id = Column(String(50), primary_key=True, index=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    project_id = Column(String(50), ForeignKey("projects.project_id"), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    rating = Column(Integer, nullable=False)
    strengths = Column(Text, nullable=False)
    improvement_areas = Column(Text, nullable=False)
    comments = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    feedback_date = Column(String(50), nullable=False)

    # Relationships
    mentor = relationship("Mentor", back_populates="feedbacks")
    student = relationship("Student", back_populates="mentor_feedback")
    project = relationship("Project")
    skill = relationship("Skill")


class LearningActivity(Base):
    __tablename__ = "learning_activity"

    activity_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    activity_date = Column(String(50), nullable=False)
    activity_type = Column(String(50), nullable=False)
    activity_name = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    activity_count = Column(Integer, default=1)

    # Relationships
    student = relationship("Student", back_populates="activities")


class Certificate(Base):
    __tablename__ = "certificates"

    certificate_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    provider = Column(String(100), nullable=False)
    course_name = Column(String(200), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=False)
    issue_date = Column(String(50), nullable=False)
    verification_status = Column(String(50), default="Verified")
    certificate_url = Column(String(255), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="certificates")
    skill = relationship("Skill")


class JobApplication(Base):
    __tablename__ = "job_applications"

    application_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    job_id = Column(String(50), ForeignKey("company_jobs.job_id"), nullable=False)
    resume_match = Column(Integer, nullable=False)
    skill_match = Column(Integer, nullable=False)
    project_match = Column(Integer, nullable=False)
    application_readiness = Column(Integer, nullable=False)
    status = Column(String(50), default="Prepared")
    application_date = Column(String(50), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="job_applications")
    job = relationship("CompanyJob", back_populates="applications")


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    category = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    sentiment = Column(String(50), default="Positive")
    issue_type = Column(String(50), default="None")
    created_at = Column(String(50), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="feedback_entries")


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(String(50), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="notifications")


# User progress & dynamic state tables
class StudentCourseProgress(Base):
    __tablename__ = "student_course_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=False)
    progress_percentage = Column(Integer, default=0)
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed
    completed_at = Column(String(50), nullable=True)

    student = relationship("Student", back_populates="course_progress")
    course = relationship("Course")


class StudentProjectProgress(Base):
    __tablename__ = "student_project_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    project_id = Column(String(50), ForeignKey("projects.project_id"), nullable=False)
    progress_percentage = Column(Integer, default=0)
    status = Column(String(50), default="not_started")
    github_url = Column(String(255), nullable=True)
    completed_at = Column(String(50), nullable=True)

    student = relationship("Student", back_populates="project_progress")
    project = relationship("Project")


class StudentRoadmapStep(Base):
    __tablename__ = "student_roadmap_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    milestone_name = Column(String(200), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=True)
    status = Column(String(50), default="pending")  # completed, in_progress, pending
    estimated_weeks = Column(Integer, default=3)
    completed_at = Column(String(50), nullable=True)

    student = relationship("Student", back_populates="roadmap_steps")
    skill = relationship("Skill")
