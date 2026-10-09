from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ResumeExtractedProject(BaseModel):
    title: str = Field(..., description="Project title or name")
    description: Optional[str] = Field("", description="Project description or summary")
    technologies: List[str] = Field(default_factory=list, description="Technologies or tools used")
    duration: Optional[str] = Field(None, description="Project duration or timeframe")


class ResumeExtractedCertificate(BaseModel):
    name: str = Field(..., description="Certificate name")
    issuer: Optional[str] = Field("", description="Issuing organization or authority")
    date: Optional[str] = Field(None, description="Issue date or year")
    related_skills: List[str] = Field(default_factory=list, description="Explicitly related skills")


class ResumeExtractedExperience(BaseModel):
    company: str = Field(..., description="Company or organization name")
    role: str = Field(..., description="Job title or role")
    duration: Optional[str] = Field(None, description="Dates or duration of employment")
    description: Optional[str] = Field("", description="Responsibilities and contributions")
    technologies: List[str] = Field(default_factory=list, description="Technologies or skills explicitly mentioned")


class ResumeExtractedEducation(BaseModel):
    institution: str = Field(..., description="University or educational institution")
    degree: str = Field(..., description="Degree or qualification")
    field: Optional[str] = Field(None, description="Field of study or major")
    year: Optional[str] = Field(None, description="Graduation year or dates")


class ResumeStructuredData(BaseModel):
    skills: List[str] = Field(default_factory=list, description="Extracted technical and domain skills")
    projects: List[ResumeExtractedProject] = Field(default_factory=list, description="Extracted projects")
    certificates: List[ResumeExtractedCertificate] = Field(default_factory=list, description="Extracted certificates")
    experience: List[ResumeExtractedExperience] = Field(default_factory=list, description="Extracted work experience")
    education: List[ResumeExtractedEducation] = Field(default_factory=list, description="Extracted education details")
    summary: Optional[str] = Field("", description="Brief resume summary")


class ResumeExtractedSkill(BaseModel):
    skill_id: str
    skill_name: str
    confidence: float
    evidence_type: str = "Resume Extraction"
    project_evidence: bool = False
    experience_evidence: bool = False
    certificate_evidence: bool = False
    resume_score: int = 50
    final_mastery: int = 0
    mastery_level: str = "Developing"


class ResumeAnalysisResponse(BaseModel):
    student_id: str
    filename: str
    total_skills_detected: int
    total_projects_detected: int
    total_certificates_detected: int
    total_experience_detected: int = 0
    detected_skills: List[ResumeExtractedSkill]
    unmatched_skills: List[str] = Field(default_factory=list)
    extracted_projects: List[ResumeExtractedProject] = Field(default_factory=list)
    extracted_certificates: List[ResumeExtractedCertificate] = Field(default_factory=list)
    extracted_experience: List[ResumeExtractedExperience] = Field(default_factory=list)
    extracted_education: List[ResumeExtractedEducation] = Field(default_factory=list)
    analysis_summary: str
    disclaimer: str = "Resume evidence indicates demonstrated exposure, not verified mastery. Mastery requires assessment and project proof."


class ResumeUploadResponse(BaseModel):
    status: str
    filename: str
    filesize_bytes: int
    resume_id: str
    message: str
    data: Optional[ResumeAnalysisResponse] = None

