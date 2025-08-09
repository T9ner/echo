"""
Simple SQLite database configuration (easier for learning!)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Create SQLite database file in the backend directory
DATABASE_URL = "sqlite:///./echo_app.db"

# Create SQLAlchemy engine for SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True to see SQL queries
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Create all database tables
    """
    Base.metadata.create_all(bind=engine)
    print("✅ SQLite database tables created!")


def reset_database():
    """
    Reset database (delete the file and recreate)
    """
    db_file = "echo_app.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print("🗑️ Old database deleted")
    
    create_tables()
    print("✅ Fresh database created!")


if __name__ == "__main__":
    create_tables()