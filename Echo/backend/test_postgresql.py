"""
Test PostgreSQL database with sample data
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.task import Task
from app.models.habit import Habit
from app.models.enums import TaskStatus, TaskPriority, HabitFrequency
from datetime import datetime, date

def test_database_operations():
    """Test creating, reading data from PostgreSQL"""
    print("🧪 TESTING POSTGRESQL DATABASE")
    print("=" * 40)
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Test 1: Create a task
        print("📝 Creating a test task...")
        test_task = Task(
            title="Learn PostgreSQL",
            description="Master PostgreSQL for ECHO AI app",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
            due_date=datetime.now()
        )
        db.add(test_task)
        db.commit()
        db.refresh(test_task)
        print(f"✅ Task created with ID: {test_task.id}")
        
        # Test 2: Create a habit
        print("🎯 Creating a test habit...")
        test_habit = Habit(
            name="Code Daily",
            description="Write code every day to improve skills",
            frequency=HabitFrequency.DAILY,
            target_count=1
        )
        db.add(test_habit)
        db.commit()
        db.refresh(test_habit)
        print(f"✅ Habit created with ID: {test_habit.id}")
        
        # Test 3: Query data back
        print("🔍 Querying data from database...")
        all_tasks = db.query(Task).all()
        all_habits = db.query(Habit).all()
        
        print(f"📊 Found {len(all_tasks)} tasks in database")
        print(f"📊 Found {len(all_habits)} habits in database")
        
        # Test 4: Show the data
        print("\n📋 TASKS IN DATABASE:")
        for task in all_tasks:
            print(f"   • {task.title} (Status: {task.status.value})")
            
        print("\n🎯 HABITS IN DATABASE:")
        for habit in all_habits:
            print(f"   • {habit.name} (Frequency: {habit.frequency.value})")
        
        print("\n🎉 PostgreSQL database is working perfectly!")
        print("💡 Check pgAdmin 4 to see this data in your tables!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_database_operations()