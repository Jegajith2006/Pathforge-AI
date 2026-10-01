from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: Optional[str] = "system"
    related_route: Optional[str] = None
    is_read: Optional[bool] = False


class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
