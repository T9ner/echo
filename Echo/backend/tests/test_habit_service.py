"""
Unit Tests for Habit Service

These tests verify that our HabitService works correctly:
1. Creating habits saves them properly
2. Logging completions works
3. Streak calculation algorithms are correct
4. Statistics are accurate
5. Business logic handles edge cases

The streak calculation is the most complex part to test!
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, timedelta

from app.core.database import Base
from app.services.habit_service import HabitService
from app.schemas.habit import HabitCreate, HabitUpdate, HabitLogCreate
from app.models.enums import HabitFrequency


# Create in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///./test_habits.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def habit_service(db_session):
    """Create a HabitService instance for testing"""
    return HabitService(db_session)


@pytest.fixture
def sample_habit_data():
    """Sample habit data for testing"""
    return HabitCreate(
        name="Morning Exercise",
        description="30 minutes of cardio",
        frequency=HabitFrequency.DAILY,
        target_count=1
    )


class TestHabitService:
    """Test class for HabitService functionality"""
    
    def test_create_habit(self, habit_service, sample_habit_data):
        """
        Test creating a new habit
        
        Verifies:
        - Habit is saved to database
        - ID is generated
        - Streaks start at 0
        - All fields are correct
        """
        created_habit = habit_service.create_habit(sample_habit_data)
        
        assert created_habit.id is not None
        assert created_habit.name == sample_habit_data.name
        assert created_habit.description == sample_habit_data.description
        assert created_habit.frequency == sample_habit_data.frequency
        assert created_habit.target_count == sample_habit_data.target_count
        assert created_habit.current_streak == 0  # Starts with no streak
        assert created_habit.longest_streak == 0  # No best streak yet
        assert created_habit.created_at is not None
        assert created_habit.updated_at is not None
    
    def test_get_habit_by_id(self, habit_service, sample_habit_data):
        """Test getting a habit by its ID"""
        created_habit = habit_service.create_habit(sample_habit_data)
        
        found_habit = habit_service.get_habit_by_id(created_habit.id)
        assert found_habit is not None
        assert found_habit.id == created_habit.id
        assert found_habit.name == created_habit.name
        
        # Test finding non-existent habit
        non_existent = habit_service.get_habit_by_id("non-existent-id")
        assert non_existent is None
    
    def test_get_all_habits(self, habit_service):
        """Test getting all habits with filtering"""
        # Create multiple habits
        daily_habit = habit_service.create_habit(HabitCreate(
            name="Daily Exercise",
            frequency=HabitFrequency.DAILY
        ))
        
        weekly_habit = habit_service.create_habit(HabitCreate(
            name="Weekly Grocery Shopping",
            frequency=HabitFrequency.WEEKLY
        ))
        
        # Test getting all habits
        all_habits = habit_service.get_all_habits()
        assert len(all_habits) == 2
        
        # Test filtering by frequency
        daily_habits = habit_service.get_all_habits(frequency=HabitFrequency.DAILY)
        assert len(daily_habits) == 1
        assert daily_habits[0].name == "Daily Exercise"
        
        weekly_habits = habit_service.get_all_habits(frequency=HabitFrequency.WEEKLY)
        assert len(weekly_habits) == 1
        assert weekly_habits[0].name == "Weekly Grocery Shopping"
    
    def test_update_habit(self, habit_service, sample_habit_data):
        """Test updating an existing habit"""
        created_habit = habit_service.create_habit(sample_habit_data)
        
        update_data = HabitUpdate(
            name="Updated Exercise",
            target_count=2
        )
        
        updated_habit = habit_service.update_habit(created_habit.id, update_data)
        assert updated_habit is not None
        assert updated_habit.name == "Updated Exercise"
        assert updated_habit.target_count == 2
        assert updated_habit.description == sample_habit_data.description  # Unchanged
        
        # Test updating non-existent habit
        result = habit_service.update_habit("non-existent-id", update_data)
        assert result is None
    
    def test_delete_habit(self, habit_service, sample_habit_data):
        """Test deleting a habit"""
        created_habit = habit_service.create_habit(sample_habit_data)
        habit_id = created_habit.id
        
        # Verify habit exists
        assert habit_service.get_habit_by_id(habit_id) is not None
        
        # Delete the habit
        success = habit_service.delete_habit(habit_id)
        assert success is True
        
        # Verify habit is gone
        assert habit_service.get_habit_by_id(habit_id) is None
        
        # Test deleting non-existent habit
        success = habit_service.delete_habit("non-existent-id")
        assert success is False
    
    def test_log_habit_completion(self, habit_service, sample_habit_data):
        """
        Test logging habit completions
        
        Verifies:
        - Completion is saved
        - Streaks are updated
        - Duplicate dates are handled
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log first completion
        log_data = HabitLogCreate(
            habit_id=habit.id,
            completed_date=date.today(),
            count=1,
            notes="First completion!"
        )
        
        log = habit_service.log_habit_completion(log_data)
        assert log is not None
        assert log.habit_id == habit.id
        assert log.completed_date == date.today()
        assert log.count == 1
        assert log.notes == "First completion!"
        
        # Check that habit streak was updated
        updated_habit = habit_service.get_habit_by_id(habit.id)
        assert updated_habit.current_streak == 1
        assert updated_habit.longest_streak == 1
        
        # Test logging for non-existent habit
        bad_log = HabitLogCreate(
            habit_id="non-existent-id",
            completed_date=date.today(),
            count=1
        )
        result = habit_service.log_habit_completion(bad_log)
        assert result is None
    
    def test_streak_calculation_consecutive_days(self, habit_service, sample_habit_data):
        """
        Test streak calculation with consecutive days
        
        This is the core algorithm test!
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log completions for 5 consecutive days ending today
        for i in range(4, -1, -1):  # 4 days ago to today
            completion_date = date.today() - timedelta(days=i)
            log_data = HabitLogCreate(
                habit_id=habit.id,
                completed_date=completion_date,
                count=1
            )
            habit_service.log_habit_completion(log_data)
        
        # Check streak
        updated_habit = habit_service.get_habit_by_id(habit.id)
        assert updated_habit.current_streak == 5
        assert updated_habit.longest_streak == 5
    
    def test_streak_calculation_with_gap(self, habit_service, sample_habit_data):
        """
        Test streak calculation when there's a gap
        
        Verifies:
        - Current streak resets after gap
        - Longest streak is preserved
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log completions for 3 days, then skip a day, then 2 more days
        # Days: [today-5, today-4, today-3, SKIP today-2, today-1, today]
        
        # First streak: 3 days
        for i in range(5, 2, -1):  # 5, 4, 3 days ago
            completion_date = date.today() - timedelta(days=i)
            log_data = HabitLogCreate(
                habit_id=habit.id,
                completed_date=completion_date,
                count=1
            )
            habit_service.log_habit_completion(log_data)
        
        # Skip day (today-2)
        
        # Second streak: 2 days (yesterday and today)
        for i in range(1, -1, -1):  # 1 day ago and today
            completion_date = date.today() - timedelta(days=i)
            log_data = HabitLogCreate(
                habit_id=habit.id,
                completed_date=completion_date,
                count=1
            )
            habit_service.log_habit_completion(log_data)
        
        # Check streaks
        updated_habit = habit_service.get_habit_by_id(habit.id)
        assert updated_habit.current_streak == 2  # Current streak from yesterday-today
        assert updated_habit.longest_streak == 3  # Best streak was the first 3 days
    
    def test_streak_calculation_no_recent_activity(self, habit_service, sample_habit_data):
        """
        Test streak when last completion was not recent
        
        If last completion was 3 days ago, current streak should be 0
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log completion 3 days ago
        old_date = date.today() - timedelta(days=3)
        log_data = HabitLogCreate(
            habit_id=habit.id,
            completed_date=old_date,
            count=1
        )
        habit_service.log_habit_completion(log_data)
        
        # Check streak
        updated_habit = habit_service.get_habit_by_id(habit.id)
        assert updated_habit.current_streak == 0  # No recent activity
        assert updated_habit.longest_streak == 1  # But we did complete it once
    
    def test_get_habit_logs(self, habit_service, sample_habit_data):
        """Test getting habit completion logs"""
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log several completions
        for i in range(3):
            completion_date = date.today() - timedelta(days=i)
            log_data = HabitLogCreate(
                habit_id=habit.id,
                completed_date=completion_date,
                count=1,
                notes=f"Day {i+1}"
            )
            habit_service.log_habit_completion(log_data)
        
        # Get all logs
        logs = habit_service.get_habit_logs(habit.id)
        assert len(logs) == 3
        
        # Test date filtering
        yesterday = date.today() - timedelta(days=1)
        recent_logs = habit_service.get_habit_logs(
            habit.id,
            start_date=yesterday
        )
        assert len(recent_logs) == 2  # Yesterday and today
    
    def test_get_habit_statistics(self, habit_service, sample_habit_data):
        """
        Test habit statistics calculation
        
        Verifies:
        - Total completions count
        - Completion rate calculation
        - Streak information
        - Days since creation
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log completion for today only (since habit was just created)
        log_data = HabitLogCreate(
            habit_id=habit.id,
            completed_date=date.today(),
            count=1
        )
        habit_service.log_habit_completion(log_data)
        
        # Get statistics
        stats = habit_service.get_habit_statistics(habit.id)
        
        assert stats is not None
        assert stats["habit_id"] == habit.id
        assert stats["habit_name"] == habit.name
        assert stats["total_completions"] == 1
        assert stats["current_streak"] == 1
        assert stats["last_completed"] == date.today()
        
        # Completion rate should be 100% (1 completion on day 1)
        assert stats["completion_rate"] == 100.0
    
    def test_get_all_habits_statistics(self, habit_service):
        """Test overall habit statistics"""
        # Create multiple habits
        habit1 = habit_service.create_habit(HabitCreate(
            name="Exercise",
            frequency=HabitFrequency.DAILY
        ))
        
        habit2 = habit_service.create_habit(HabitCreate(
            name="Reading",
            frequency=HabitFrequency.DAILY
        ))
        
        # Log completions for both habits
        for habit in [habit1, habit2]:
            log_data = HabitLogCreate(
                habit_id=habit.id,
                completed_date=date.today(),
                count=1
            )
            habit_service.log_habit_completion(log_data)
        
        # Get overall statistics
        stats = habit_service.get_all_habits_statistics()
        
        assert stats["total_habits"] == 2
        assert stats["active_habits"] == 2  # Both have streaks
        assert stats["total_completions"] == 2
        assert stats["best_current_streak"] == 1
    
    def test_duplicate_completion_handling(self, habit_service, sample_habit_data):
        """
        Test that logging the same date twice updates the existing log
        """
        habit = habit_service.create_habit(sample_habit_data)
        
        # Log first completion
        log_data = HabitLogCreate(
            habit_id=habit.id,
            completed_date=date.today(),
            count=1,
            notes="First log"
        )
        first_log = habit_service.log_habit_completion(log_data)
        
        # Log same date again with different data
        log_data_update = HabitLogCreate(
            habit_id=habit.id,
            completed_date=date.today(),
            count=2,
            notes="Updated log"
        )
        updated_log = habit_service.log_habit_completion(log_data_update)
        
        # Should be the same log, just updated
        assert updated_log.id == first_log.id
        assert updated_log.count == 2
        assert updated_log.notes == "Updated log"
        
        # Should only have one log for today
        logs = habit_service.get_habit_logs(habit.id)
        assert len(logs) == 1


# How to run these tests:
"""
1. Run tests: pytest tests/test_habit_service.py -v
2. See detailed output with explanations

These tests ensure your habit tracking and streak calculation
algorithms work correctly and handle all edge cases!
"""