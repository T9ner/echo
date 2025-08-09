"""
Super Simple Database Setup for Learning
"""
import os
import sys

def setup_sqlite_database():
    """Set up SQLite database (no PostgreSQL needed!)"""
    print("🚀 Setting up ECHO database (SQLite version)...")
    print("📚 This is perfect for learning - no complex setup needed!")
    
    try:
        # Import our SQLite database setup
        from app.core.database_sqlite import create_tables, reset_database
        
        # Create the database and tables
        reset_database()
        
        print("\n✅ Database setup complete!")
        print("📁 Your database is saved as 'echo_app.db'")
        print("🔍 You can open this file with DB Browser for SQLite to see your data")
        print("\n🎯 Ready to start the server!")
        print("   Run: python run.py")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        print("💡 Make sure you've installed the dependencies:")
        print("   pip install -r requirements.txt")

def show_database_explanation():
    """Explain what the database does"""
    print("\n" + "="*50)
    print("📚 WHAT IS THE DATABASE DOING?")
    print("="*50)
    print("🗂️  The database stores:")
    print("   • Your tasks (title, due date, completed status)")
    print("   • Your habits (name, streak count, completion history)")
    print("   • Chat messages with ECHO AI")
    print("   • All your app settings")
    print()
    print("💾 Without a database:")
    print("   • Everything disappears when you close the app")
    print("   • Like writing on a whiteboard that gets erased")
    print()
    print("💾 With a database:")
    print("   • Everything is saved permanently")
    print("   • Like writing in a notebook that never gets lost")
    print()
    print("🔍 You can see your data by:")
    print("   1. Download 'DB Browser for SQLite' (free)")
    print("   2. Open the 'echo_app.db' file")
    print("   3. Browse your tasks, habits, and chat history!")
    print("="*50)

if __name__ == "__main__":
    show_database_explanation()
    
    choice = input("\n🤔 Ready to set up the database? (y/n): ").lower()
    if choice in ['y', 'yes']:
        setup_sqlite_database()
    else:
        print("👍 No problem! Run this script again when you're ready.")
        print("💡 The database is needed to save your tasks and habits.")