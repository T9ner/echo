#!/usr/bin/env python3
"""
Debug script to test Ollama API directly
"""
import httpx
import json

def test_ollama():
    try:
        # Test what models are available
        print("Testing Ollama API...")
        response = httpx.get('http://localhost:11434/api/tags')
        print(f'Models endpoint status: {response.status_code}')
        
        if response.status_code == 200:
            models = response.json()
            print('Available models:')
            for model in models.get('models', []):
                print(f'  - {model.get("name", "unknown")}')
        else:
            print(f'Error getting models: {response.text}')
            return
        
        print()
        
        # Test if gemma3:1b specifically works
        print('Testing gemma3:1b directly...')
        test_payload = {
            'model': 'gemma3:1b',
            'prompt': 'Hello, respond with just "AI is working"',
            'stream': False
        }
        
        response = httpx.post('http://localhost:11434/api/generate', json=test_payload, timeout=30)
        print(f'Generate endpoint status: {response.status_code}')
        
        if response.status_code == 200:
            result = response.json()
            print(f'Response: {result.get("response", "No response field")}')
            print(f'Full result keys: {list(result.keys())}')
        else:
            print(f'Error: {response.text}')
    
    except Exception as e:
        print(f'Exception occurred: {e}')

if __name__ == '__main__':
    test_ollama()
