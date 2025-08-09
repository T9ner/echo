"""
Habit API Endpoints - The Interface for Habit Tracking

These are the URLs your React frontend will call for habit management:
- GET /habits - Get all habits
- POST /habits - Create a new habit
- GET /habits/{id} - Get specific habit
- PUT /habits/{id} - Update a habit
- DELETE /habits/{id} - Delete a habit
- POST /habits/{id}/logs - Log habit completion
- GET /habits/{id}/logs - Get completion history
- GET /habits/{id}/stats - Get habit statistics

Think of these as the "buttons" for your habit tracking system!
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.services.habit_service import HabitService
from app.schemas.habit import (
    HabitCreate, HabitUpdate, HabitResponse, HabitWithLogs,
    HabitLogCreate, HabitLogUpdate, HabitLogResponse,
    HabitStatistics
)
from app.models.enums import HabitFrequency

# Create router for habit endpoints
router = APIRouter()


@router.post("/", response_model=HabitResponse, status_code=201)
def create_habit(
    habit_data: HabitCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new habit
    
    This endpoint handles POST requests to /habits
    
    What happens:
    1. User sends habit data: {"name": "Exercise", "frequency": "daily"}
    2. FastAPI validates the data using HabitCreate schema
    3. HabitService creates the habit in PostgreSQL
    4. We return the created habit with ID and streak info
    
    Args:
        habit_data: HabitCreate schema with habit information
        db: Database session (automatically injected)
        
    Returns:
        HabitResponse: The created habit with all details
        
    Example Request:
        POST /habits
        {
            "name": "Morning Exercise",
            "description": "30 minutes of cardio",
            "frequency": "daily",
            "target_count": 1
        }
        
    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Morning Exercise",
            "description": "30 minutes of cardio",
            "frequency": "daily",
            "target_count": 1,
            "current_streak": 0,
            "longest_streak": 0,
            "created_at": "2024-01-10T09:00:00",
            "updated_at": "2024-01-10T09:00:00"
        }
    """
    try:
        service = HabitService(db)
        new_habit = service.create_habit(habit_data)
        return new_habit
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create habit: {str(e)}")


@router.get("/", response_model=List[HabitResponse])
def get_habits(
    frequency: Optional[HabitFrequency] = Query(None, description="Filter by habit frequency"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of habits to return"),
    offset: int = Query(0, ge=0, description="Number of habits to skip"),
    db: Session = Depends(get_db)
):
    """
    Get all habits with optional filtering
    
    This endpoint handles GET requests to /habits
    
    Query Parameters:
        frequency: Filter by frequency (daily, weekly, monthly, custom)
        limit: How many habits to return (default: 100, max: 1000)
        offset: How many to skip for pagination (default: 0)
        
    Returns:
        List[HabitResponse]: Array of habits with streak information
        
    Example Requests:
        GET /habits - Get all habits
        GET /habits?frequency=daily - Get only daily habits
        GET /habits?limit=5 - Get first 5 habits
        
    Example Response:
        [
            {
                "id": "123...",
                "name": "Morning Exercise",
                "frequency": "daily",
                "current_streak": 5,
                "longest_streak": 12,
                ...
            },
            {
                "id": "456...",
                "name": "Read Books",
                "frequency": "daily",
                "current_streak": 3,
                "longest_streak": 8,
                ...
            }
        ]
    """
    try:
        service = HabitService(db)
        habits = service.get_all_habits(
            frequency=frequency,
            limit=limit,
            offset=offset
        )
        return habits
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get habits: {str(e)}")


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(
    habit_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific habit by ID
    
    Args:
        habit_id: The unique identifier for the habit
        db: Database session (automatically injected)
        
    Returns:
        HabitResponse: The requested habit with streak info
        
    Raises:
        HTTPException 404: If habit is not found
        
    Example Request:
        GET /habits/123e4567-e89b-12d3-a456-426614174000
        
    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Morning Exercise",
            "current_streak": 5,
            "longest_streak": 12,
            ...
        }
    """
    try:
        service = HabitService(db)
        habit = service.get_habit_by_id(habit_id)
        
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        return habit
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get habit: {str(e)}")


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: str,
    habit_update: HabitUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing habit
    
    Args:
        habit_id: The unique identifier for the habit
        habit_update: HabitUpdate schema with new values
        db: Database session (automatically injected)
        
    Returns:
        HabitResponse: The updated habit
        
    Raises:
        HTTPException 404: If habit is not found
        
    Example Request:
        PUT /habits/123e4567-e89b-12d3-a456-426614174000
        {
            "target_count": 2,
            "description": "Updated: 45 minutes of cardio"
        }
    """
    try:
        service = HabitService(db)
        updated_habit = service.update_habit(habit_id, habit_update)
        
        if not updated_habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        return updated_habit
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update habit: {str(e)}")


@router.delete("/{habit_id}", status_code=204)
def delete_habit(
    habit_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a habit and all its completion logs
    
    Args:
        habit_id: The unique identifier for the habit
        db: Database session (automatically injected)
        
    Returns:
        None (204 No Content status)
        
    Raises:
        HTTPException 404: If habit is not found
        
    Example Request:
        DELETE /habits/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        service = HabitService(db)
        success = service.delete_habit(habit_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete habit: {str(e)}")


@router.post("/{habit_id}/logs", response_model=HabitLogResponse, status_code=201)
def log_habit_completion(
    habit_id: str,
    log_data: HabitLogCreate,
    db: Session = Depends(get_db)
):
    """
    Log a habit completion (mark as done for a specific date)
    
    This is the core function users call when they complete a habit.
    It automatically updates streaks!
    
    Args:
        habit_id: The unique identifier for the habit
        log_data: HabitLogCreate schema with completion info
        db: Database session (automatically injected)
        
    Returns:
        HabitLogResponse: The created completion log
        
    Raises:
        HTTPException 404: If habit is not found
        
    Example Request:
        POST /habits/123e4567-e89b-12d3-a456-426614174000/logs
        {
            "completed_date": "2024-01-10",
            "count": 1,
            "notes": "Great workout at the gym!"
        }
        
    Example Response:
        {
            "id": "log-123...",
            "habit_id": "123e4567-e89b-12d3-a456-426614174000",
            "completed_date": "2024-01-10",
            "count": 1,
            "notes": "Great workout at the gym!",
            "created_at": "2024-01-10T15:30:00"
        }
    """
    try:
        # Ensure the habit_id in the URL matches the one in the data
        log_data.habit_id = habit_id
        
        service = HabitService(db)
        log = service.log_habit_completion(log_data)
        
        if not log:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log completion: {str(e)}")


@router.get("/{habit_id}/logs", response_model=List[HabitLogResponse])
def get_habit_logs(
    habit_id: str,
    start_date: Optional[date] = Query(None, description="Filter logs from this date"),
    end_date: Optional[date] = Query(None, description="Filter logs until this date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    db: Session = Depends(get_db)
):
    """
    Get completion logs for a habit
    
    Args:
        habit_id: The unique identifier for the habit
        start_date: Filter logs from this date (optional)
        end_date: Filter logs until this date (optional)
        limit: Maximum number of logs to return
        db: Database session (automatically injected)
        
    Returns:
        List[HabitLogResponse]: Array of completion logs
        
    Example Request:
        GET /habits/123.../logs?start_date=2024-01-01&end_date=2024-01-31
        
    Example Response:
        [
            {
                "id": "log-123...",
                "habit_id": "123...",
                "completed_date": "2024-01-10",
                "count": 1,
                "notes": "Great workout!",
                "created_at": "2024-01-10T15:30:00"
            },
            ...
        ]
    """
    try:
        service = HabitService(db)
        
        # Verify habit exists
        habit = service.get_habit_by_id(habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        logs = service.get_habit_logs(
            habit_id=habit_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        
        return logs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")


@router.get("/{habit_id}/stats", response_model=HabitStatistics)
def get_habit_statistics(
    habit_id: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for a habit
    
    Provides insights like:
    - Total completions
    - Completion rate (percentage)
    - Current and longest streaks
    - Days since creation
    - Last completion date
    
    Args:
        habit_id: The unique identifier for the habit
        db: Database session (automatically injected)
        
    Returns:
        HabitStatistics: Comprehensive habit analytics
        
    Raises:
        HTTPException 404: If habit is not found
        
    Example Request:
        GET /habits/123e4567-e89b-12d3-a456-426614174000/stats
        
    Example Response:
        {
            "habit_id": "123...",
            "habit_name": "Morning Exercise",
            "total_completions": 25,
            "completion_rate": 83.33,
            "current_streak": 5,
            "longest_streak": 12,
            "days_since_creation": 30,
            "last_completed": "2024-01-10"
        }
    """
    try:
        service = HabitService(db)
        stats = service.get_habit_statistics(habit_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/stats/summary")
def get_all_habits_statistics(db: Session = Depends(get_db)):
    """
    Get overall statistics for all habits
    
    Provides a dashboard-style overview:
    - Total number of habits
    - How many are currently active (have streaks)
    - Total completions across all habits
    - Best current streak among all habits
    
    Returns:
        Dictionary with overall habit statistics
        
    Example Request:
        GET /habits/stats/summary
        
    Example Response:
        {
            "total_habits": 5,
            "active_habits": 3,
            "total_completions": 127,
            "best_current_streak": 12
        }
    """
    try:
        service = HabitService(db)
        stats = service.get_all_habits_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


# Summary of all habit endpoints:
"""
POST   /habits              - Create a new habit
GET    /habits              - Get all habits (with filtering)
GET    /habits/{id}         - Get a specific habit
PUT    /habits/{id}         - Update a habit
DELETE /habits/{id}         - Delete a habit
POST   /habits/{id}/logs    - Log habit completion (mark as done)
GET    /habits/{id}/logs    - Get completion history
GET    /habits/{id}/stats   - Get habit statistics
GET    /habits/stats/summary - Get overall statistics

These endpoints provide complete habit tracking functionality with streak calculation!
"""