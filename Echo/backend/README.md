# ECHO AI Productivity Assistant - Backend

This is the FastAPI backend for the ECHO AI Productivity Assistant.

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Virtual environment (recommended)

### Installation

1. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database:**
   - Install PostgreSQL
   - Create a database user and database
   - Update the database configuration in `.env`

5. **Initialize database:**
   ```bash
   python setup_db.py
   ```

### Running the Application

**Development server:**
```bash
python run.py
```

**Or using uvicorn directly:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Migrations

**Create a new migration:**
```bash
alembic revision --autogenerate -m "Description of changes"
```

**Apply migrations:**
```bash
alembic upgrade head
```

**Rollback migrations:**
```bash
alembic downgrade -1
```

### Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py          # Main API router
│   │       └── endpoints/      # API endpoints (to be created)
│   ├── core/
│   │   ├── config.py          # Application settings
│   │   ├── database.py        # Database configuration
│   │   └── init_db.py         # Database initialization
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py            # Task model
│   │   ├── habit.py           # Habit models
│   │   ├── chat.py            # Chat message model
│   │   └── enums.py           # Enum definitions
│   └── main.py                # FastAPI application
├── alembic/                   # Database migrations
├── requirements.txt           # Python dependencies
├── run.py                     # Development server runner
└── setup_db.py               # Database setup script
```

### Environment Variables

Required environment variables (see `.env.example`):

- `POSTGRES_SERVER`: PostgreSQL server host
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name
- `POSTGRES_PORT`: Database port
- `SECRET_KEY`: JWT secret key
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `GOOGLE_CLIENT_ID`: Google Calendar API client ID (optional)
- `GOOGLE_CLIENT_SECRET`: Google Calendar API client secret (optional)

### Next Steps

This foundation provides:
- ✅ FastAPI application structure
- ✅ PostgreSQL connection and SQLAlchemy configuration
- ✅ Database models for tasks, habits, and chat messages
- ✅ Alembic migrations setup
- ✅ Database connection utilities and session management

The next tasks will build upon this foundation to implement the API endpoints and business logic.