#!/usr/bin/env python3
"""
Quick test of the chat API
"""
import httpx

def test_chat():
    try:
        print("Testing chat API with Gemma3:4b...")
        response = httpx.post(
            'http://localhost:8000/api/v1/chat/message',
            json={'message': 'Hello! Can you help me be productive today?'},
            timeout=60.0
        )
        
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            result = response.json()
            print(f'✅ Response: {result.get("response", "No response")}')
            print(f'Model: {result.get("model", "Unknown")}')
            print(f'Response time: {result.get("response_time", "Unknown")}s')
        else:
            print(f'❌ Error: {response.text}')
    except Exception as e:
        print(f'Exception: {e}')

if __name__ == '__main__':
    test_chat()
