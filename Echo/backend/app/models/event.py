"""
Event model for calendar functionality
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from app.core.database import Base
from app.models.enums import EventType, EventStatus, RecurrenceType


class Event(Base):
    """Event model for storing calendar events"""
    __tablename__ = "events"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String)
    
    # Date and time fields
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Event properties
    event_type: Mapped[EventType] = mapped_column(String, default=EventType.PERSONAL)
    status: Mapped[EventStatus] = mapped_column(String, default=EventStatus.SCHEDULED)
    
    # Recurrence settings
    recurrence_type: Mapped[RecurrenceType] = mapped_column(String, default=RecurrenceType.NONE)
    recurrence_interval: Mapped[Optional[int]] = mapped_column(Integer)  # Every N days/weeks/months
    recurrence_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    recurrence_count: Mapped[Optional[int]] = mapped_column(Integer)  # Number of occurrences
    
    # Relationships
    task_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("tasks.id"))
    habit_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("habits.id"))
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships (will be defined when we have the related models)
    # task = relationship("Task", back_populates="events")
    # habit = relationship("Habit", back_populates="events")
    
    def __repr__(self) -> str:
        return f"<Event(id={self.id}, title='{self.title}', start_time={self.start_time})>"
    
    @property
    def duration_minutes(self) -> int:
        """Calculate event duration in minutes"""
        if self.all_day:
            return 24 * 60  # Full day
        return int((self.end_time - self.start_time).total_seconds() / 60)
    
    @property
    def is_recurring(self) -> bool:
        """Check if event is recurring"""
        return self.recurrence_type != RecurrenceType.NONE
    
    def is_conflicting_with(self, other_event: 'Event') -> bool:
        """Check if this event conflicts with another event"""
        if self.all_day or other_event.all_day:
            # For all-day events, check if they're on the same date
            return self.start_time.date() == other_event.start_time.date()
        
        # Check for time overlap
        return (
            self.start_time < other_event.end_time and
            self.end_time > other_event.start_time
        )


class EventReminder(Base):
    """Event reminder model for storing reminder settings"""
    __tablename__ = "event_reminders"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False)
    
    # Reminder timing (minutes before event)
    minutes_before: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Reminder method (email, notification, etc.)
    method: Mapped[str] = mapped_column(String, default="notification")
    
    # Status
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    
    # Relationships
    event = relationship("Event", backref="reminders")
    
    def __repr__(self) -> str:
        return f"<EventReminder(id={self.id}, event_id={self.event_id}, minutes_before={self.minutes_before})>"