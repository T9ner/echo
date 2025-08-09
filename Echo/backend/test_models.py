"""
Simple test script to verify database models
"""
from datetime import datetime, date
from app.models.task import Task
from app.models.habit import Habit, HabitLog
from app.models.chat import ChatMessage
from app.models.enums import TaskStatus, TaskPriority, HabitFrequency

def test_models():
    """Test that models can be instantiated correctly"""
    
    # Test Task model
    task = Task(
        title="Test Task",
        description="This is a test task",
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
        due_date=datetime.now()
    )
    print(f"Task created: {task}")
    
    # Test Habit model
    habit = Habit(
        name="Test Habit",
        description="This is a test habit",
        frequency=HabitFrequency.DAILY,
        target_count=1
    )
    print(f"Habit created: {habit}")
    
    # Test HabitLog model
    habit_log = HabitLog(
        habit_id=habit.id,
        completed_date=date.today(),
        count=1,
        notes="Completed successfully"
    )
    print(f"HabitLog created: {habit_log}")
    
    # Test ChatMessage model
    chat_message = ChatMessage(
        message="Hello ECHO",
        response="Hello! How can I help you today?",
        context_data={"user_tasks": 5, "user_habits": 3},
        response_time_ms=150
    )
    print(f"ChatMessage created: {chat_message}")
    
    print("\nAll models instantiated successfully!")

if __name__ == "__main__":
    test_models()