"""
Task Pydantic Schemas - Data Validation Models

Think of these as "contracts" that define:
1. What data we accept from users
2. What data we send back to users
3. Automatic validation (reject bad data)
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """
    Base task schema - common fields for creating/updating tasks
    
    This is like a template that says:
    "Every task must have a title, can have a description, etc."
    """
    title: str = Field(..., min_length=1, max_length=200, description="Task title (required)")
    description: Optional[str] = Field(None, max_length=1000, description="Task description (optional)")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    due_date: Optional[datetime] = Field(None, description="When the task is due (optional)")


class TaskCreate(TaskBase):
    """
    Schema for creating a new task
    
    When a user creates a task, they send this data:
    - title: "Buy groceries" 
    - description: "Get milk, bread, eggs"
    - priority: "high"
    - due_date: "2024-01-15T10:00:00"
    """
    pass  # Inherits everything from TaskBase


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task
    
    When updating, ALL fields are optional (you might only want to change status)
    Example: {"status": "completed"} - just mark as done
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    """
    Schema for sending task data back to users
    
    This includes everything from TaskBase PLUS:
    - id: unique identifier
    - created_at: when it was created
    - updated_at: when it was last modified
    - completed_at: when it was marked done
    """
    id: str = Field(..., description="Unique task identifier")
    created_at: datetime = Field(..., description="When the task was created")
    updated_at: datetime = Field(..., description="When the task was last updated")
    completed_at: Optional[datetime] = Field(None, description="When the task was completed")
    
    class Config:
        """Tell Pydantic to work with SQLAlchemy models"""
        from_attributes = True  # This allows conversion from database models


# Example of what these schemas look like in practice:
"""
TaskCreate example (what user sends):
{
    "title": "Buy groceries",
    "description": "Get milk, bread, eggs",
    "priority": "high",
    "due_date": "2024-01-15T10:00:00"
}

TaskResponse example (what we send back):
{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries", 
    "description": "Get milk, bread, eggs",
    "status": "todo",
    "priority": "high",
    "due_date": "2024-01-15T10:00:00",
    "created_at": "2024-01-10T09:00:00",
    "updated_at": "2024-01-10T09:00:00",
    "completed_at": null
}
"""