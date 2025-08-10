"""
Task API Endpoints - The Interface Your Frontend Uses

These are the URLs your React frontend will call:
- GET /tasks - Get all tasks
- POST /tasks - Create a new task  
- GET /tasks/{id} - Get one specific task
- PUT /tasks/{id} - Update a task
- DELETE /tasks/{id} - Delete a task

Think of these as the "buttons" your frontend can press!
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.services.task_service import TaskService
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.models.enums import TaskStatus, TaskPriority
from app.core.performance import performance_monitor, track_api_call

# Create router - this groups all task-related endpoints
router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task
    
    This endpoint handles POST requests to /tasks
    
    What happens:
    1. User sends task data: {"title": "Buy groceries", "priority": "high"}
    2. FastAPI validates the data using TaskCreate schema
    3. We create a TaskService instance
    4. Service saves the task to PostgreSQL
    5. We return the created task with ID and timestamps
    
    Args:
        task_data: TaskCreate schema with task information
        db: Database session (automatically injected)
        
    Returns:
        TaskResponse: The created task with all details
        
    Example Request:
        POST /tasks
        {
            "title": "Buy groceries",
            "description": "Get milk, bread, eggs",
            "priority": "high",
            "due_date": "2024-01-15T10:00:00"
        }
        
    Example Response:
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
    try:
        service = TaskService(db)
        new_task = service.create_task(task_data)
        return new_task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


@router.get("/", response_model=List[TaskResponse])
@performance_monitor(slow_threshold=0.5)
@track_api_call
def get_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by task priority"),
    search: Optional[str] = Query(None, description="Search in task title and description"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of tasks to return"),
    offset: int = Query(0, ge=0, description="Number of tasks to skip"),
    db: Session = Depends(get_db)
):
    """
    Get all tasks with optional filtering
    
    This endpoint handles GET requests to /tasks
    
    What happens:
    1. User requests tasks: GET /tasks?status=completed&limit=10
    2. We parse the query parameters (filters)
    3. TaskService queries PostgreSQL with filters
    4. We return the list of matching tasks
    
    Query Parameters:
        status: Filter by status (todo, in_progress, completed, cancelled)
        priority: Filter by priority (low, medium, high, urgent)
        limit: How many tasks to return (default: 100, max: 1000)
        offset: How many to skip for pagination (default: 0)
        
    Returns:
        List[TaskResponse]: Array of tasks matching the criteria
        
    Example Requests:
        GET /tasks - Get all tasks
        GET /tasks?status=completed - Get only completed tasks
        GET /tasks?priority=high&limit=5 - Get 5 high-priority tasks
        GET /tasks?offset=10&limit=10 - Get tasks 11-20 (pagination)
        
    Example Response:
        [
            {
                "id": "123...",
                "title": "Buy groceries",
                "status": "completed",
                ...
            },
            {
                "id": "456...",
                "title": "Walk the dog", 
                "status": "todo",
                ...
            }
        ]
    """
    try:
        service = TaskService(db)
        tasks = service.get_all_tasks(
            status=status,
            priority=priority,
            search=search,
            limit=limit,
            offset=offset
        )
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific task by ID
    
    This endpoint handles GET requests to /tasks/{id}
    
    What happens:
    1. User requests specific task: GET /tasks/123e4567-e89b-12d3-a456-426614174000
    2. We extract the task_id from the URL
    3. TaskService looks up the task in PostgreSQL
    4. We return the task or 404 if not found
    
    Args:
        task_id: The unique identifier for the task
        db: Database session (automatically injected)
        
    Returns:
        TaskResponse: The requested task
        
    Raises:
        HTTPException 404: If task is not found
        
    Example Request:
        GET /tasks/123e4567-e89b-12d3-a456-426614174000
        
    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "title": "Buy groceries",
            "status": "todo",
            ...
        }
    """
    try:
        service = TaskService(db)
        task = service.get_task_by_id(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return task
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_update: TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing task
    
    This endpoint handles PUT requests to /tasks/{id}
    
    What happens:
    1. User sends update: PUT /tasks/123... {"status": "completed"}
    2. FastAPI validates the data using TaskUpdate schema
    3. TaskService finds the task and updates it
    4. Business logic runs (like setting completed_at)
    5. We return the updated task
    
    Args:
        task_id: The unique identifier for the task
        task_update: TaskUpdate schema with new values
        db: Database session (automatically injected)
        
    Returns:
        TaskResponse: The updated task
        
    Raises:
        HTTPException 404: If task is not found
        
    Example Request:
        PUT /tasks/123e4567-e89b-12d3-a456-426614174000
        {
            "status": "completed",
            "description": "Updated description"
        }
        
    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "title": "Buy groceries",
            "status": "completed",
            "completed_at": "2024-01-10T15:30:00",
            ...
        }
    """
    try:
        service = TaskService(db)
        updated_task = service.update_task(task_id, task_update)
        
        if not updated_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return updated_task
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a task
    
    This endpoint handles DELETE requests to /tasks/{id}
    
    What happens:
    1. User requests deletion: DELETE /tasks/123...
    2. TaskService finds and deletes the task from PostgreSQL
    3. We return 204 No Content (successful deletion)
    
    Args:
        task_id: The unique identifier for the task
        db: Database session (automatically injected)
        
    Returns:
        None (204 No Content status)
        
    Raises:
        HTTPException 404: If task is not found
        
    Example Request:
        DELETE /tasks/123e4567-e89b-12d3-a456-426614174000
        
    Example Response:
        (Empty response with 204 status code)
    """
    try:
        service = TaskService(db)
        success = service.delete_task(task_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Return 204 No Content (successful deletion)
        return None
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")


@router.get("/stats/summary")
def get_task_statistics(db: Session = Depends(get_db)):
    """
    Get task statistics
    
    This endpoint provides useful insights about tasks:
    - Total number of tasks
    - How many are completed
    - How many are pending
    - How many are overdue
    
    Returns:
        Dictionary with task statistics
        
    Example Request:
        GET /tasks/stats/summary
        
    Example Response:
        {
            "total": 25,
            "completed": 10,
            "pending": 15,
            "overdue": 3
        }
    """
    try:
        service = TaskService(db)
        stats = service.get_task_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


# Summary of all endpoints:
"""
POST   /tasks           - Create a new task
GET    /tasks           - Get all tasks (with filtering)
GET    /tasks/{id}      - Get a specific task
PUT    /tasks/{id}      - Update a task
DELETE /tasks/{id}      - Delete a task
GET    /tasks/stats/summary - Get task statistics

These endpoints provide complete CRUD functionality for task management!
"""