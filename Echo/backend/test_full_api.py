#!/usr/bin/env python3
"""
Test the full chat API endpoint with Gemma3:4b
"""
import httpx
import json

def test_chat_api():
    print("=== Testing ECHO Chat API with Gemma3:4b ===")
    
    # Test health first
    try:
        health_response = httpx.get("http://localhost:8000/health")
        print(f"Health check: {health_response.status_code}")
        if health_response.status_code == 200:
            print(f"Health: {health_response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test chat endpoint
    try:
        chat_payload = {
            "message": "Hello! Can you help me be more productive today?",
            "conversation_id": "test-123"
        }
        
        print(f"\nSending chat message: {chat_payload['message']}")
        
        chat_response = httpx.post(
            "http://localhost:8000/api/v1/chat/message",
            json=chat_payload,
            timeout=30.0
        )
        
        print(f"Chat API status: {chat_response.status_code}")
        
        if chat_response.status_code == 200:
            result = chat_response.json()
            print(f"✅ Chat Response: {result.get('response', 'No response field')}")
            print(f"Model used: {result.get('model', 'Unknown')}")
            print(f"Response time: {result.get('response_time', 'Unknown')}s")
        else:
            print(f"❌ Error: {chat_response.text}")
            
    except Exception as e:
        print(f"Chat API test failed: {e}")

if __name__ == '__main__':
    test_chat_api()
