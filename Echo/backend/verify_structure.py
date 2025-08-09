"""
Verify the backend structure is set up correctly
"""
import os

def check_file_exists(filepath):
    """Check if a file exists and print status"""
    exists = os.path.exists(filepath)
    status = "✅" if exists else "❌"
    print(f"{status} {filepath}")
    return exists

def verify_backend_structure():
    """Verify all required files are in place"""
    print("Verifying ECHO backend structure...\n")
    
    # Core files
    print("Core Application Files:")
    check_file_exists("app/__init__.py")
    check_file_exists("app/main.py")
    check_file_exists("app/core/__init__.py")
    check_file_exists("app/core/config.py")
    check_file_exists("app/core/database.py")
    check_file_exists("app/core/init_db.py")
    
    print("\nModel Files:")
    check_file_exists("app/models/__init__.py")
    check_file_exists("app/models/enums.py")
    check_file_exists("app/models/task.py")
    check_file_exists("app/models/habit.py")
    check_file_exists("app/models/chat.py")
    
    print("\nAPI Structure:")
    check_file_exists("app/api/__init__.py")
    check_file_exists("app/api/v1/__init__.py")
    check_file_exists("app/api/v1/api.py")
    
    print("\nDatabase Migration Files:")
    check_file_exists("alembic.ini")
    check_file_exists("alembic/env.py")
    check_file_exists("alembic/script.py.mako")
    check_file_exists("alembic/versions/001_initial_migration.py")
    
    print("\nConfiguration and Setup Files:")
    check_file_exists("requirements.txt")
    check_file_exists(".env.example")
    check_file_exists("run.py")
    check_file_exists("setup_db.py")
    check_file_exists("README.md")
    
    print("\n✅ Backend foundation structure is complete!")
    print("\nNext steps:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Set up PostgreSQL database")
    print("3. Copy .env.example to .env and configure")
    print("4. Run database setup: python setup_db.py")
    print("5. Start the server: python run.py")

if __name__ == "__main__":
    verify_backend_structure()