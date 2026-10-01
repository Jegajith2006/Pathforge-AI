from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MentorFeedbackBase(BaseModel):
    mentor_name: str
    mentor_role: str
    feedback_title: str
    feedback_text: str
    feedback_type: Optional[str] = "Code Review"
    status: Optional[str] = "Received"  # Requested, In Review, Received, Resolved
    priority: Optional[str] = "Medium"


class MentorFeedbackCreate(MentorFeedbackBase):
    user_id: Optional[int] = None


class MentorFeedbackResponse(MentorFeedbackBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
