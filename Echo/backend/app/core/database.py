"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Create SQLAlchemy engine with optimized settings
if settings.USE_SQLITE:
    # SQLite configuration (simpler for learning)
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={
            "check_same_thread": False,  # Needed for SQLite
            "timeout": 20,  # Connection timeout
        },
        pool_pre_ping=True,
        pool_recycle=3600,  # Recycle connections every hour
        echo=False  # Set to True for SQL query logging in development
    )
else:
    # PostgreSQL configuration with optimized connection pooling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Validate connections before use
        pool_recycle=3600,  # Recycle connections every hour
        pool_timeout=30,  # Timeout for getting connection from pool
        echo=False,  # Set to True for SQL query logging in development
        # Performance optimizations
        connect_args={
            "options": "-c timezone=utc",  # Set timezone
            "application_name": "echo_ai_assistant",  # For monitoring
        }
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


def drop_tables():
    """
    Drop all database tables (use with caution!)
    """
    Base.metadata.drop_all(bind=engine)