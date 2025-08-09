"""
Habit and HabitLog models
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, Enum, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from typing import Optional, List
from uuid import uuid4

from app.core.database import Base
from app.models.enums import HabitFrequency


class Habit(Base):
    """Habit model for tracking user habits"""
    __tablename__ = "habits"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    frequency: Mapped[HabitFrequency] = mapped_column(Enum(HabitFrequency))
    target_count: Mapped[int] = mapped_column(Integer, default=1)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    logs: Mapped[List["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Habit(id={self.id}, name='{self.name}', frequency={self.frequency})>"


class HabitLog(Base):
    """HabitLog model for tracking habit completions"""
    __tablename__ = "habit_logs"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    habit_id: Mapped[str] = mapped_column(String, ForeignKey("habits.id"), nullable=False)
    completed_date: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    
    # Relationships
    habit: Mapped["Habit"] = relationship(back_populates="logs")
    
    def __repr__(self) -> str:
        return f"<HabitLog(id={self.id}, habit_id={self.habit_id}, date={self.completed_date})>"