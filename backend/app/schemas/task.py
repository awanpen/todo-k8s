"""Task-related Pydantic schemas."""

from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from app.models.task import TaskPriority, TaskCategory


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    category: TaskCategory = Field(default=TaskCategory.OTHER)
    due_date: date | None = None


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    completed: bool | None = None
    priority: TaskPriority | None = None
    category: TaskCategory | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: int
    title: str
    description: str | None
    completed: bool
    priority: TaskPriority
    category: TaskCategory
    due_date: date | None
    user_id: int
    created_at: datetime
    updated_at: datetime

    @field_validator('due_date', mode='before')
    @classmethod
    def convert_datetime_to_date(cls, v):
        """Convert datetime to date if needed."""
        if isinstance(v, datetime):
            return v.date()
        return v

    model_config = {"from_attributes": True}
