"""
Task Service Layer - Business Logic

This is the "brain" of task management. It handles:
1. Creating tasks in the database
2. Finding tasks by ID or filters
3. Updating task information
4. Deleting tasks
5. Business rules (like setting completed_at when status changes)

Think of this as your personal assistant that knows how to manage tasks!
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime

from app.models.task import Task
from app.models.enums import TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    """
    Task Service - handles all task-related business logic
    
    This class contains all the functions needed to manage tasks.
    Each function does ONE specific thing (single responsibility principle).
    """
    
    def __init__(self, db: Session):
        """
        Initialize the service with a database session
        
        Args:
            db: Database session for running queries
        """
        self.db = db
    
    def create_task(self, task_data: TaskCreate) -> Task:
        """
        Create a new task in the database
        
        Steps:
        1. Convert Pydantic schema to SQLAlchemy model
        2. Save to database
        3. Return the created task
        
        Args:
            task_data: TaskCreate schema with task information
            
        Returns:
            Task: The newly created task with ID and timestamps
            
        Example:
            task_data = TaskCreate(title="Buy groceries", priority="high")
            new_task = service.create_task(task_data)
            print(new_task.id)  # "123e4567-e89b-12d3-a456-426614174000"
        """
        # Convert Pydantic model to SQLAlchemy model
        db_task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            due_date=task_data.due_date
        )
        
        # Save to database
        self.db.add(db_task)           # Add to session
        self.db.commit()               # Save to database
        self.db.refresh(db_task)       # Get the ID and timestamps back
        
        return db_task
    
    def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """
        Find a task by its unique ID
        
        Args:
            task_id: The unique identifier for the task
            
        Returns:
            Task if found, None if not found
            
        Example:
            task = service.get_task_by_id("123e4567-e89b-12d3-a456-426614174000")
            if task:
                print(f"Found: {task.title}")
            else:
                print("Task not found")
        """
        return self.db.query(Task).filter(Task.id == task_id).first()
    
    def get_all_tasks(
        self, 
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Task]:
        """
        Get all tasks with optional filtering
        
        This is like a smart search function that can:
        - Get all tasks
        - Filter by status (only completed tasks)
        - Filter by priority (only high priority)
        - Paginate results (get 10 tasks at a time)
        
        Args:
            status: Filter by task status (optional)
            priority: Filter by task priority (optional)
            limit: Maximum number of tasks to return
            offset: Number of tasks to skip (for pagination)
            
        Returns:
            List of tasks matching the criteria
            
        Examples:
            # Get all tasks
            all_tasks = service.get_all_tasks()
            
            # Get only completed tasks
            completed = service.get_all_tasks(status=TaskStatus.COMPLETED)
            
            # Get high priority tasks
            urgent = service.get_all_tasks(priority=TaskPriority.HIGH)
            
            # Get first 10 tasks (pagination)
            first_page = service.get_all_tasks(limit=10, offset=0)
        """
        query = self.db.query(Task)
        
        # Apply filters if provided
        if status:
            query = query.filter(Task.status == status)
        
        if priority:
            query = query.filter(Task.priority == priority)
        
        # Apply pagination and ordering
        query = query.order_by(Task.created_at.desc())  # Newest first
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def update_task(self, task_id: str, task_update: TaskUpdate) -> Optional[Task]:
        """
        Update an existing task
        
        This function:
        1. Finds the task by ID
        2. Updates only the fields that were provided
        3. Handles special business logic (like setting completed_at)
        4. Saves changes to database
        
        Args:
            task_id: ID of the task to update
            task_update: TaskUpdate schema with new values
            
        Returns:
            Updated task if found, None if not found
            
        Example:
            # Mark task as completed
            update_data = TaskUpdate(status=TaskStatus.COMPLETED)
            updated_task = service.update_task("123...", update_data)
        """
        # Find the task
        db_task = self.get_task_by_id(task_id)
        if not db_task:
            return None
        
        # Update only the fields that were provided
        update_data = task_update.model_dump(exclude_unset=True)  # Only changed fields
        
        for field, value in update_data.items():
            setattr(db_task, field, value)  # Update the field
        
        # Business logic: Set completed_at when status changes to completed
        if task_update.status == TaskStatus.COMPLETED and db_task.completed_at is None:
            db_task.completed_at = datetime.now()
        elif task_update.status and task_update.status != TaskStatus.COMPLETED:
            db_task.completed_at = None  # Clear completion time if not completed
        
        # Save changes
        self.db.commit()
        self.db.refresh(db_task)
        
        return db_task
    
    def delete_task(self, task_id: str) -> bool:
        """
        Delete a task from the database
        
        Args:
            task_id: ID of the task to delete
            
        Returns:
            True if deleted successfully, False if task not found
            
        Example:
            success = service.delete_task("123e4567-e89b-12d3-a456-426614174000")
            if success:
                print("Task deleted!")
            else:
                print("Task not found")
        """
        db_task = self.get_task_by_id(task_id)
        if not db_task:
            return False
        
        self.db.delete(db_task)
        self.db.commit()
        return True
    
    def get_task_statistics(self) -> dict:
        """
        Get statistics about tasks
        
        This provides useful insights like:
        - Total number of tasks
        - How many are completed
        - How many are overdue
        
        Returns:
            Dictionary with task statistics
            
        Example:
            stats = service.get_task_statistics()
            print(f"Total tasks: {stats['total']}")
            print(f"Completed: {stats['completed']}")
        """
        total_tasks = self.db.query(Task).count()
        completed_tasks = self.db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
        pending_tasks = total_tasks - completed_tasks
        
        # Count overdue tasks (due_date is in the past and not completed)
        now = datetime.now()
        overdue_tasks = self.db.query(Task).filter(
            and_(
                Task.due_date < now,
                Task.status != TaskStatus.COMPLETED
            )
        ).count()
        
        return {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": pending_tasks,
            "overdue": overdue_tasks
        }


# Example of how this service is used:
"""
# In an API endpoint:
def create_task_endpoint(task_data: TaskCreate, db: Session):
    service = TaskService(db)
    new_task = service.create_task(task_data)
    return new_task

# The service handles all the database complexity,
# so the API endpoint stays simple and clean!
"""