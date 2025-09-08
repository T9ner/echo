"""
Event schemas for API validation and serialization
"""
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from app.models.enums import EventType, EventStatus, RecurrenceType


class EventBase(BaseModel):
    """Base event schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Event title")
    description: Optional[str] = Field(None, max_length=1000, description="Event description")
    location: Optional[str] = Field(None, max_length=200, description="Event location")
    
    start_time: datetime = Field(..., description="Event start time")
    end_time: datetime = Field(..., description="Event end time")
    all_day: bool = Field(False, description="Whether event is all day")
    
    event_type: EventType = Field(EventType.PERSONAL, description="Type of event")
    status: EventStatus = Field(EventStatus.SCHEDULED, description="Event status")
    
    # Recurrence fields
    recurrence_type: RecurrenceType = Field(RecurrenceType.NONE, description="Recurrence pattern")
    recurrence_interval: Optional[int] = Field(None, ge=1, le=365, description="Recurrence interval")
    recurrence_end_date: Optional[datetime] = Field(None, description="When recurrence ends")
    recurrence_count: Optional[int] = Field(None, ge=1, le=1000, description="Number of recurrences")
    
    # Relationships
    task_id: Optional[str] = Field(None, description="Associated task ID")
    habit_id: Optional[str] = Field(None, description="Associated habit ID")
    
    @validator('end_time')
    def end_time_after_start_time(cls, v, values):
        """Validate that end time is after start time"""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v
    
    @validator('recurrence_end_date')
    def recurrence_end_after_start(cls, v, values):
        """Validate that recurrence end date is after start time"""
        if v and 'start_time' in values and v <= values['start_time']:
            raise ValueError('Recurrence end date must be after start time')
        return v


class EventCreate(EventBase):
    """Schema for creating a new event"""
    pass


class EventUpdate(BaseModel):
    """Schema for updating an existing event"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_interval: Optional[int] = Field(None, ge=1, le=365)
    recurrence_end_date: Optional[datetime] = None
    recurrence_count: Optional[int] = Field(None, ge=1, le=1000)
    
    task_id: Optional[str] = None
    habit_id: Optional[str] = None


class EventResponse(EventBase):
    """Schema for event responses"""
    id: str
    duration_minutes: int
    is_recurring: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EventList(BaseModel):
    """Schema for paginated event lists"""
    events: List[EventResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class EventFilter(BaseModel):
    """Schema for filtering events"""
    start_date: Optional[datetime] = Field(None, description="Filter events from this date")
    end_date: Optional[datetime] = Field(None, description="Filter events until this date")
    event_type: Optional[EventType] = Field(None, description="Filter by event type")
    status: Optional[EventStatus] = Field(None, description="Filter by event status")
    search: Optional[str] = Field(None, max_length=100, description="Search in title and description")
    task_id: Optional[str] = Field(None, description="Filter by associated task")
    habit_id: Optional[str] = Field(None, description="Filter by associated habit")


class MonthEventsRequest(BaseModel):
    """Schema for requesting events for a specific month"""
    year: int = Field(..., ge=1900, le=3000, description="Year")
    month: int = Field(..., ge=1, le=12, description="Month")


class MonthEventsResponse(BaseModel):
    """Schema for month events response"""
    year: int
    month: int
    events: List[EventResponse]
    total_events: int


class EventConflictCheck(BaseModel):
    """Schema for checking event conflicts"""
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    exclude_event_id: Optional[str] = None  # Exclude this event from conflict check


class EventConflictResponse(BaseModel):
    """Schema for event conflict response"""
    has_conflicts: bool
    conflicting_events: List[EventResponse]


# Event Reminder Schemas
class EventReminderBase(BaseModel):
    """Base event reminder schema"""
    minutes_before: int = Field(..., ge=0, le=10080, description="Minutes before event (max 1 week)")
    method: str = Field("notification", description="Reminder method")


class EventReminderCreate(EventReminderBase):
    """Schema for creating event reminders"""
    pass


class EventReminderResponse(EventReminderBase):
    """Schema for event reminder responses"""
    id: str
    event_id: str
    sent: bool
    sent_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventWithReminders(EventResponse):
    """Event response with reminders included"""
    reminders: List[EventReminderResponse] = []


# Bulk Operations
class BulkEventCreate(BaseModel):
    """Schema for creating multiple events"""
    events: List[EventCreate] = Field(..., max_items=100, description="List of events to create")


class BulkEventResponse(BaseModel):
    """Schema for bulk event creation response"""
    created_events: List[EventResponse]
    failed_events: List[dict]  # Contains error details for failed creations
    total_created: int
    total_failed: int