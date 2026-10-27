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


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # 'student', 'mentor', 'admin'
    is_verified = Column(Boolean, default=True)
    account_status = Column(String(50), default="active")  # 'active', 'pending', 'suspended'
    created_at = Column(String(50), nullable=False)
    updated_at = Column(String(50), nullable=True)
    last_login_at = Column(String(50), nullable=True)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    mentor_profile = relationship("Mentor", back_populates="user", uselist=False)


class AuthOTPChallenge(Base):
    __tablename__ = "auth_otp_challenges"

    challenge_id = Column(String(50), primary_key=True, index=True)
    email = Column(String(150), index=True, nullable=False)
    purpose = Column(String(50), nullable=False)  # 'registration_student', 'registration_mentor', 'password_reset'
    otp_hash = Column(String(255), nullable=False)
    payload_json = Column(Text, nullable=True)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    resend_count = Column(Integer, default=0)
    last_sent_at = Column(String(50), nullable=False)
    expires_at = Column(String(50), nullable=False)
    is_consumed = Column(Boolean, default=False)
    created_at = Column(String(50), nullable=False)


class Student(Base):
    __tablename__ = "student_profiles"

    student_id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=True, index=True)
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
    user = relationship("User", back_populates="student_profile")
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
    mentor_assignments = relationship("MentorStudentAssignment", back_populates="student", cascade="all, delete-orphan")
    mentorship_sessions = relationship("MentorshipSession", back_populates="student", cascade="all, delete-orphan")
    resume_documents = relationship("ResumeDocument", back_populates="student", cascade="all, delete-orphan")
    course_resume_suggestions = relationship("CourseResumeSuggestion", back_populates="student", cascade="all, delete-orphan")
    resume_profile_entries = relationship("StudentResumeProfileEntry", back_populates="student", cascade="all, delete-orphan")
    lesson_progress = relationship("StudentLessonProgress", back_populates="student", cascade="all, delete-orphan")


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
    skills = relationship("CourseSkill", back_populates="course", cascade="all, delete-orphan", order_by="desc(CourseSkill.importance)")
    lessons = relationship("CourseLesson", back_populates="course", cascade="all, delete-orphan", order_by="CourseLesson.lesson_number")


class CourseSkill(Base):
    __tablename__ = "course_skills"

    course_id = Column(String(50), ForeignKey("courses.course_id"), primary_key=True)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), primary_key=True)
    coverage_level = Column(String(50), nullable=False)
    importance = Column(Integer, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="skills")
    skill = relationship("Skill", back_populates="course_mappings")


class CourseLesson(Base):
    __tablename__ = "course_lessons"

    lesson_id = Column(String(100), primary_key=True, index=True)
    course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=False, index=True)
    lesson_number = Column(Integer, nullable=False)
    title = Column(String(250), nullable=False)
    overview = Column(Text, nullable=False)
    learning_objectives_json = Column(Text, default="[]")
    key_concepts_json = Column(Text, default="[]")
    study_notes = Column(Text, nullable=False)
    step_by_step_explanation = Column(Text, nullable=True)
    code_examples_json = Column(Text, default="[]")
    practice_exercises_json = Column(Text, default="[]")
    estimated_minutes = Column(Integer, default=45)
    assessment_prerequisites = Column(Text, default="complete_study_and_resources")
    completion_criteria = Column(Text, default="study_notes_read,resources_reviewed,assessment_passed")
    is_project_provided = Column(Boolean, default=True)

    # Relationships
    course = relationship("Course", back_populates="lessons")
    resources = relationship("LessonResource", back_populates="lesson", cascade="all, delete-orphan", order_by="LessonResource.resource_order")
    student_progress = relationship("StudentLessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class LessonResource(Base):
    __tablename__ = "lesson_resources"

    resource_id = Column(String(100), primary_key=True, index=True)
    lesson_id = Column(String(100), ForeignKey("course_lessons.lesson_id"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=False, index=True)
    resource_order = Column(Integer, default=1)
    resource_type = Column(String(50), nullable=False)  # 'documentation', 'video', 'pdf', 'tutorial', 'article'
    title = Column(String(250), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    provider_name = Column(String(100), nullable=False)
    is_verified = Column(Boolean, default=True)

    # Relationships
    lesson = relationship("CourseLesson", back_populates="resources")
    course = relationship("Course")


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
    is_completed = Column(Boolean, default=False)
    completion_status = Column(String(50), default="not_started")  # not_started, in_progress, completed
    completed_at = Column(String(50), nullable=True)
    best_assessment_score = Column(Integer, default=0)
    latest_assessment_score = Column(Integer, default=0)

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
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    title = Column(String(150), default="Principal Mentor")
    company = Column(String(150), default="PathForge Network")
    linkedin_url = Column(String(255), nullable=True)
    expertise = Column(String(150), nullable=False)
    experience_years = Column(Integer, nullable=False)
    skills = Column(String(255), nullable=False)
    bio = Column(Text, nullable=False)
    availability = Column(String(50), default="Available")
    rating = Column(Float, default=4.8)
    role = Column(String(50), default="mentor")
    status = Column(String(50), default="active")
    created_at = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="mentor_profile")
    feedbacks = relationship("MentorFeedback", back_populates="mentor")
    assigned_students = relationship("MentorStudentAssignment", back_populates="mentor", cascade="all, delete-orphan")
    sessions = relationship("MentorshipSession", back_populates="mentor", cascade="all, delete-orphan")
    resources = relationship("MentorResource", back_populates="mentor", cascade="all, delete-orphan")
    guidance_notes = relationship("MentorGuidanceNote", back_populates="mentor", cascade="all, delete-orphan")


class MentorStudentAssignment(Base):
    __tablename__ = "mentor_student_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    assigned_date = Column(String(50), nullable=False)
    status = Column(String(50), default="active")  # active, completed, paused
    notes = Column(Text, nullable=True)

    mentor = relationship("Mentor", back_populates="assigned_students")
    student = relationship("Student", back_populates="mentor_assignments")


class MentorshipSession(Base):
    __tablename__ = "mentorship_sessions"

    session_id = Column(String(50), primary_key=True, index=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    topic = Column(String(200), nullable=False)
    session_date = Column(String(50), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    platform = Column(String(100), default="Google Meet")
    meeting_link = Column(String(255), default="https://meet.google.com/pathforge-ai")
    status = Column(String(50), default="upcoming")  # upcoming, completed, cancelled, rescheduled
    notes = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=False)

    mentor = relationship("Mentor", back_populates="sessions")
    student = relationship("Student", back_populates="mentorship_sessions")


class MentorMessage(Base):
    __tablename__ = "mentor_messages"

    message_id = Column(String(50), primary_key=True, index=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    sender_role = Column(String(50), nullable=False)  # 'mentor' or 'student'
    sender_id = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(String(50), nullable=False)

    mentor = relationship("Mentor")
    student = relationship("Student")


class MentorResource(Base):
    __tablename__ = "mentor_resources"

    resource_id = Column(String(50), primary_key=True, index=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    url = Column(String(255), nullable=False)
    tags = Column(String(255), default="")
    created_at = Column(String(50), nullable=False)

    mentor = relationship("Mentor", back_populates="resources")


class MentorGuidanceNote(Base):
    __tablename__ = "mentor_guidance_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mentor_id = Column(String(50), ForeignKey("mentor_profiles.mentor_id"), nullable=False)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False)
    notes = Column(Text, nullable=False)
    recommended_courses = Column(Text, nullable=True)
    recommended_projects = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=False)

    mentor = relationship("Mentor", back_populates="guidance_notes")
    student = relationship("Student")


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
    enrollment_status = Column(String(50), default="enrolled")
    last_lesson_id = Column(String(100), nullable=True)
    last_lesson_title = Column(String(200), nullable=True)
    last_position_seconds = Column(Integer, default=0)
    total_lessons = Column(Integer, default=5)
    completed_lessons_count = Column(Integer, default=0)
    completed_lessons_json = Column(Text, default="[]")
    last_accessed_at = Column(String(50), nullable=True)
    final_assessment_score = Column(Float, nullable=True)
    final_assessment_passed = Column(Boolean, default=False)
    assessment_attempts_count = Column(Integer, default=0)

    student = relationship("Student", back_populates="course_progress")
    course = relationship("Course")


class StudentLessonProgress(Base):
    __tablename__ = "student_lesson_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=False, index=True)
    lesson_id = Column(String(100), ForeignKey("course_lessons.lesson_id"), nullable=False, index=True)
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed
    resources_reviewed_json = Column(Text, default="[]")  # List of resource_ids reviewed
    is_assessment_unlocked = Column(Boolean, default=False)
    assessment_attempt_id = Column(String(50), nullable=True)
    assessment_score = Column(Float, nullable=True)
    assessment_passed = Column(Boolean, default=False)
    notes_read = Column(Boolean, default=False)
    last_accessed_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)

    # Relationships
    student = relationship("Student", back_populates="lesson_progress")
    lesson = relationship("CourseLesson", back_populates="student_progress")
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


class ResumeDocument(Base):
    __tablename__ = "resume_documents"

    resume_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    upload_timestamp = Column(String(50), nullable=False)
    analysis_status = Column(String(50), default="analyzed")
    analysis_version = Column(String(50), default="v1.0")
    is_active = Column(Boolean, default=True)
    extracted_skills_json = Column(Text, nullable=True)
    extracted_projects_json = Column(Text, nullable=True)
    extracted_certificates_json = Column(Text, nullable=True)
    extracted_experience_json = Column(Text, nullable=True)
    extracted_education_json = Column(Text, nullable=True)
    analysis_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    student = relationship("Student", back_populates="resume_documents")


class CourseResumeSuggestion(Base):
    __tablename__ = "course_resume_suggestions"

    suggestion_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=False)
    skill_id = Column(String(50), ForeignKey("skills.skill_id"), nullable=True)
    course_name = Column(String(200), nullable=False)
    skill_name = Column(String(150), nullable=False)
    suggestion_type = Column(String(50), default="course_completion")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    suggested_content = Column(Text, nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, dismissed
    created_at = Column(String(50), nullable=False)
    resolved_at = Column(String(50), nullable=True)

    student = relationship("Student", back_populates="course_resume_suggestions")
    course = relationship("Course")


class StudentResumeProfileEntry(Base):
    __tablename__ = "student_resume_profile_entries"

    entry_id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("student_profiles.student_id"), nullable=False, index=True)
    entry_type = Column(String(50), nullable=False)  # coursework, skill, credential, project
    title = Column(String(200), nullable=False)
    detail = Column(Text, nullable=False)
    source_course_id = Column(String(50), ForeignKey("courses.course_id"), nullable=True)
    added_at = Column(String(50), nullable=False)

    student = relationship("Student", back_populates="resume_profile_entries")

