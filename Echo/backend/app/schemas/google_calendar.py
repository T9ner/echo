"""
Google Calendar Pydantic Schemas

Data validation and serialization schemas for Google Calendar integration.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class GoogleAuthUrl(BaseModel):
    """Google OAuth2 authorization URL response"""
    auth_url: str = Field(..., description="Google OAuth2 authorization URL")

class GoogleTokenExchange(BaseModel):
    """Google OAuth2 token exchange request"""
    code: str = Field(..., description="Authorization code from Google")
    redirect_uri: str = Field(..., description="OAuth2 redirect URI")

class GoogleCalendarInfo(BaseModel):
    """Google Calendar information"""
    id: str = Field(..., description="Calendar ID")
    name: str = Field(..., description="Calendar name")
    description: str = Field("", description="Calendar description")
    primary: bool = Field(False, description="Is primary calendar")
    access_role: str = Field("reader", description="User's access role")
    color: str = Field("#1976D2", description="Calendar color")

class GoogleCalendarList(BaseModel):
    """List of Google Calendars"""
    calendars: List[GoogleCalendarInfo] = Field(..., description="List of calendars")

class GoogleEventInfo(BaseModel):
    """Google Calendar event information"""
    id: str = Field(..., description="Event ID")
    title: str = Field(..., description="Event title")
    description: str = Field("", description="Event description")
    location: str = Field("", description="Event location")
    start_time: str = Field(..., description="Event start time (ISO format)")
    end_time: str = Field(..., description="Event end time (ISO format)")
    all_day: bool = Field(False, description="Is all-day event")
    status: str = Field("confirmed", description="Event status")
    html_link: str = Field("", description="Google Calendar link")
    creator: Dict[str, Any] = Field(default_factory=dict, description="Event creator")
    attendees: List[Dict[str, Any]] = Field(default_factory=list, description="Event attendees")
    recurrence: List[str] = Field(default_factory=list, description="Recurrence rules")
    calendar_id: str = Field(..., description="Calendar ID")

class GoogleEventList(BaseModel):
    """List of Google Calendar events"""
    events: List[GoogleEventInfo] = Field(..., description="List of events")
    total: int = Field(..., description="Total number of events")

class GoogleEventCreate(BaseModel):
    """Create Google Calendar event request"""
    title: str = Field(..., description="Event title", min_length=1, max_length=200)
    description: Optional[str] = Field(None, description="Event description", max_length=2000)
    location: Optional[str] = Field(None, description="Event location", max_length=500)
    start_time: str = Field(..., description="Event start time (ISO format)")
    end_time: str = Field(..., description="Event end time (ISO format)")
    all_day: bool = Field(False, description="Is all-day event")
    reminders: Optional[List[int]] = Field(None, description="Reminder minutes before event")
    
    @validator('start_time', 'end_time')
    def validate_datetime(cls, v):
        """Validate datetime format"""
        try:
            datetime.fromisoformat(v.replace('Z', ''))
            return v
        except ValueError:
            raise ValueError('Invalid datetime format. Use ISO format.')
    
    @validator('end_time')
    def validate_end_after_start(cls, v, values):
        """Validate end time is after start time"""
        if 'start_time' in values:
            start = datetime.fromisoformat(values['start_time'].replace('Z', ''))
            end = datetime.fromisoformat(v.replace('Z', ''))
            if end <= start:
                raise ValueError('End time must be after start time')
        return v
    
    @validator('reminders')
    def validate_reminders(cls, v):
        """Validate reminder minutes"""
        if v is not None:
            for minutes in v:
                if not isinstance(minutes, int) or minutes < 0:
                    raise ValueError('Reminder minutes must be non-negative integers')
                if minutes > 40320:  # 4 weeks in minutes
                    raise ValueError('Reminder cannot be more than 4 weeks before event')
        return v

class GoogleEventUpdate(BaseModel):
    """Update Google Calendar event request"""
    title: Optional[str] = Field(None, description="Event title", min_length=1, max_length=200)
    description: Optional[str] = Field(None, description="Event description", max_length=2000)
    location: Optional[str] = Field(None, description="Event location", max_length=500)
    start_time: Optional[str] = Field(None, description="Event start time (ISO format)")
    end_time: Optional[str] = Field(None, description="Event end time (ISO format)")
    all_day: Optional[bool] = Field(None, description="Is all-day event")
    reminders: Optional[List[int]] = Field(None, description="Reminder minutes before event")
    
    @validator('start_time', 'end_time')
    def validate_datetime(cls, v):
        """Validate datetime format"""
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', ''))
                return v
            except ValueError:
                raise ValueError('Invalid datetime format. Use ISO format.')
        return v
    
    @validator('reminders')
    def validate_reminders(cls, v):
        """Validate reminder minutes"""
        if v is not None:
            for minutes in v:
                if not isinstance(minutes, int) or minutes < 0:
                    raise ValueError('Reminder minutes must be non-negative integers')
                if minutes > 40320:  # 4 weeks in minutes
                    raise ValueError('Reminder cannot be more than 4 weeks before event')
        return v

class GoogleCalendarSync(BaseModel):
    """Google Calendar synchronization status"""
    calendar_id: str = Field(..., description="Google Calendar ID")
    last_sync: Optional[datetime] = Field(None, description="Last synchronization time")
    sync_enabled: bool = Field(True, description="Is synchronization enabled")
    sync_direction: str = Field("bidirectional", description="Sync direction: 'to_google', 'from_google', 'bidirectional'")
    
    @validator('sync_direction')
    def validate_sync_direction(cls, v):
        """Validate sync direction"""
        valid_directions = ['to_google', 'from_google', 'bidirectional']
        if v not in valid_directions:
            raise ValueError(f'Sync direction must be one of: {valid_directions}')
        return v

class TaskToCalendarSync(BaseModel):
    """Sync ECHO task to Google Calendar"""
    task_id: str = Field(..., description="ECHO task ID")
    calendar_id: str = Field("primary", description="Target Google Calendar ID")
    create_reminder: bool = Field(True, description="Create reminder for task deadline")
    reminder_minutes: int = Field(15, description="Minutes before deadline to remind")
    
    @validator('reminder_minutes')
    def validate_reminder_minutes(cls, v):
        """Validate reminder minutes"""
        if v < 0:
            raise ValueError('Reminder minutes must be non-negative')
        if v > 40320:  # 4 weeks in minutes
            raise ValueError('Reminder cannot be more than 4 weeks before deadline')
        return v

class HabitToCalendarSync(BaseModel):
    """Sync ECHO habit to Google Calendar"""
    habit_id: str = Field(..., description="ECHO habit ID")
    calendar_id: str = Field("primary", description="Target Google Calendar ID")
    schedule_time: Optional[str] = Field(None, description="Preferred time for habit (HH:MM format)")
    create_recurring: bool = Field(True, description="Create recurring events based on habit frequency")
    reminder_minutes: int = Field(10, description="Minutes before habit time to remind")
    
    @validator('schedule_time')
    def validate_schedule_time(cls, v):
        """Validate schedule time format"""
        if v is not None:
            try:
                time_parts = v.split(':')
                if len(time_parts) != 2:
                    raise ValueError
                hour, minute = int(time_parts[0]), int(time_parts[1])
                if not (0 <= hour <= 23) or not (0 <= minute <= 59):
                    raise ValueError
            except (ValueError, IndexError):
                raise ValueError('Schedule time must be in HH:MM format (24-hour)')
        return v
    
    @validator('reminder_minutes')
    def validate_reminder_minutes(cls, v):
        """Validate reminder minutes"""
        if v < 0:
            raise ValueError('Reminder minutes must be non-negative')
        if v > 1440:  # 24 hours in minutes
            raise ValueError('Reminder cannot be more than 24 hours before habit')
        return v

class GoogleCalendarSettings(BaseModel):
    """Google Calendar integration settings"""
    default_calendar_id: str = Field("primary", description="Default calendar for new events")
    auto_sync_tasks: bool = Field(False, description="Automatically sync tasks to calendar")
    auto_sync_habits: bool = Field(False, description="Automatically sync habits to calendar")
    sync_interval_minutes: int = Field(15, description="Sync interval in minutes")
    default_event_duration_minutes: int = Field(60, description="Default event duration")
    default_reminder_minutes: int = Field(15, description="Default reminder time")
    
    @validator('sync_interval_minutes')
    def validate_sync_interval(cls, v):
        """Validate sync interval"""
        if v < 5:
            raise ValueError('Sync interval must be at least 5 minutes')
        if v > 1440:  # 24 hours
            raise ValueError('Sync interval cannot be more than 24 hours')
        return v
    
    @validator('default_event_duration_minutes')
    def validate_event_duration(cls, v):
        """Validate event duration"""
        if v < 15:
            raise ValueError('Event duration must be at least 15 minutes')
        if v > 1440:  # 24 hours
            raise ValueError('Event duration cannot be more than 24 hours')
        return v