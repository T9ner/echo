#!/usr/bin/env python3
"""
Test chat service minimal reproduction
"""
import asyncio
import sys
import os
import logging
sys.path.append('.')

# Set up logging
logging.basicConfig(level=logging.INFO)

# Set environment for local AI
os.environ['USE_LOCAL_AI'] = 'true'

from app.core.database import SessionLocal
from app.services.chat_service import ChatService

async def test_chat_minimal():
    print("=== Minimal Chat Service Test ===")
    
    # Test the local AI client directly first
    from app.services.local_ai_client import local_ai_client
    print("Testing local AI client directly...")
    
    available = await local_ai_client.is_available()
    print(f"Local AI available: {available}")
    
    if available:
        # Test simple generation
        messages = [{"role": "user", "content": "Hello"}]
        response = await local_ai_client.generate_response(messages)
        print(f"Direct response: {response}")
    
    print("\nTesting through chat service...")
    
    # Test through chat service
    db = SessionLocal()
    try:
        chat_service = ChatService(db)
        response = await chat_service.generate_response("Hello")
        print(f"Chat service response: {response}")
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(test_chat_minimal())
