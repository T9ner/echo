#!/usr/bin/env python3
"""
Test local AI with full debug logging
"""
import asyncio
import sys
import logging
sys.path.append('.')

# Set up debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger()

from app.services.local_ai_client import local_ai_client

async def test_local_ai_debug():
    print("=== Testing Local AI with Debug Logging ===")
    
    # Test availability
    available = await local_ai_client.is_available()
    print(f"Available: {available}")
    
    if not available:
        print("Local AI not available, exiting")
        return
    
    # Test with the exact same format the chat service uses
    messages = [
        {
            "role": "system", 
            "content": "You are ECHO, a helpful productivity assistant. You help users manage their tasks, habits, and productivity goals."
        },
        {
            "role": "user", 
            "content": "Hello, can you help me with my tasks?"
        }
    ]
    
    print(f"Testing with messages: {messages}")
    
    try:
        response = await local_ai_client.generate_response(messages)
        print(f"Response: {response}")
        print(f"Response type: {type(response)}")
        print(f"Response length: {len(response) if response else 0}")
    except Exception as e:
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_local_ai_debug())
