"""
Google Calendar API Endpoints

These endpoints handle Google Calendar integration:
- OAuth2 authentication flow
- Calendar and event management
- Task/habit to calendar sync
- Bidirectional synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.core.database import get_db
from app.services.google_calendar_service import GoogleCalendarService
from app.services.task_service import TaskService
from app.services.habit_service import HabitService
from app.schemas.google_calendar import (
    GoogleAuthUrl, GoogleTokenExchange, GoogleCalendarList,
    GoogleEventList, GoogleEventCreate, GoogleEventUpdate
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/auth-url", response_model=GoogleAuthUrl)
async def get_google_auth_url(
    redirect_uri: str = Query(..., description="OAuth2 redirect URI")
):
    """
    Get Google OAuth2 authorization URL
    
    This endpoint generates the URL users need to visit to authorize
    ECHO to access their Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService()
        auth_url = calendar_service.get_auth_url(redirect_uri)
        
        return GoogleAuthUrl(auth_url=auth_url)
        
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authorization URL"
        )

@router.post("/exchange-token", response_model=Dict[str, Any])
async def exchange_google_token(
    token_exchange: GoogleTokenExchange,
    db: Session = Depends(get_db)
):
    """
    Exchange authorization code for access tokens
    
    This endpoint exchanges the authorization code received from Google
    for access and refresh tokens.
    """
    try:
        calendar_service = GoogleCalendarService()
        token_data = calendar_service.exchange_code_for_tokens(
            token_exchange.code,
            token_exchange.redirect_uri
        )
        
        # TODO: Store token_data in database for the user
        # For now, return the tokens (in production, store securely)
        
        return {
            "message": "Successfully authenticated with Google Calendar",
            "tokens": token_data
        }
        
    except Exception as e:
        logger.error(f"Error exchanging token: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code"
        )

@router.get("/calendars", response_model=GoogleCalendarList)
async def get_google_calendars(
    # TODO: Add user authentication and get stored tokens
    access_token: str = Query(..., description="Google access token")
):
    """
    Get user's Google Calendar list
    
    Returns all calendars the user has access to.
    """
    try:
        calendar_service = GoogleCalendarService()
        
        # TODO: Get token_data from database using user authentication
        # For now, use provided access token
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        calendars = calendar_service.get_calendars()
        
        return GoogleCalendarList(calendars=calendars)
        
    except Exception as e:
        logger.error(f"Error fetching calendars: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch calendars"
        )

@router.get("/events", response_model=GoogleEventList)
async def get_google_calendar_events(
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    max_results: int = Query(250, description="Maximum number of events"),
    access_token: str = Query(..., description="Google access token")
):
    """
    Get events from Google Calendar
    
    Fetches events from the specified Google Calendar within the date range.
    """
    try:
        calendar_service = GoogleCalendarService()
        
        # TODO: Get token_data from database using user authentication
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        events = calendar_service.get_events(
            calendar_id=calendar_id,
            start_date=start_dt,
            end_date=end_dt,
            max_results=max_results
        )
        
        return GoogleEventList(events=events, total=len(events))
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch calendar events"
        )

@router.post("/events", response_model=Dict[str, Any])
async def create_google_calendar_event(
    event_create: GoogleEventCreate,
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    access_token: str = Query(..., description="Google access token")
):
    """
    Create event in Google Calendar
    
    Creates a new event in the specified Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService()
        
        # TODO: Get token_data from database using user authentication
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        event_data = event_create.dict()
        created_event = calendar_service.create_event(event_data, calendar_id)
        
        return {
            "message": "Event created successfully",
            "event": created_event
        }
        
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create calendar event"
        )

@router.put("/events/{event_id}", response_model=Dict[str, Any])
async def update_google_calendar_event(
    event_id: str,
    event_update: GoogleEventUpdate,
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    access_token: str = Query(..., description="Google access token")
):
    """
    Update event in Google Calendar
    
    Updates an existing event in the specified Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService()
        
        # TODO: Get token_data from database using user authentication
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        event_data = event_update.dict(exclude_unset=True)
        updated_event = calendar_service.update_event(event_id, event_data, calendar_id)
        
        return {
            "message": "Event updated successfully",
            "event": updated_event
        }
        
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update calendar event"
        )

@router.delete("/events/{event_id}")
async def delete_google_calendar_event(
    event_id: str,
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    access_token: str = Query(..., description="Google access token")
):
    """
    Delete event from Google Calendar
    
    Deletes an event from the specified Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService()
        
        # TODO: Get token_data from database using user authentication
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        calendar_service.delete_event(event_id, calendar_id)
        
        return {"message": "Event deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete calendar event"
        )

@router.post("/sync-task/{task_id}")
async def sync_task_to_google_calendar(
    task_id: str,
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    access_token: str = Query(..., description="Google access token"),
    db: Session = Depends(get_db)
):
    """
    Sync ECHO task to Google Calendar
    
    Creates a Google Calendar event from an ECHO task.
    """
    try:
        # Get task from database
        task_service = TaskService(db)
        task = task_service.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Create calendar event from task
        calendar_service = GoogleCalendarService()
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        task_data = {
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "priority": task.priority.value
        }
        
        created_event = calendar_service.create_event_from_task(task_data, calendar_id)
        
        return {
            "message": "Task synced to Google Calendar successfully",
            "task_id": task_id,
            "event": created_event
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing task to calendar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync task to calendar"
        )

@router.post("/sync-habit/{habit_id}")
async def sync_habit_to_google_calendar(
    habit_id: str,
    calendar_id: str = Query("primary", description="Google Calendar ID"),
    access_token: str = Query(..., description="Google access token"),
    db: Session = Depends(get_db)
):
    """
    Sync ECHO habit to Google Calendar
    
    Creates a Google Calendar event from an ECHO habit.
    """
    try:
        # Get habit from database
        habit_service = HabitService(db)
        habit = habit_service.get_habit(habit_id)
        
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Habit not found"
            )
        
        # Create calendar event from habit
        calendar_service = GoogleCalendarService()
        token_data = {"access_token": access_token}
        calendar_service.set_credentials(token_data)
        
        habit_data = {
            "name": habit.name,
            "description": habit.description,
            "frequency": habit.frequency.value,
            "current_streak": habit.current_streak
        }
        
        created_event = calendar_service.create_event_from_habit(habit_data, calendar_id)
        
        return {
            "message": "Habit synced to Google Calendar successfully",
            "habit_id": habit_id,
            "event": created_event
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing habit to calendar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync habit to calendar"
        )