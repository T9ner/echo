"""
Habit Pydantic Schemas - Data Validation for Habit Tracking

These schemas define:
1. How to create new habits
2. How to log habit completions
3. How to update existing habits
4. What data we send back to users

Think of habits as recurring activities you want to track daily/weekly!
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.enums import HabitFrequency


class HabitBase(BaseModel):
    """
    Base habit schema - common fields for habits
    
    A habit is different from a task:
    - Task: "Buy groceries" (do once)
    - Habit: "Exercise daily" (do repeatedly)
    """
    name: str = Field(..., min_length=1, max_length=200, description="Habit name (required)")
    description: Optional[str] = Field(None, max_length=1000, description="Habit description (optional)")
    frequency: HabitFrequency = Field(..., description="How often to do this habit")
    target_count: int = Field(default=1, ge=1, le=100, description="How many times per frequency period")


class HabitCreate(HabitBase):
    """
    Schema for creating a new habit
    
    When a user creates a habit, they send:
    - name: "Exercise"
    - description: "30 minutes of cardio"
    - frequency: "daily"
    - target_count: 1 (once per day)
    """
    pass  # Inherits everything from HabitBase


class HabitUpdate(BaseModel):
    """
    Schema for updating an existing habit
    
    All fields are optional when updating.
    Example: {"target_count": 2} - change from once to twice daily
    """
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    frequency: Optional[HabitFrequency] = None
    target_count: Optional[int] = Field(None, ge=1, le=100)


class HabitResponse(HabitBase):
    """
    Schema for sending habit data back to users
    
    Includes everything from HabitBase PLUS:
    - id: unique identifier
    - streak information
    - timestamps
    """
    id: str = Field(..., description="Unique habit identifier")
    current_streak: int = Field(..., description="Current consecutive days completed")
    longest_streak: int = Field(..., description="Best streak ever achieved")
    created_at: datetime = Field(..., description="When the habit was created")
    updated_at: datetime = Field(..., description="When the habit was last updated")
    
    class Config:
        """Tell Pydantic to work with SQLAlchemy models"""
        from_attributes = True


class HabitLogBase(BaseModel):
    """
    Base schema for habit completion logs
    
    A habit log records when you completed a habit:
    - completed_date: which day
    - count: how many times (if target_count > 1)
    - notes: optional notes about the completion
    """
    completed_date: date = Field(..., description="Date when habit was completed")
    count: int = Field(default=1, ge=1, le=100, description="How many times completed")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about completion")


class HabitLogCreate(HabitLogBase):
    """
    Schema for creating a habit completion log
    
    When user marks a habit as done:
    - completed_date: "2024-01-10" (today)
    - count: 1 (did it once)
    - notes: "Great workout at the gym!"
    """
    habit_id: str = Field(..., description="ID of the habit being logged")


class HabitLogUpdate(BaseModel):
    """
    Schema for updating a habit log
    
    Might want to change the count or add notes later
    """
    count: Optional[int] = Field(None, ge=1, le=100)
    notes: Optional[str] = Field(None, max_length=500)


class HabitLogResponse(HabitLogBase):
    """
    Schema for sending habit log data back
    
    Includes all log details plus metadata
    """
    id: str = Field(..., description="Unique log identifier")
    habit_id: str = Field(..., description="ID of the associated habit")
    created_at: datetime = Field(..., description="When the log was created")
    
    class Config:
        """Tell Pydantic to work with SQLAlchemy models"""
        from_attributes = True


class HabitWithLogs(HabitResponse):
    """
    Extended habit response that includes recent completion logs
    
    Useful for showing habit details with recent activity
    """
    recent_logs: List[HabitLogResponse] = Field(default=[], description="Recent completion logs")


class HabitStatistics(BaseModel):
    """
    Schema for habit statistics and insights
    
    Provides useful analytics about habit performance
    """
    habit_id: str = Field(..., description="Habit identifier")
    habit_name: str = Field(..., description="Habit name")
    total_completions: int = Field(..., description="Total times completed")
    completion_rate: float = Field(..., description="Percentage of days completed (0-100)")
    current_streak: int = Field(..., description="Current consecutive days")
    longest_streak: int = Field(..., description="Best streak achieved")
    days_since_creation: int = Field(..., description="How many days since habit was created")
    last_completed: Optional[date] = Field(None, description="Last completion date")


# Example usage of these schemas:
"""
Creating a habit:
POST /habits
{
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "frequency": "daily",
    "target_count": 1
}

Logging completion:
POST /habits/{habit_id}/logs
{
    "completed_date": "2024-01-10",
    "count": 1,
    "notes": "Great workout today!"
}

Response with streak info:
{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "frequency": "daily",
    "target_count": 1,
    "current_streak": 5,
    "longest_streak": 12,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-10T09:00:00"
}
"""