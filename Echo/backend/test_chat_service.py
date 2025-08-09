#!/usr/bin/env python3
"""
Test the chat service with local AI
"""
import asyncio
import sys
sys.path.append('.')
import os

# Set environment for local AI
os.environ['USE_LOCAL_AI'] = 'true'

from app.services.chat_service import ChatService
from app.core.database import get_db

async def test_chat_service():
    print("Testing chat service with local AI...")
    
    # Get a database session
    from app.core.database import SessionLocal
    db = SessionLocal()
    
    try:
        # Initialize chat service with database session
        chat_service = ChatService(db)
        
        # Test with a simple message
        response = await chat_service.generate_response(
            user_message="Hello, can you help me with my tasks?"
        )
        
        print(f"Chat response: {response}")
        
    except Exception as e:
        print(f"Error in chat service: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(test_chat_service())
