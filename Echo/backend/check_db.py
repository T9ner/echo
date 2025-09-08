"""
Quick database check
"""
from app.core.database import engine
from sqlalchemy import text

def check_database():
    try:
        with engine.connect() as conn:
            print("✅ Database connection successful")
            
            # Check tables
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            print(f"📋 Tables found: {tables}")
            
            # Check if events table exists
            if 'events' in tables:
                print("✅ Events table exists")
                # Check events table structure
                result = conn.execute(text("PRAGMA table_info(events)"))
                columns = [row[1] for row in result]
                print(f"📝 Events table columns: {columns}")
            else:
                print("❌ Events table missing")
                
            # Check if other core tables exist
            core_tables = ['tasks', 'habits', 'habit_logs']
            for table in core_tables:
                if table in tables:
                    print(f"✅ {table} table exists")
                else:
                    print(f"❌ {table} table missing")
                    
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_database()
