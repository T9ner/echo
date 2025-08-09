#!/usr/bin/env python3
"""
Initialize the database with tables and sample data
"""
import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import Task, Habit  # Import all your models

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

def main():
    create_tables()

if __name__ == "__main__":
    main()
