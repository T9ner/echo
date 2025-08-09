"""
PostgreSQL Setup Guide for ECHO AI Assistant
Learn PostgreSQL step by step!
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def explain_postgresql():
    """Explain what PostgreSQL is and why we use it"""
    print("🐘 POSTGRESQL EXPLAINED")
    print("=" * 50)
    print("🎯 What is PostgreSQL?")
    print("   • A powerful, open-source database system")
    print("   • Used by Netflix, Instagram, Spotify, Uber")
    print("   • Handles millions of records efficiently")
    print("   • ACID compliant (reliable transactions)")
    print()
    print("🔥 Why PostgreSQL over SQLite?")
    print("   • Better for real applications")
    print("   • Supports multiple users simultaneously")
    print("   • Advanced features (JSON, full-text search)")
    print("   • Industry standard - great for your resume!")
    print()
    print("🏗️ How our app uses PostgreSQL:")
    print("   • Tasks table: stores your to-do items")
    print("   • Habits table: tracks your daily habits")
    print("   • Habit_logs table: records habit completions")
    print("   • Chat_messages table: saves AI conversations")
    print("=" * 50)

def check_postgresql_connection():
    """Test if we can connect to PostgreSQL"""
    print("\n🔍 CHECKING POSTGRESQL CONNECTION")
    print("-" * 40)
    
    try:
        # Try to connect to PostgreSQL server (not our specific database yet)
        server_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
        
        print(f"🔗 Connecting to: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}")
        print(f"👤 Using user: {settings.POSTGRES_USER}")
        
        engine = create_engine(server_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL connected successfully!")
            print(f"📊 Version: {version[:50]}...")
            return True
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 TROUBLESHOOTING:")
        print("   1. Check if PostgreSQL is running")
        print("   2. Verify your password in .env file")
        print("   3. Make sure user 'postgres' exists")
        print("   4. Check if port 5432 is correct")
        return False

def create_echo_database():
    """Create the ECHO database if it doesn't exist"""
    print("\n🏗️ CREATING ECHO DATABASE")
    print("-" * 40)
    
    try:
        # Connect to PostgreSQL server
        server_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
        engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
        
        with engine.connect() as conn:
            # Check if our database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'"))
            
            if result.fetchone():
                print(f"✅ Database '{settings.POSTGRES_DB}' already exists")
            else:
                # Create the database
                conn.execute(text(f"CREATE DATABASE {settings.POSTGRES_DB}"))
                print(f"🎉 Database '{settings.POSTGRES_DB}' created successfully!")
                
        return True
        
    except Exception as e:
        print(f"❌ Failed to create database: {e}")
        return False

def create_tables():
    """Create all the tables for our app"""
    print("\n📋 CREATING TABLES")
    print("-" * 40)
    
    try:
        # Import our models to register them with SQLAlchemy
        from app.models import Base
        from app.core.database import engine
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Tables created successfully!")
        print("📊 Tables in your database:")
        print("   • tasks - stores your to-do items")
        print("   • habits - tracks your daily habits") 
        print("   • habit_logs - records habit completions")
        print("   • chat_messages - saves AI conversations")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

def show_database_info():
    """Show information about the created database"""
    print("\n🎯 YOUR POSTGRESQL DATABASE IS READY!")
    print("=" * 50)
    print(f"🏠 Server: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}")
    print(f"🗄️ Database: {settings.POSTGRES_DB}")
    print(f"👤 User: {settings.POSTGRES_USER}")
    print()
    print("🔍 To explore your database:")
    print("   1. Open pgAdmin 4 (you already have it!)")
    print("   2. Connect to your server")
    print("   3. Navigate to echo_db database")
    print("   4. Look at Tables to see your data structure")
    print()
    print("🚀 Next steps:")
    print("   • Run: python run.py (start the API server)")
    print("   • Visit: http://localhost:8000/docs (see API docs)")
    print("   • Start building Task 2 (API endpoints)!")
    print("=" * 50)

def main():
    """Main setup function"""
    print("🐘 ECHO AI - POSTGRESQL SETUP")
    print("Learn PostgreSQL while building your app!")
    print()
    
    # Step 1: Explain PostgreSQL
    explain_postgresql()
    
    input("\n📚 Press Enter to continue with setup...")
    
    # Step 2: Check connection
    if not check_postgresql_connection():
        print("\n❌ Setup stopped. Fix connection issues first.")
        return
    
    # Step 3: Create database
    if not create_echo_database():
        print("\n❌ Setup stopped. Could not create database.")
        return
    
    # Step 4: Create tables
    if not create_tables():
        print("\n❌ Setup stopped. Could not create tables.")
        return
    
    # Step 5: Show success info
    show_database_info()

if __name__ == "__main__":
    main()