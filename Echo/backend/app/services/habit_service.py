"""
Habit Service Layer - Business Logic for Habit Tracking

This is the "brain" of habit tracking. It handles:
1. Creating and managing habits
2. Logging habit completions
3. Calculating streaks (the smart part!)
4. Generating statistics and insights
5. Business rules for habit tracking

Think of this as your personal habit coach that tracks everything!
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta

from app.models.habit import Habit, HabitLog
from app.models.enums import HabitFrequency
from app.schemas.habit import HabitCreate, HabitUpdate, HabitLogCreate, HabitLogUpdate


class HabitService:
    """
    Habit Service - handles all habit-related business logic
    
    This class contains the intelligence for habit tracking,
    including the complex streak calculation algorithms.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the service with a database session
        
        Args:
            db: Database session for running queries
        """
        self.db = db
    
    def create_habit(self, habit_data: HabitCreate) -> Habit:
        """
        Create a new habit
        
        Steps:
        1. Convert Pydantic schema to SQLAlchemy model
        2. Initialize streak counters to 0
        3. Save to database
        4. Return the created habit
        
        Args:
            habit_data: HabitCreate schema with habit information
            
        Returns:
            Habit: The newly created habit
            
        Example:
            habit_data = HabitCreate(name="Exercise", frequency="daily")
            new_habit = service.create_habit(habit_data)
        """
        db_habit = Habit(
            name=habit_data.name,
            description=habit_data.description,
            frequency=habit_data.frequency,
            target_count=habit_data.target_count,
            current_streak=0,  # Start with no streak
            longest_streak=0   # No best streak yet
        )
        
        self.db.add(db_habit)
        self.db.commit()
        self.db.refresh(db_habit)
        
        return db_habit
    
    def get_habit_by_id(self, habit_id: str) -> Optional[Habit]:
        """
        Find a habit by its unique ID
        
        Args:
            habit_id: The unique identifier for the habit
            
        Returns:
            Habit if found, None if not found
        """
        return self.db.query(Habit).filter(Habit.id == habit_id).first()
    
    def get_all_habits(
        self,
        frequency: Optional[HabitFrequency] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Habit]:
        """
        Get all habits with optional filtering
        
        Args:
            frequency: Filter by habit frequency (optional)
            limit: Maximum number of habits to return
            offset: Number of habits to skip (for pagination)
            
        Returns:
            List of habits matching the criteria
            
        Examples:
            # Get all habits
            all_habits = service.get_all_habits()
            
            # Get only daily habits
            daily_habits = service.get_all_habits(frequency=HabitFrequency.DAILY)
        """
        query = self.db.query(Habit)
        
        # Apply filters if provided
        if frequency:
            query = query.filter(Habit.frequency == frequency)
        
        # Apply pagination and ordering
        query = query.order_by(Habit.created_at.desc())  # Newest first
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def update_habit(self, habit_id: str, habit_update: HabitUpdate) -> Optional[Habit]:
        """
        Update an existing habit
        
        Args:
            habit_id: ID of the habit to update
            habit_update: HabitUpdate schema with new values
            
        Returns:
            Updated habit if found, None if not found
        """
        db_habit = self.get_habit_by_id(habit_id)
        if not db_habit:
            return None
        
        # Update only the fields that were provided
        update_data = habit_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_habit, field, value)
        
        self.db.commit()
        self.db.refresh(db_habit)
        
        return db_habit
    
    def delete_habit(self, habit_id: str) -> bool:
        """
        Delete a habit and all its logs
        
        Args:
            habit_id: ID of the habit to delete
            
        Returns:
            True if deleted successfully, False if habit not found
        """
        db_habit = self.get_habit_by_id(habit_id)
        if not db_habit:
            return False
        
        # Delete all habit logs first (cascade delete)
        self.db.query(HabitLog).filter(HabitLog.habit_id == habit_id).delete()
        
        # Delete the habit
        self.db.delete(db_habit)
        self.db.commit()
        return True
    
    def log_habit_completion(self, log_data: HabitLogCreate) -> Optional[HabitLog]:
        """
        Log a habit completion and update streaks
        
        This is the core function that:
        1. Records the completion
        2. Recalculates streaks
        3. Updates the habit's streak counters
        
        Args:
            log_data: HabitLogCreate schema with completion info
            
        Returns:
            HabitLog if successful, None if habit not found
            
        Example:
            log_data = HabitLogCreate(
                habit_id="123...",
                completed_date=date.today(),
                count=1,
                notes="Great workout!"
            )
            log = service.log_habit_completion(log_data)
        """
        # Check if habit exists
        habit = self.get_habit_by_id(log_data.habit_id)
        if not habit:
            return None
        
        # Check if already logged for this date
        existing_log = self.db.query(HabitLog).filter(
            and_(
                HabitLog.habit_id == log_data.habit_id,
                HabitLog.completed_date == log_data.completed_date
            )
        ).first()
        
        if existing_log:
            # Update existing log
            existing_log.count = log_data.count
            existing_log.notes = log_data.notes
            log = existing_log
        else:
            # Create new log
            log = HabitLog(
                habit_id=log_data.habit_id,
                completed_date=log_data.completed_date,
                count=log_data.count,
                notes=log_data.notes
            )
            self.db.add(log)
        
        self.db.commit()
        self.db.refresh(log)
        
        # Recalculate and update streaks
        self._update_habit_streaks(habit)
        
        return log
    
    def _update_habit_streaks(self, habit: Habit) -> None:
        """
        Calculate and update habit streaks
        
        This is the complex algorithm that figures out:
        1. Current streak (consecutive days from today backwards)
        2. Longest streak (best streak ever achieved)
        
        Algorithm:
        - Start from today and go backwards
        - Count consecutive days with completions
        - Stop when we find a gap
        - Also find the longest streak in history
        
        Args:
            habit: The habit to update streaks for
        """
        # Get all completion logs for this habit, ordered by date
        logs = self.db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id
        ).order_by(HabitLog.completed_date.desc()).all()
        
        if not logs:
            # No completions yet
            habit.current_streak = 0
            habit.longest_streak = 0
            self.db.commit()
            return
        
        # Calculate current streak (from today backwards)
        current_streak = 0
        today = date.today()
        current_date = today
        
        # Create a set of completion dates for fast lookup
        completion_dates = {log.completed_date for log in logs}
        
        # Count backwards from today
        while current_date in completion_dates:
            current_streak += 1
            current_date -= timedelta(days=1)
        
        # Calculate longest streak in history
        longest_streak = 0
        temp_streak = 0
        
        # Sort all completion dates
        all_dates = sorted(completion_dates)
        
        if all_dates:
            temp_streak = 1  # First date counts as streak of 1
            
            for i in range(1, len(all_dates)):
                prev_date = all_dates[i-1]
                curr_date = all_dates[i]
                
                # Check if dates are consecutive
                if (curr_date - prev_date).days == 1:
                    temp_streak += 1
                else:
                    # Streak broken, check if it's the longest
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1  # Start new streak
            
            # Don't forget the last streak
            longest_streak = max(longest_streak, temp_streak)
        
        # Update the habit
        habit.current_streak = current_streak
        habit.longest_streak = max(habit.longest_streak, longest_streak)
        self.db.commit()
    
    def get_habit_logs(
        self,
        habit_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100
    ) -> List[HabitLog]:
        """
        Get completion logs for a habit
        
        Args:
            habit_id: ID of the habit
            start_date: Filter logs from this date (optional)
            end_date: Filter logs until this date (optional)
            limit: Maximum number of logs to return
            
        Returns:
            List of habit logs
        """
        query = self.db.query(HabitLog).filter(HabitLog.habit_id == habit_id)
        
        if start_date:
            query = query.filter(HabitLog.completed_date >= start_date)
        
        if end_date:
            query = query.filter(HabitLog.completed_date <= end_date)
        
        query = query.order_by(HabitLog.completed_date.desc()).limit(limit)
        
        return query.all()
    
    def get_habit_statistics(self, habit_id: str) -> Optional[Dict]:
        """
        Get comprehensive statistics for a habit
        
        Calculates:
        - Total completions
        - Completion rate (percentage)
        - Current and longest streaks
        - Days since creation
        - Last completion date
        
        Args:
            habit_id: ID of the habit
            
        Returns:
            Dictionary with statistics, None if habit not found
        """
        habit = self.get_habit_by_id(habit_id)
        if not habit:
            return None
        
        # Get all logs for this habit
        logs = self.db.query(HabitLog).filter(HabitLog.habit_id == habit_id).all()
        
        # Calculate statistics
        total_completions = sum(log.count for log in logs)
        days_since_creation = (date.today() - habit.created_at.date()).days + 1
        
        # Calculate completion rate based on days since creation
        if logs and days_since_creation > 0:
            unique_completion_days = len(set(log.completed_date for log in logs))
            completion_rate = (unique_completion_days / days_since_creation) * 100
        else:
            completion_rate = 0.0
        
        # Find last completion
        last_completed = None
        if logs:
            last_completed = max(log.completed_date for log in logs)
        
        return {
            "habit_id": habit.id,
            "habit_name": habit.name,
            "total_completions": total_completions,
            "completion_rate": round(completion_rate, 2),
            "current_streak": habit.current_streak,
            "longest_streak": habit.longest_streak,
            "days_since_creation": days_since_creation,
            "last_completed": last_completed
        }
    
    def get_all_habits_statistics(self) -> Dict:
        """
        Get overall statistics for all habits
        
        Returns:
            Dictionary with overall habit statistics
        """
        total_habits = self.db.query(Habit).count()
        total_logs = self.db.query(HabitLog).count()
        
        # Find habits with current streaks
        active_habits = self.db.query(Habit).filter(Habit.current_streak > 0).count()
        
        # Find best current streak
        best_current_streak = self.db.query(func.max(Habit.current_streak)).scalar() or 0
        
        return {
            "total_habits": total_habits,
            "active_habits": active_habits,
            "total_completions": total_logs,
            "best_current_streak": best_current_streak
        }


# Example of how this service is used:
"""
# Create a habit
habit_data = HabitCreate(name="Exercise", frequency="daily")
habit = service.create_habit(habit_data)

# Log completion
log_data = HabitLogCreate(
    habit_id=habit.id,
    completed_date=date.today(),
    count=1
)
service.log_habit_completion(log_data)

# The service automatically calculates streaks!
print(f"Current streak: {habit.current_streak}")
"""