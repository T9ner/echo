"""
Enums for database models
"""
import enum


class TaskStatus(str, enum.Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class HabitFrequency(str, enum.Enum):
    """Habit frequency enumeration"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class EventType(str, enum.Enum):
    """Event type enumeration"""
    MEETING = "meeting"
    TASK = "task"
    PERSONAL = "personal"
    REMINDER = "reminder"
    APPOINTMENT = "appointment"


class EventStatus(str, enum.Enum):
    """Event status enumeration"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RecurrenceType(str, enum.Enum):
    """Event recurrence type enumeration"""
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"