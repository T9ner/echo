"""
Main API router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import tasks, habits, chat, analytics, events

api_router = APIRouter()

# Include task management endpoints
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

# Include habit tracking endpoints
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])

# Include AI chat endpoints
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

# Include analytics endpoints
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Include calendar/events endpoints
api_router.include_router(events.router, prefix="/events", tags=["events"])

# Include Google Calendar integration endpoints
from app.api.v1.endpoints import google_calendar
api_router.include_router(google_calendar.router, prefix="/google-calendar", tags=["google-calendar"])

# Add health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint for frontend"""
    return {"status": "healthy", "service": "echo-api", "version": "1.0.0"}
