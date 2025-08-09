"""
Database setup script
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def create_database():
    """Create the database if it doesn't exist"""
    # Connect to PostgreSQL server (not specific database)
    server_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
    
    try:
        engine = create_engine(server_url)
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'"))
            if not result.fetchone():
                # Create database
                conn.execute(text("COMMIT"))  # End any existing transaction
                conn.execute(text(f"CREATE DATABASE {settings.POSTGRES_DB}"))
                print(f"Database '{settings.POSTGRES_DB}' created successfully!")
            else:
                print(f"Database '{settings.POSTGRES_DB}' already exists.")
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

def run_migrations():
    """Run Alembic migrations"""
    try:
        os.system("alembic upgrade head")
        print("Database migrations completed successfully!")
    except Exception as e:
        print(f"Error running migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Setting up ECHO database...")
    create_database()
    run_migrations()
    print("Database setup completed!")