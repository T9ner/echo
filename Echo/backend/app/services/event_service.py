"""
Event service for calendar functionality
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
import logging

from app.models.event import Event, EventReminder
from app.models.enums import EventStatus, RecurrenceType
from app.schemas.event import (
    EventCreate, EventUpdate, EventFilter, EventConflictCheck,
    EventReminderCreate, BulkEventCreate
)

logger = logging.getLogger(__name__)


class EventService:
    """Service class for event operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_event(self, event_data: EventCreate) -> Event:
        """Create a new event"""
        try:
            # Create the event
            event = Event(**event_data.dict())
            self.db.add(event)
            self.db.commit()
            self.db.refresh(event)
            
            logger.info(f"Created event: {event.id} - {event.title}")
            return event
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating event: {e}")
            raise
    
    def get_event(self, event_id: str) -> Optional[Event]:
        """Get event by ID"""
        return self.db.query(Event).filter(Event.id == event_id).first()
    
    def update_event(self, event_id: str, event_data: EventUpdate) -> Optional[Event]:
        """Update an existing event"""
        try:
            event = self.get_event(event_id)
            if not event:
                return None
            
            # Update only provided fields
            update_data = event_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(event, field, value)
            
            self.db.commit()
            self.db.refresh(event)
            
            logger.info(f"Updated event: {event.id} - {event.title}")
            return event
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating event {event_id}: {e}")
            raise
    
    def delete_event(self, event_id: str) -> bool:
        """Delete an event"""
        try:
            event = self.get_event(event_id)
            if not event:
                return False
            
            # Delete associated reminders first
            self.db.query(EventReminder).filter(EventReminder.event_id == event_id).delete()
            
            # Delete the event
            self.db.delete(event)
            self.db.commit()
            
            logger.info(f"Deleted event: {event_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting event {event_id}: {e}")
            raise
    
    def get_events(
        self,
        filters: Optional[EventFilter] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """Get events with filtering and pagination"""
        try:
            query = self.db.query(Event)
            
            # Apply filters
            if filters:
                if filters.start_date:
                    query = query.filter(Event.end_time >= filters.start_date)
                if filters.end_date:
                    query = query.filter(Event.start_time <= filters.end_date)
                if filters.event_type:
                    query = query.filter(Event.event_type == filters.event_type)
                if filters.status:
                    query = query.filter(Event.status == filters.status)
                if filters.search:
                    search_term = f"%{filters.search}%"
                    query = query.filter(
                        or_(
                            Event.title.ilike(search_term),
                            Event.description.ilike(search_term),
                            Event.location.ilike(search_term)
                        )
                    )
                if filters.task_id:
                    query = query.filter(Event.task_id == filters.task_id)
                if filters.habit_id:
                    query = query.filter(Event.habit_id == filters.habit_id)
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            events = (
                query
                .order_by(Event.start_time)
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )
            
            return {
                "events": events,
                "total": total,
                "page": page,
                "per_page": per_page,
                "has_next": page * per_page < total,
                "has_prev": page > 1
            }
            
        except Exception as e:
            logger.error(f"Error getting events: {e}")
            raise
    
    def get_month_events(self, year: int, month: int) -> List[Event]:
        """Get all events for a specific month"""
        try:
            # Calculate month boundaries
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            
            events = (
                self.db.query(Event)
                .filter(
                    and_(
                        Event.start_time < end_date,
                        Event.end_time >= start_date
                    )
                )
                .order_by(Event.start_time)
                .all()
            )
            
            logger.info(f"Retrieved {len(events)} events for {year}-{month:02d}")
            return events
            
        except Exception as e:
            logger.error(f"Error getting month events for {year}-{month}: {e}")
            raise
    
    def get_day_events(self, target_date: date) -> List[Event]:
        """Get all events for a specific day"""
        try:
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            events = (
                self.db.query(Event)
                .filter(
                    and_(
                        Event.start_time <= end_datetime,
                        Event.end_time >= start_datetime
                    )
                )
                .order_by(Event.start_time)
                .all()
            )
            
            return events
            
        except Exception as e:
            logger.error(f"Error getting day events for {target_date}: {e}")
            raise
    
    def check_conflicts(self, conflict_check: EventConflictCheck) -> Dict[str, Any]:
        """Check for event conflicts"""
        try:
            query = self.db.query(Event).filter(
                Event.status != EventStatus.CANCELLED
            )
            
            # Exclude specific event if provided (for updates)
            if conflict_check.exclude_event_id:
                query = query.filter(Event.id != conflict_check.exclude_event_id)
            
            if conflict_check.all_day:
                # For all-day events, check for same date conflicts
                target_date = conflict_check.start_time.date()
                conflicting_events = []
                
                # Check all events on the same date
                day_events = self.get_day_events(target_date)
                for event in day_events:
                    if event.all_day or event.start_time.date() == target_date:
                        conflicting_events.append(event)
            else:
                # Check for time overlap
                conflicting_events = (
                    query
                    .filter(
                        and_(
                            Event.start_time < conflict_check.end_time,
                            Event.end_time > conflict_check.start_time
                        )
                    )
                    .all()
                )
            
            return {
                "has_conflicts": len(conflicting_events) > 0,
                "conflicting_events": conflicting_events
            }
            
        except Exception as e:
            logger.error(f"Error checking conflicts: {e}")
            raise
    
    def create_bulk_events(self, bulk_data: BulkEventCreate) -> Dict[str, Any]:
        """Create multiple events in bulk"""
        created_events = []
        failed_events = []
        
        try:
            for event_data in bulk_data.events:
                try:
                    event = Event(**event_data.dict())
                    self.db.add(event)
                    self.db.flush()  # Get the ID without committing
                    created_events.append(event)
                except Exception as e:
                    failed_events.append({
                        "event_data": event_data.dict(),
                        "error": str(e)
                    })
            
            # Commit all successful events
            self.db.commit()
            
            # Refresh all created events
            for event in created_events:
                self.db.refresh(event)
            
            logger.info(f"Bulk created {len(created_events)} events, {len(failed_events)} failed")
            
            return {
                "created_events": created_events,
                "failed_events": failed_events,
                "total_created": len(created_events),
                "total_failed": len(failed_events)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error in bulk event creation: {e}")
            raise
    
    # Event Reminder Methods
    def add_reminder(self, event_id: str, reminder_data: EventReminderCreate) -> Optional[EventReminder]:
        """Add a reminder to an event"""
        try:
            # Check if event exists
            event = self.get_event(event_id)
            if not event:
                return None
            
            reminder = EventReminder(
                event_id=event_id,
                **reminder_data.dict()
            )
            
            self.db.add(reminder)
            self.db.commit()
            self.db.refresh(reminder)
            
            logger.info(f"Added reminder to event {event_id}")
            return reminder
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding reminder to event {event_id}: {e}")
            raise
    
    def get_event_reminders(self, event_id: str) -> List[EventReminder]:
        """Get all reminders for an event"""
        return (
            self.db.query(EventReminder)
            .filter(EventReminder.event_id == event_id)
            .order_by(EventReminder.minutes_before)
            .all()
        )
    
    def get_pending_reminders(self, check_time: datetime) -> List[EventReminder]:
        """Get reminders that should be sent at the given time"""
        try:
            # Calculate the time window for reminders
            reminders = (
                self.db.query(EventReminder)
                .join(Event)
                .filter(
                    and_(
                        EventReminder.sent == False,
                        Event.status == EventStatus.SCHEDULED,
                        Event.start_time > check_time,  # Event hasn't started yet
                        func.extract('epoch', Event.start_time - check_time) / 60 <= EventReminder.minutes_before
                    )
                )
                .all()
            )
            
            return reminders
            
        except Exception as e:
            logger.error(f"Error getting pending reminders: {e}")
            raise
    
    def mark_reminder_sent(self, reminder_id: str) -> bool:
        """Mark a reminder as sent"""
        try:
            reminder = self.db.query(EventReminder).filter(EventReminder.id == reminder_id).first()
            if not reminder:
                return False
            
            reminder.sent = True
            reminder.sent_at = datetime.utcnow()
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking reminder {reminder_id} as sent: {e}")
            raise
    
    # Utility Methods
    def get_events_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Event]:
        """Get events within a date range"""
        return (
            self.db.query(Event)
            .filter(
                and_(
                    Event.start_time <= end_date,
                    Event.end_time >= start_date
                )
            )
            .order_by(Event.start_time)
            .all()
        )
    
    def get_upcoming_events(self, limit: int = 10) -> List[Event]:
        """Get upcoming events"""
        now = datetime.utcnow()
        return (
            self.db.query(Event)
            .filter(
                and_(
                    Event.start_time > now,
                    Event.status == EventStatus.SCHEDULED
                )
            )
            .order_by(Event.start_time)
            .limit(limit)
            .all()
        )
    
    def get_events_count_by_type(self) -> Dict[str, int]:
        """Get count of events by type"""
        try:
            result = (
                self.db.query(Event.event_type, func.count(Event.id))
                .group_by(Event.event_type)
                .all()
            )
            
            return {event_type: count for event_type, count in result}
            
        except Exception as e:
            logger.error(f"Error getting events count by type: {e}")
            raise