"""
Chat API Endpoints - The Interface for AI Conversations

These are the URLs your React frontend will call to chat with ECHO:
- POST /chat/message - Send a message to ECHO
- GET /chat/stream/{message} - Get streaming response
- GET /chat/history - Get conversation history
- GET /chat/health - Check AI system status
- GET /chat/context - Get current productivity context

Think of these as the "talk to ECHO" buttons!
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import asyncio
import json
import time
import logging

from app.core.database import get_db
from app.services.chat_service import ChatService
from app.services.local_ai_client import local_ai_client
from app.models.chat import ChatMessage
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageResponse, ChatStreamChunk,
    ChatConversationHistory, ChatHealthCheck, ChatContextSummary
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router for chat endpoints
router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse, status_code=201)
async def send_chat_message(
    message_data: ChatMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Send a message to ECHO and get an AI response
    
    This is the main chat endpoint where users talk to ECHO.
    
    What happens:
    1. User sends message: {"message": "How are my habits?"}
    2. ChatService builds context from user's tasks/habits
    3. OpenAI generates personalized response
    4. Response is saved to database
    5. User gets ECHO's intelligent reply
    
    Args:
        message_data: ChatMessageCreate schema with user's message
        background_tasks: For async operations
        db: Database session (automatically injected)
        
    Returns:
        ChatMessageResponse: ECHO's response with metadata
        
    Example Request:
        POST /chat/message
        {
            "message": "How are my habits going?",
            "include_context": true,
            "stream_response": false
        }
        
    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "message": "How are my habits going?",
            "response": "Great! You have a 5-day exercise streak and completed reading 3 times this week. Keep it up! 🔥",
            "response_time_ms": 1250,
            "created_at": "2024-01-10T15:30:00",
            "context_data": {
                "habits_count": 3,
                "best_streak": 5
            }
        }
    """
    try:
        start_time = time.time()
        
        # Create chat service
        chat_service = ChatService(db)
        
        # Get recent conversation history for context
        recent_history = chat_service.get_recent_chat_history(limit=6)
        conversation_history = [
            {"role": "user" if i % 2 == 0 else "assistant", "content": msg.message if i % 2 == 0 else msg.response}
            for i, msg in enumerate(recent_history)
        ]
        
        logger.info(f"Processing chat message: {message_data.message[:50]}...")
        
        # Generate AI response
        ai_response = await chat_service.generate_response(
            user_message=message_data.message,
            conversation_history=conversation_history if message_data.include_context else None
        )
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Build context data for saving
        context_data = None
        if message_data.include_context:
            context_data = chat_service._build_user_context()
        
        # Save the conversation to database (in background)
        def save_message():
            try:
                chat_service.save_chat_message(
                    user_message=message_data.message,
                    ai_response=ai_response,
                    response_time_ms=response_time_ms,
                    context_data=context_data
                )
            except Exception as e:
                logger.error(f"Failed to save chat message: {e}")
        
        background_tasks.add_task(save_message)
        
        # Create response object
        response = ChatMessageResponse(
            id="temp-id",  # Will be replaced when saved
            message=message_data.message,
            response=ai_response,
            response_time_ms=response_time_ms,
            created_at=time.time(),
            context_data=context_data
        )
        
        logger.info(f"Successfully generated response in {response_time_ms}ms")
        return response
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")


@router.get("/stream/{message}")
async def stream_chat_response(
    message: str,
    include_context: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get a streaming response from ECHO
    
    This provides real-time response streaming for better UX.
    The response appears to "type" in real-time like ChatGPT.
    
    Args:
        message: The user's message (URL encoded)
        include_context: Whether to include productivity context
        db: Database session
        
    Returns:
        StreamingResponse: Real-time response chunks
        
    Example Request:
        GET /chat/stream/How%20are%20my%20habits%20going?include_context=true
        
    Example Response (streaming):
        data: {"chunk": "Great question! You're doing", "is_complete": false, "chunk_index": 0}
        data: {"chunk": " really well with your habits.", "is_complete": false, "chunk_index": 1}
        data: {"chunk": " You have a 5-day streak! 🔥", "is_complete": true, "chunk_index": 2}
    """
    async def generate_stream():
        """Generate the streaming response"""
        try:
            chat_service = ChatService(db)
            
            # Get conversation history if needed
            conversation_history = None
            if include_context:
                recent_history = chat_service.get_recent_chat_history(limit=6)
                conversation_history = [
                    {"role": "user" if i % 2 == 0 else "assistant", "content": msg.message if i % 2 == 0 else msg.response}
                    for i, msg in enumerate(recent_history)
                ]
            
            chunk_index = 0
            full_response = ""
            
            # Generate streaming response
            async for chunk in chat_service.generate_streaming_response(
                user_message=message,
                conversation_history=conversation_history
            ):
                full_response += chunk
                
                # Create chunk response
                chunk_data = ChatStreamChunk(
                    chunk=chunk,
                    is_complete=False,
                    chunk_index=chunk_index
                )
                
                # Yield as Server-Sent Events format
                yield f"data: {chunk_data.model_dump_json()}\n\n"
                chunk_index += 1
                
                # Small delay for better UX
                await asyncio.sleep(0.05)
            
            # Send completion marker
            final_chunk = ChatStreamChunk(
                chunk="",
                is_complete=True,
                chunk_index=chunk_index
            )
            yield f"data: {final_chunk.model_dump_json()}\n\n"
            
            # Save the complete conversation (fire and forget)
            try:
                context_data = chat_service._build_user_context() if include_context else None
                chat_service.save_chat_message(
                    user_message=message,
                    ai_response=full_response,
                    context_data=context_data
                )
            except Exception as e:
                logger.error(f"Failed to save streamed message: {e}")
                
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            error_chunk = ChatStreamChunk(
                chunk="I apologize, but I encountered an error. Please try again.",
                is_complete=True,
                chunk_index=0
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


@router.get("/history", response_model=ChatConversationHistory)
def get_chat_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get recent chat conversation history
    
    Args:
        limit: Maximum number of messages to return
        db: Database session
        
    Returns:
        ChatConversationHistory: Recent messages and context
        
    Example Request:
        GET /chat/history?limit=10
        
    Example Response:
        {
            "messages": [
                {
                    "id": "123...",
                    "message": "How are my habits?",
                    "response": "You're doing great! 5-day streak on exercise.",
                    "created_at": "2024-01-10T15:30:00"
                }
            ],
            "total_messages": 25,
            "context_summary": {
                "current_date": "2024-01-10",
                "tasks_summary": {...},
                "habits_summary": {...}
            }
        }
    """
    try:
        chat_service = ChatService(db)
        
        # Get recent messages
        recent_messages = chat_service.get_recent_chat_history(limit=limit)
        
        # Get total message count
        total_messages = chat_service.db.query(chat_service.db.query(ChatMessage).count()).scalar()
        
        # Build current context summary
        context_summary = chat_service._build_user_context()
        
        return ChatConversationHistory(
            messages=recent_messages,
            total_messages=total_messages,
            context_summary=context_summary
        )
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")


@router.get("/health", response_model=ChatHealthCheck)
async def get_chat_health():
    """
    Check the health status of the chat system
    
    This tells users whether AI features are working or if
    they're in fallback mode.
    
    Returns:
        ChatHealthCheck: System status information
        
    Example Request:
        GET /chat/health
        
    Example Response:
        {
            "ai_available": true,
            "fallback_mode": false,
            "last_successful_request": "2024-01-10T15:30:00",
            "status_message": "AI chat is fully operational"
        }
    """
    try:
        ai_available = await local_ai_client.is_available()
        
        if ai_available:
            status_message = "Local AI chat is fully operational 🤖"
            fallback_mode = False
        else:
            status_message = "Local AI is unavailable. Please check that Ollama is running."
            fallback_mode = True
        
        return ChatHealthCheck(
            ai_available=ai_available,
            fallback_mode=fallback_mode,
            last_successful_request=None,  # Could track this in the future
            status_message=status_message
        )
        
    except Exception as e:
        logger.error(f"Error checking chat health: {e}")
        return ChatHealthCheck(
            ai_available=False,
            fallback_mode=True,
            last_successful_request=None,
            status_message="Chat system experiencing issues"
        )


@router.get("/context", response_model=ChatContextSummary)
def get_chat_context(db: Session = Depends(get_db)):
    """
    Get the current productivity context that ECHO uses
    
    This shows users what information ECHO has about their
    current tasks, habits, and productivity state.
    
    Args:
        db: Database session
        
    Returns:
        ChatContextSummary: Current productivity context
        
    Example Request:
        GET /chat/context
        
    Example Response:
        {
            "current_date": "2024-01-10",
            "tasks_summary": {
                "total": 8,
                "completed": 5,
                "pending": 3,
                "overdue": 1
            },
            "habits_summary": {
                "total": 4,
                "active": 3,
                "best_streak": 7
            },
            "insights": {
                "completion_rate": 62.5,
                "has_overdue_tasks": true
            },
            "recommendations": [
                "Focus on that overdue task first",
                "Great job on your 7-day exercise streak!"
            ]
        }
    """
    try:
        chat_service = ChatService(db)
        context = chat_service._build_user_context()
        
        # Generate some basic recommendations
        recommendations = []
        insights = context.get('insights', {})
        
        if insights.get('has_overdue_tasks'):
            recommendations.append("Focus on overdue tasks to get back on track")
        
        if insights.get('completion_rate', 0) > 80:
            recommendations.append("Excellent task completion rate! Keep it up!")
        
        best_streak = context.get('habits', {}).get('best_streak', 0)
        if best_streak > 0:
            recommendations.append(f"Amazing {best_streak}-day streak! Don't break the chain!")
        
        if not recommendations:
            recommendations.append("You're doing well! Keep building those productive habits.")
        
        return ChatContextSummary(
            current_date=context.get('current_date', ''),
            tasks_summary=context.get('tasks', {}),
            habits_summary=context.get('habits', {}),
            insights=context.get('insights', {}),
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error getting chat context: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get context: {str(e)}")


# Summary of all chat endpoints:
"""
POST   /chat/message        - Send message to ECHO (get AI response)
GET    /chat/stream/{msg}   - Get streaming response from ECHO
GET    /chat/history        - Get conversation history
GET    /chat/health         - Check AI system status
GET    /chat/context        - Get current productivity context

These endpoints provide complete AI chat functionality with personalized responses!
"""