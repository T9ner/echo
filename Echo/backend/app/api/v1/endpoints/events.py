"""
Event API Endpoints - Calendar functionality

These endpoints provide full CRUD operations for calendar events:
- GET /events - List events with filtering and pagination
- POST /events - Create new event
- GET /events/{id} - Get specific event
- PUT /events/{id} - Update event
- DELETE /events/{id} - Delete event
- GET /events/month/{year}/{month} - Get events for specific month
- POST /events/conflicts - Check for event conflicts
- POST /events/bulk - Create multiple events
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import logging

from app.core.database import get_db
from app.services.event_service import EventService
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventList, EventFilter,
    MonthEventsRequest, MonthEventsResponse, EventConflictCheck, EventConflictResponse,
    EventReminderCreate, EventReminderResponse, EventWithReminders,
    BulkEventCreate, BulkEventResponse
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router for event endpoints
router = APIRouter()


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new calendar event
    
    Creates a new event with the provided details. Validates that:
    - End time is after start time
    - Recurrence settings are valid
    - Associated task/habit exists (if provided)
    """
    try:
        service = EventService(db)
        event = service.create_event(event_data)
        
        logger.info(f"Created event: {event.id} - {event.title}")
        return event
        
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create event: {str(e)}"
        )


@router.get("/", response_model=EventList)
async def get_events(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    start_date: Optional[datetime] = Query(None, description="Filter events from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events until this date"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by event status"),
    search: Optional[str] = Query(None, description="Search in title, description, location"),
    task_id: Optional[str] = Query(None, description="Filter by associated task"),
    habit_id: Optional[str] = Query(None, description="Filter by associated habit"),
    db: Session = Depends(get_db)
):
    """
    Get events with filtering and pagination
    
    Returns a paginated list of events with optional filtering by:
    - Date range (start_date, end_date)
    - Event type (meeting, task, personal, etc.)
    - Status (scheduled, completed, cancelled)
    - Search term (searches title, description, location)
    - Associated task or habit
    """
    try:
        service = EventService(db)
        
        # Build filters
        filters = EventFilter(
            start_date=start_date,
            end_date=end_date,
            event_type=event_type,
            status=status,
            search=search,
            task_id=task_id,
            habit_id=habit_id
        )
        
        result = service.get_events(filters, page, per_page)
        
        return EventList(**result)
        
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events"
        )


@router.get("/{event_id}", response_model=EventWithReminders)
async def get_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific event by ID
    
    Returns detailed information about an event including:
    - All event details
    - Associated reminders
    - Calculated fields (duration, recurrence status)
    """
    try:
        service = EventService(db)
        event = service.get_event(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event with ID {event_id} not found"
            )
        
        # Get reminders for this event
        reminders = service.get_event_reminders(event_id)
        
        # Convert to response model with proper serialization
        from app.schemas.event import EventResponse
        
        # Create base event response
        event_response = EventResponse.from_orm(event)
        
        # Add reminders
        event_dict = event_response.dict()
        event_dict['reminders'] = reminders
        
        return EventWithReminders(**event_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event"
        )


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing event
    
    Updates the specified event with new data. Only provided fields are updated.
    Validates that updated times are still valid.
    """
    try:
        service = EventService(db)
        event = service.update_event(event_id, event_data)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event with ID {event_id} not found"
            )
        
        logger.info(f"Updated event: {event_id}")
        return event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update event: {str(e)}"
        )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete an event
    
    Permanently deletes the specified event and all associated reminders.
    This action cannot be undone.
    """
    try:
        service = EventService(db)
        success = service.delete_event(event_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event with ID {event_id} not found"
            )
        
        logger.info(f"Deleted event: {event_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event"
        )


@router.get("/month/{year}/{month}", response_model=MonthEventsResponse)
async def get_month_events(
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """
    Get all events for a specific month
    
    Returns all events that occur during the specified month.
    Useful for calendar month view display.
    """
    try:
        # Validate month and year
        if not (1 <= month <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Month must be between 1 and 12"
            )
        
        if not (1900 <= year <= 3000):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Year must be between 1900 and 3000"
            )
        
        service = EventService(db)
        events = service.get_month_events(year, month)
        
        return MonthEventsResponse(
            year=year,
            month=month,
            events=events,
            total_events=len(events)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting month events for {year}-{month}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve month events"
        )


@router.post("/conflicts", response_model=EventConflictResponse)
async def check_event_conflicts(
    conflict_check: EventConflictCheck,
    db: Session = Depends(get_db)
):
    """
    Check for event conflicts
    
    Checks if the proposed event time conflicts with existing events.
    Useful for preventing double-booking and scheduling conflicts.
    """
    try:
        service = EventService(db)
        result = service.check_conflicts(conflict_check)
        
        return EventConflictResponse(**result)
        
    except Exception as e:
        logger.error(f"Error checking conflicts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check event conflicts"
        )


@router.post("/bulk", response_model=BulkEventResponse)
async def create_bulk_events(
    bulk_data: BulkEventCreate,
    db: Session = Depends(get_db)
):
    """
    Create multiple events in bulk
    
    Creates multiple events in a single request. Useful for:
    - Importing calendar data
    - Creating recurring event instances
    - Batch event creation
    
    Returns details of successful and failed creations.
    """
    try:
        service = EventService(db)
        result = service.create_bulk_events(bulk_data)
        
        logger.info(f"Bulk created {result['total_created']} events, {result['total_failed']} failed")
        return BulkEventResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in bulk event creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create events in bulk"
        )


# Event Reminder Endpoints
@router.post("/{event_id}/reminders", response_model=EventReminderResponse, status_code=status.HTTP_201_CREATED)
async def add_event_reminder(
    event_id: str,
    reminder_data: EventReminderCreate,
    db: Session = Depends(get_db)
):
    """
    Add a reminder to an event
    
    Creates a new reminder for the specified event.
    Reminders can be set for various times before the event.
    """
    try:
        service = EventService(db)
        reminder = service.add_reminder(event_id, reminder_data)
        
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event with ID {event_id} not found"
            )
        
        logger.info(f"Added reminder to event {event_id}")
        return reminder
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding reminder to event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add reminder: {str(e)}"
        )


@router.get("/{event_id}/reminders", response_model=List[EventReminderResponse])
async def get_event_reminders(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all reminders for an event
    
    Returns all reminders associated with the specified event,
    ordered by time before event.
    """
    try:
        service = EventService(db)
        
        # Check if event exists
        event = service.get_event(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event with ID {event_id} not found"
            )
        
        reminders = service.get_event_reminders(event_id)
        return reminders
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reminders for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event reminders"
        )


# Utility Endpoints
@router.get("/upcoming/list", response_model=List[EventResponse])
async def get_upcoming_events(
    limit: int = Query(10, ge=1, le=50, description="Number of upcoming events to return"),
    db: Session = Depends(get_db)
):
    """
    Get upcoming events
    
    Returns the next upcoming events, useful for dashboard displays
    and quick event overview.
    """
    try:
        service = EventService(db)
        events = service.get_upcoming_events(limit)
        
        return events
        
    except Exception as e:
        logger.error(f"Error getting upcoming events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve upcoming events"
        )


@router.get("/stats/by-type")
async def get_events_stats_by_type(
    db: Session = Depends(get_db)
):
    """
    Get event statistics by type
    
    Returns count of events grouped by event type.
    Useful for analytics and dashboard displays.
    """
    try:
        service = EventService(db)
        stats = service.get_events_count_by_type()
        
        return {
            "stats_by_type": stats,
            "total_events": sum(stats.values())
        }
        
    except Exception as e:
        logger.error(f"Error getting event stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event statistics"
        )


# Summary of all event endpoints:
"""
Event Management:
POST   /events                    - Create new event
GET    /events                    - List events with filtering
GET    /events/{id}               - Get specific event with reminders
PUT    /events/{id}               - Update event
DELETE /events/{id}               - Delete event

Calendar Views:
GET    /events/month/{year}/{month} - Get events for specific month

Bulk Operations:
POST   /events/bulk               - Create multiple events
POST   /events/conflicts          - Check for event conflicts

Reminders:
POST   /events/{id}/reminders     - Add reminder to event
GET    /events/{id}/reminders     - Get event reminders

Utilities:
GET    /events/upcoming/list      - Get upcoming events
GET    /events/stats/by-type      - Get event statistics by type
"""