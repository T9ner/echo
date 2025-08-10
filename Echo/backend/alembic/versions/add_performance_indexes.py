"""Add performance indexes

Revision ID: add_performance_indexes
Revises: 
Create Date: 2024-01-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = None
depends_on = None


def upgrade() -> None:
    """Add performance indexes for frequently queried columns"""
    
    # Task table indexes
    op.create_index('idx_tasks_status', 'tasks', ['status'])
    op.create_index('idx_tasks_priority', 'tasks', ['priority'])
    op.create_index('idx_tasks_created_at', 'tasks', ['created_at'])
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date'])
    op.create_index('idx_tasks_completed_at', 'tasks', ['completed_at'])
    op.create_index('idx_tasks_status_priority', 'tasks', ['status', 'priority'])
    op.create_index('idx_tasks_status_created_at', 'tasks', ['status', 'created_at'])
    
    # Habit table indexes
    op.create_index('idx_habits_frequency', 'habits', ['frequency'])
    op.create_index('idx_habits_created_at', 'habits', ['created_at'])
    op.create_index('idx_habits_current_streak', 'habits', ['current_streak'])
    
    # Habit logs indexes
    op.create_index('idx_habit_logs_habit_id', 'habit_logs', ['habit_id'])
    op.create_index('idx_habit_logs_completed_date', 'habit_logs', ['completed_date'])
    op.create_index('idx_habit_logs_habit_date', 'habit_logs', ['habit_id', 'completed_date'])
    op.create_index('idx_habit_logs_created_at', 'habit_logs', ['created_at'])
    
    # Chat messages indexes
    op.create_index('idx_chat_messages_created_at', 'chat_messages', ['created_at'])


def downgrade() -> None:
    """Remove performance indexes"""
    
    # Task table indexes
    op.drop_index('idx_tasks_status')
    op.drop_index('idx_tasks_priority')
    op.drop_index('idx_tasks_created_at')
    op.drop_index('idx_tasks_due_date')
    op.drop_index('idx_tasks_completed_at')
    op.drop_index('idx_tasks_status_priority')
    op.drop_index('idx_tasks_status_created_at')
    
    # Habit table indexes
    op.drop_index('idx_habits_frequency')
    op.drop_index('idx_habits_created_at')
    op.drop_index('idx_habits_current_streak')
    
    # Habit logs indexes
    op.drop_index('idx_habit_logs_habit_id')
    op.drop_index('idx_habit_logs_completed_date')
    op.drop_index('idx_habit_logs_habit_date')
    op.drop_index('idx_habit_logs_created_at')
    
    # Chat messages indexes
    op.drop_index('idx_chat_messages_created_at')