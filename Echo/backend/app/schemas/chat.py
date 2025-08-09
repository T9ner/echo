"""
Chat Pydantic Schemas - Data Validation for AI Chat Interface

These schemas define:
1. How to send messages to ECHO
2. How ECHO responds with AI-generated content
3. Chat history and conversation management
4. Streaming response formats

Think of these as the conversation protocol between user and AI!
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ChatMessageCreate(BaseModel):
    """
    Schema for creating a new chat message
    
    When a user sends a message to ECHO:
    - message: "How are my habits going?"
    - include_context: True (to include productivity data)
    """
    message: str = Field(..., min_length=1, max_length=2000, description="User's message to ECHO")
    include_context: bool = Field(default=True, description="Whether to include productivity context")
    stream_response: bool = Field(default=False, description="Whether to stream the response")


class ChatMessageResponse(BaseModel):
    """
    Schema for ECHO's response to a chat message
    
    Contains the AI-generated response plus metadata
    """
    id: str = Field(..., description="Unique message identifier")
    message: str = Field(..., description="Original user message")
    response: str = Field(..., description="ECHO's AI-generated response")
    response_time_ms: Optional[int] = Field(None, description="Response generation time in milliseconds")
    created_at: datetime = Field(..., description="When the message was created")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Context data used for response")
    
    class Config:
        """Tell Pydantic to work with SQLAlchemy models"""
        from_attributes = True


class ChatStreamChunk(BaseModel):
    """
    Schema for streaming response chunks
    
    Used when ECHO streams responses in real-time
    """
    chunk: str = Field(..., description="Part of the response")
    is_complete: bool = Field(default=False, description="Whether this is the final chunk")
    chunk_index: int = Field(..., description="Order of this chunk in the response")


class ChatConversationHistory(BaseModel):
    """
    Schema for conversation history
    
    Contains recent messages for context
    """
    messages: List[ChatMessageResponse] = Field(default=[], description="Recent chat messages")
    total_messages: int = Field(..., description="Total number of messages in history")
    context_summary: Optional[Dict[str, Any]] = Field(None, description="Summary of user's current state")


class ChatHealthCheck(BaseModel):
    """
    Schema for chat system health status
    
    Tells users if AI features are working
    """
    ai_available: bool = Field(..., description="Whether OpenAI API is available")
    fallback_mode: bool = Field(..., description="Whether using fallback responses")
    last_successful_request: Optional[datetime] = Field(None, description="Last successful AI request")
    status_message: str = Field(..., description="Human-readable status")


class ChatContextSummary(BaseModel):
    """
    Schema for user's productivity context summary
    
    What ECHO knows about the user's current state
    """
    current_date: str = Field(..., description="Current date")
    tasks_summary: Dict[str, Any] = Field(..., description="Summary of user's tasks")
    habits_summary: Dict[str, Any] = Field(..., description="Summary of user's habits")
    insights: Dict[str, Any] = Field(..., description="Productivity insights")
    recommendations: List[str] = Field(default=[], description="AI-generated recommendations")


# Example usage of these schemas:
"""
Sending a message to ECHO:
POST /chat/message
{
    "message": "How are my habits going?",
    "include_context": true,
    "stream_response": false
}

ECHO's response:
{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "How are my habits going?",
    "response": "Great question! You're doing well with your habits. You have a 5-day streak on exercise and completed your reading habit 3 times this week. Keep up the excellent work! 🔥",
    "response_time_ms": 1250,
    "created_at": "2024-01-10T15:30:00",
    "context_data": {
        "habits_count": 3,
        "best_streak": 5,
        "completion_rate": 85.5
    }
}

Streaming response chunks:
{
    "chunk": "Great question! You're doing well",
    "is_complete": false,
    "chunk_index": 0
}
{
    "chunk": " with your habits. You have a 5-day",
    "is_complete": false,
    "chunk_index": 1
}
{
    "chunk": " streak on exercise! 🔥",
    "is_complete": true,
    "chunk_index": 2
}
"""