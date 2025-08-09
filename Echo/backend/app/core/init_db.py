"""
Database initialization utilities
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Base


def init_db() -> None:
    """
    Initialize database tables
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def reset_db() -> None:
    """
    Reset database (drop and recreate all tables)
    Use with caution!
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset completed!")


if __name__ == "__main__":
    init_db()