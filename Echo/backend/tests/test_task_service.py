"""
Unit Tests for Task Service

These tests verify that our TaskService works correctly:
1. Creating tasks saves them to database
2. Getting tasks returns the right data
3. Updating tasks changes the right fields
4. Deleting tasks removes them
5. Business logic works (like setting completed_at)

Think of these as a robot that automatically tests your code!
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.core.database import Base
from app.services.task_service import TaskService
from app.schemas.task import TaskCreate, TaskUpdate
from app.models.enums import TaskStatus, TaskPriority


# Create in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """
    Create a fresh database for each test
    
    This ensures tests don't interfere with each other.
    Each test gets a clean database to work with.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Clean up - drop all tables
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def task_service(db_session):
    """Create a TaskService instance for testing"""
    return TaskService(db_session)


@pytest.fixture
def sample_task_data():
    """Sample task data for testing"""
    return TaskCreate(
        title="Test Task",
        description="This is a test task",
        priority=TaskPriority.HIGH,
        due_date=datetime.now() + timedelta(days=1)
    )


class TestTaskService:
    """Test class for TaskService functionality"""
    
    def test_create_task(self, task_service, sample_task_data):
        """
        Test creating a new task
        
        Verifies:
        - Task is saved to database
        - ID is generated
        - Timestamps are set
        - All fields are correct
        """
        # Create the task
        created_task = task_service.create_task(sample_task_data)
        
        # Verify the task was created correctly
        assert created_task.id is not None
        assert created_task.title == sample_task_data.title
        assert created_task.description == sample_task_data.description
        assert created_task.status == TaskStatus.TODO  # Default status
        assert created_task.priority == sample_task_data.priority
        assert created_task.due_date == sample_task_data.due_date
        assert created_task.created_at is not None
        assert created_task.updated_at is not None
        assert created_task.completed_at is None  # Not completed yet
    
    def test_get_task_by_id(self, task_service, sample_task_data):
        """
        Test getting a task by its ID
        
        Verifies:
        - Can find existing task
        - Returns None for non-existent task
        """
        # Create a task first
        created_task = task_service.create_task(sample_task_data)
        
        # Test finding the task
        found_task = task_service.get_task_by_id(created_task.id)
        assert found_task is not None
        assert found_task.id == created_task.id
        assert found_task.title == created_task.title
        
        # Test finding non-existent task
        non_existent = task_service.get_task_by_id("non-existent-id")
        assert non_existent is None
    
    def test_get_all_tasks(self, task_service):
        """
        Test getting all tasks with filtering
        
        Verifies:
        - Returns all tasks when no filters
        - Filters by status work
        - Filters by priority work
        - Pagination works
        """
        # Create multiple tasks with different properties
        task1 = task_service.create_task(TaskCreate(
            title="High Priority Task",
            priority=TaskPriority.HIGH,
            status=TaskStatus.TODO
        ))
        
        task2 = task_service.create_task(TaskCreate(
            title="Completed Task",
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.COMPLETED
        ))
        
        task3 = task_service.create_task(TaskCreate(
            title="Low Priority Task",
            priority=TaskPriority.LOW,
            status=TaskStatus.TODO
        ))
        
        # Test getting all tasks
        all_tasks = task_service.get_all_tasks()
        assert len(all_tasks) == 3
        
        # Test filtering by status
        todo_tasks = task_service.get_all_tasks(status=TaskStatus.TODO)
        assert len(todo_tasks) == 2
        
        completed_tasks = task_service.get_all_tasks(status=TaskStatus.COMPLETED)
        assert len(completed_tasks) == 1
        
        # Test filtering by priority
        high_priority = task_service.get_all_tasks(priority=TaskPriority.HIGH)
        assert len(high_priority) == 1
        assert high_priority[0].title == "High Priority Task"
        
        # Test pagination
        first_page = task_service.get_all_tasks(limit=2, offset=0)
        assert len(first_page) == 2
        
        second_page = task_service.get_all_tasks(limit=2, offset=2)
        assert len(second_page) == 1
    
    def test_update_task(self, task_service, sample_task_data):
        """
        Test updating an existing task
        
        Verifies:
        - Can update individual fields
        - Business logic works (completed_at)
        - Returns None for non-existent task
        """
        # Create a task first
        created_task = task_service.create_task(sample_task_data)
        original_updated_at = created_task.updated_at
        
        # Test updating title and description
        update_data = TaskUpdate(
            title="Updated Title",
            description="Updated description"
        )
        
        updated_task = task_service.update_task(created_task.id, update_data)
        assert updated_task is not None
        assert updated_task.title == "Updated Title"
        assert updated_task.description == "Updated description"
        assert updated_task.status == TaskStatus.TODO  # Unchanged
        assert updated_task.updated_at >= original_updated_at  # Allow same timestamp
        
        # Test marking as completed (business logic)
        completion_update = TaskUpdate(status=TaskStatus.COMPLETED)
        completed_task = task_service.update_task(created_task.id, completion_update)
        
        assert completed_task.status == TaskStatus.COMPLETED
        assert completed_task.completed_at is not None
        
        # Test updating non-existent task
        result = task_service.update_task("non-existent-id", update_data)
        assert result is None
    
    def test_delete_task(self, task_service, sample_task_data):
        """
        Test deleting a task
        
        Verifies:
        - Can delete existing task
        - Returns False for non-existent task
        - Task is actually removed from database
        """
        # Create a task first
        created_task = task_service.create_task(sample_task_data)
        task_id = created_task.id
        
        # Verify task exists
        assert task_service.get_task_by_id(task_id) is not None
        
        # Delete the task
        success = task_service.delete_task(task_id)
        assert success is True
        
        # Verify task is gone
        assert task_service.get_task_by_id(task_id) is None
        
        # Test deleting non-existent task
        success = task_service.delete_task("non-existent-id")
        assert success is False
    
    def test_get_task_statistics(self, task_service):
        """
        Test getting task statistics
        
        Verifies:
        - Counts are correct
        - Overdue calculation works
        """
        # Create tasks with different statuses and due dates
        # Completed task
        task_service.create_task(TaskCreate(
            title="Completed Task",
            status=TaskStatus.COMPLETED
        ))
        
        # Pending task (not overdue)
        task_service.create_task(TaskCreate(
            title="Future Task",
            due_date=datetime.now() + timedelta(days=1)
        ))
        
        # Overdue task
        task_service.create_task(TaskCreate(
            title="Overdue Task",
            due_date=datetime.now() - timedelta(days=1)
        ))
        
        # Get statistics
        stats = task_service.get_task_statistics()
        
        assert stats["total"] == 3
        assert stats["completed"] == 1
        assert stats["pending"] == 2
        assert stats["overdue"] == 1
    
    def test_business_logic_completed_at(self, task_service, sample_task_data):
        """
        Test business logic for completed_at timestamp
        
        Verifies:
        - completed_at is set when status changes to completed
        - completed_at is cleared when status changes from completed
        """
        # Create a task
        task = task_service.create_task(sample_task_data)
        assert task.completed_at is None
        
        # Mark as completed
        update = TaskUpdate(status=TaskStatus.COMPLETED)
        completed_task = task_service.update_task(task.id, update)
        assert completed_task.completed_at is not None
        
        # Change back to todo
        update = TaskUpdate(status=TaskStatus.TODO)
        todo_task = task_service.update_task(task.id, update)
        assert todo_task.completed_at is None


# How to run these tests:
"""
1. Install pytest: pip install pytest
2. Run tests: pytest tests/test_task_service.py -v
3. See detailed output with explanations

These tests ensure your TaskService works correctly
and catches bugs before they reach users!
"""