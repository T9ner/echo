"""
Chat Service - The Intelligence Layer for ECHO AI

This is the brain that makes ECHO smart about your productivity:
1. Builds context from your tasks and habits
2. Creates intelligent prompts for GPT
3. Manages conversation history
4. Provides personalized responses

Think of this as ECHO's memory and reasoning system!
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime, date, timedelta
import json
import logging

from app.services.local_ai_client import local_ai_client
from app.services.task_service import TaskService
from app.services.habit_service import HabitService
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)


class ChatService:
    """
    Chat Service - The intelligence layer for ECHO AI
    
    This service makes ECHO smart by:
    - Understanding your current productivity state
    - Building context from your tasks and habits
    - Generating personalized responses
    - Maintaining conversation history
    """
    
    def __init__(self, db: Session):
        """
        Initialize the chat service
        
        Args:
            db: Database session for accessing user data
        """
        self.db = db
        self.task_service = TaskService(db)
        self.habit_service = HabitService(db)
    
    def _build_user_context(self) -> Dict[str, Any]:
        """
        Build context about the user's current productivity state
        
        This gathers information about tasks, habits, and progress
        to help ECHO give personalized advice.
        
        Returns:
            Dictionary with user's productivity context
        """
        try:
            # Get task statistics
            task_stats = self.task_service.get_task_statistics()
            
            # Get recent tasks
            recent_tasks = self.task_service.get_all_tasks(limit=5)
            
            # Get all habits with their statistics
            habits = self.habit_service.get_all_habits(limit=10)
            habit_stats = self.habit_service.get_all_habits_statistics()
            
            # Get overdue tasks (handle timezone differences)
            now = datetime.now()
            overdue_tasks = []
            for task in recent_tasks:
                if task.due_date and task.status.value != 'completed':
                    try:
                        # Handle both timezone-aware and naive datetimes
                        if task.due_date.tzinfo is not None:
                            # Task due date is timezone-aware, make now timezone-aware too
                            from datetime import timezone
                            now_aware = now.replace(tzinfo=timezone.utc)
                            if task.due_date < now_aware:
                                overdue_tasks.append(task)
                        else:
                            # Both are naive, safe to compare
                            if task.due_date < now:
                                overdue_tasks.append(task)
                    except Exception as e:
                        logger.warning(f"Error comparing date for task {task.id}: {e}")
                        continue
            
            # Build context dictionary
            context = {
                "current_date": date.today().isoformat(),
                "current_time": datetime.now().strftime("%H:%M"),
                "tasks": {
                    "total": task_stats["total"],
                    "completed": task_stats["completed"],
                    "pending": task_stats["pending"],
                    "overdue": task_stats["overdue"],
                    "recent": [
                        {
                            "title": task.title,
                            "status": task.status.value,
                            "priority": task.priority.value,
                            "due_date": task.due_date.isoformat() if task.due_date else None
                        }
                        for task in recent_tasks[:3]  # Top 3 recent tasks
                    ]
                },
                "habits": {
                    "total": habit_stats["total_habits"],
                    "active": habit_stats["active_habits"],
                    "best_streak": habit_stats["best_current_streak"],
                    "list": [
                        {
                            "name": habit.name,
                            "frequency": habit.frequency.value,
                            "current_streak": habit.current_streak,
                            "longest_streak": habit.longest_streak
                        }
                        for habit in habits[:5]  # Top 5 habits
                    ]
                },
                "insights": {
                    "has_overdue_tasks": len(overdue_tasks) > 0,
                    "overdue_count": len(overdue_tasks),
                    "completion_rate": round((task_stats["completed"] / max(task_stats["total"], 1)) * 100, 1),
                    "active_habits_ratio": round((habit_stats["active_habits"] / max(habit_stats["total_habits"], 1)) * 100, 1)
                }
            }
            
            logger.info(f"Built user context with {task_stats['total']} tasks and {habit_stats['total_habits']} habits")
            return context
            
        except Exception as e:
            logger.error(f"Error building user context: {e}")
            return {
                "current_date": date.today().isoformat(),
                "current_time": datetime.now().strftime("%H:%M"),
                "error": "Unable to load productivity data"
            }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """
        Create the system prompt that defines ECHO's personality and knowledge
        
        This is where we tell GPT how to behave as ECHO and what it knows
        about the user's productivity state.
        
        Args:
            context: User's productivity context
            
        Returns:
            System prompt string
        """
        prompt = f"""You are ECHO, an AI productivity assistant. You are helpful, encouraging, and focused on helping users achieve their goals.

CURRENT USER CONTEXT:
- Date: {context.get('current_date')}
- Time: {context.get('current_time')}

TASKS STATUS:
- Total tasks: {context.get('tasks', {}).get('total', 0)}
- Completed: {context.get('tasks', {}).get('completed', 0)}
- Pending: {context.get('tasks', {}).get('pending', 0)}
- Overdue: {context.get('tasks', {}).get('overdue', 0)}

HABITS STATUS:
- Total habits: {context.get('habits', {}).get('total', 0)}
- Active habits (with streaks): {context.get('habits', {}).get('active', 0)}
- Best current streak: {context.get('habits', {}).get('best_streak', 0)} days

RECENT TASKS:"""
        
        # Add recent tasks to prompt
        recent_tasks = context.get('tasks', {}).get('recent', [])
        if recent_tasks:
            for task in recent_tasks:
                status_emoji = "✅" if task['status'] == 'completed' else "⏳" if task['status'] == 'in_progress' else "📋"
                priority_emoji = "🔥" if task['priority'] == 'high' else "⚡" if task['priority'] == 'urgent' else ""
                prompt += f"\n- {status_emoji} {task['title']} ({task['status']}) {priority_emoji}"
        else:
            prompt += "\n- No recent tasks"
        
        prompt += "\n\nHABITS:"
        
        # Add habits to prompt
        habits = context.get('habits', {}).get('list', [])
        if habits:
            for habit in habits:
                streak_emoji = "🔥" if habit['current_streak'] > 0 else "💤"
                prompt += f"\n- {streak_emoji} {habit['name']} ({habit['frequency']}) - {habit['current_streak']} day streak"
        else:
            prompt += "\n- No habits tracked yet"
        
        # Add insights
        insights = context.get('insights', {})
        if insights.get('has_overdue_tasks'):
            prompt += f"\n\n⚠️ ATTENTION: User has {insights['overdue_count']} overdue tasks that need attention."
        
        prompt += f"""

PERSONALITY GUIDELINES:
- Be encouraging and positive
- Provide actionable advice
- Reference specific tasks and habits when relevant
- Use emojis sparingly but effectively
- Keep responses concise but helpful
- If asked about tasks or habits, refer to the specific data above
- Help with productivity strategies, time management, and motivation
- If the user seems overwhelmed, suggest breaking things down into smaller steps

CAPABILITIES:
- You can discuss the user's current tasks and habits
- You can provide productivity advice and motivation
- You can suggest strategies for building habits and completing tasks
- You cannot directly modify tasks or habits (user must use the app interface)
- You cannot access external information beyond what's provided in this context

Remember: You are ECHO, the user's personal productivity companion. Be helpful, encouraging, and focus on their success!"""
        
        return prompt
    
    async def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate a response to the user's message
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
            
        Returns:
            ECHO's response
        """
        try:
            # Build current context
            context = self._build_user_context()
            
            # Create system prompt
            system_prompt = self._create_system_prompt(context)
            
            # Build message history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-6:])  # Keep last 6 messages for context
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response using Local AI
            logger.info(f"USE_LOCAL_AI setting: {settings.USE_LOCAL_AI}")
            if settings.USE_LOCAL_AI:
                logger.info("Attempting to use local AI...")
                response = await local_ai_client.generate_response(messages)
                logger.info(f"Local AI response: {response}")
                if response:
                    logger.info("Successfully generated Local AI response")
                    return response
                else:
                    logger.warning("Local AI failed, using contextual fallback")
            else:
                logger.info("Local AI disabled in configuration")
            
            # If local AI fails or is disabled, use contextual fallback
            logger.warning("Using contextual fallback response")
            return self._generate_contextual_fallback(user_message, context)
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
    
    async def generate_streaming_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response to the user's message
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
            
        Yields:
            Response chunks as they arrive
        """
        try:
            # Build current context
            context = self._build_user_context()
            
            # Create system prompt
            system_prompt = self._create_system_prompt(context)
            
            # Build message history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-6:])  # Keep last 6 messages for context
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Generate streaming response using Local AI
            if settings.USE_LOCAL_AI:
                async for chunk in local_ai_client.generate_streaming_response(messages):
                    yield chunk
            else:
                # If local AI is disabled, provide fallback message
                yield "Local AI is currently disabled. Please enable it in your configuration to use the chat feature."
                
        except Exception as e:
            logger.error(f"Error generating streaming response: {e}")
            yield "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
    
    def _generate_contextual_fallback(self, user_message: str, context: Dict[str, Any]) -> str:
        """
        Generate a contextual fallback response using user's data
        
        This provides intelligent responses even when OpenAI is unavailable
        by using the user's actual productivity data.
        
        Args:
            user_message: The user's message
            context: User's productivity context
            
        Returns:
            Contextual fallback response
        """
        user_lower = user_message.lower()
        
        # Task-related queries
        if any(word in user_lower for word in ['task', 'todo', 'work', 'complete']):
            task_stats = context.get('tasks', {})
            total = task_stats.get('total', 0)
            completed = task_stats.get('completed', 0)
            pending = task_stats.get('pending', 0)
            overdue = task_stats.get('overdue', 0)
            
            if total == 0:
                return "You don't have any tasks yet! Creating tasks is a great way to stay organized and productive. Try adding some tasks to get started."
            
            response = f"You currently have {total} tasks: {completed} completed, {pending} pending"
            if overdue > 0:
                response += f", and {overdue} overdue ⚠️"
            response += ". "
            
            if overdue > 0:
                response += "I'd recommend focusing on those overdue tasks first!"
            elif pending > 0:
                response += "Keep up the great work on your remaining tasks!"
            else:
                response += "Excellent! All your tasks are complete! 🎉"
            
            return response
        
        # Habit-related queries
        elif any(word in user_lower for word in ['habit', 'streak', 'daily', 'routine']):
            habit_stats = context.get('habits', {})
            total = habit_stats.get('total', 0)
            active = habit_stats.get('active', 0)
            best_streak = habit_stats.get('best_streak', 0)
            
            if total == 0:
                return "You haven't created any habits yet! Building good habits is key to long-term success. Try creating a habit to track something you want to do regularly."
            
            response = f"You're tracking {total} habits, with {active} currently active"
            if best_streak > 0:
                response += f". Your best current streak is {best_streak} days! 🔥"
            else:
                response += ". Try logging some completions to build your streaks!"
            
            return response
        
        # Progress/status queries
        elif any(word in user_lower for word in ['how', 'progress', 'doing', 'status']):
            task_stats = context.get('tasks', {})
            habit_stats = context.get('habits', {})
            insights = context.get('insights', {})
            
            response = "Here's your productivity overview:\n\n"
            response += f"📋 Tasks: {task_stats.get('completed', 0)}/{task_stats.get('total', 0)} completed"
            
            if insights.get('has_overdue_tasks'):
                response += f" ({insights.get('overdue_count', 0)} overdue)"
            
            response += f"\n🎯 Habits: {habit_stats.get('active', 0)}/{habit_stats.get('total', 0)} active"
            
            if habit_stats.get('best_streak', 0) > 0:
                response += f" (best streak: {habit_stats.get('best_streak')} days)"
            
            if insights.get('completion_rate', 0) > 80:
                response += "\n\n🌟 You're doing great! Keep up the excellent work!"
            elif insights.get('has_overdue_tasks'):
                response += "\n\n💪 Focus on those overdue tasks to get back on track!"
            else:
                response += "\n\n👍 You're making good progress! Keep it up!"
            
            return response
        
        # Default fallback
        else:
            return local_ai_client.get_fallback_response(user_message)
    
    def save_chat_message(
        self,
        user_message: str,
        ai_response: str,
        response_time_ms: Optional[int] = None,
        context_data: Optional[Dict] = None
    ) -> ChatMessage:
        """
        Save a chat message to the database
        
        Args:
            user_message: The user's message
            ai_response: ECHO's response
            response_time_ms: How long the response took to generate
            context_data: Additional context data
            
        Returns:
            The saved ChatMessage
        """
        try:
            chat_message = ChatMessage(
                message=user_message,
                response=ai_response,
                response_time_ms=response_time_ms,
                context_data=context_data
            )
            
            self.db.add(chat_message)
            self.db.commit()
            self.db.refresh(chat_message)
            
            logger.info(f"Saved chat message with ID: {chat_message.id}")
            return chat_message
            
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
            self.db.rollback()
            raise
    
    def get_recent_chat_history(self, limit: int = 10) -> List[ChatMessage]:
        """
        Get recent chat messages for conversation context
        
        Args:
            limit: Maximum number of messages to return
            
        Returns:
            List of recent chat messages
        """
        try:
            messages = self.db.query(ChatMessage).order_by(
                ChatMessage.created_at.desc()
            ).limit(limit).all()
            
            # Reverse to get chronological order
            return list(reversed(messages))
            
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []


# Example usage:
"""
# Create chat service
chat_service = ChatService(db)

# Generate response
response = await chat_service.generate_response("How are my habits going?")

# Generate streaming response
async for chunk in chat_service.generate_streaming_response("What should I focus on today?"):
    print(chunk, end='', flush=True)

# Save conversation
chat_service.save_chat_message("Hello!", "Hi there! How can I help you today?")
"""