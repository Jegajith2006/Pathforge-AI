from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyRoleBase(BaseModel):
    role_title: str
    description: Optional[str] = None
    required_skills: List[Any] = Field(default_factory=list)
    match_score: float = Field(default=0.0, ge=0.0, le=100.0)
    readiness_level: Optional[str] = "High Match"


class CompanyRoleCreate(CompanyRoleBase):
    company_id: int


class CompanyRoleResponse(CompanyRoleBase):
    id: int
    company_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    roles: List[CompanyRoleResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
