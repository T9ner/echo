#!/usr/bin/env python3
"""
Quick AI Test - Diagnose ECHO AI Issues

This script quickly tests if ECHO's AI is working and provides diagnostics.
"""
import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.services.local_ai_client import LocalAIClient


async def quick_test():
    """Quick test of AI functionality"""
    print("🔍 ECHO AI Quick Diagnostic")
    print("=" * 40)
    
    client = LocalAIClient()
    
    # Test 1: Check if Ollama is running
    print("1. Checking Ollama server...")
    is_available = await client.is_available()
    if is_available:
        print("   ✅ Ollama is running")
    else:
        print("   ❌ Ollama is not running or has no models")
        print("   💡 Solution: Run 'ollama serve' in another terminal")
        return
    
    # Test 2: List available models
    print("\n2. Checking available models...")
    models = await client.list_models()
    if models:
        print(f"   ✅ Found {len(models)} models:")
        for model in models:
            print(f"      - {model}")
    else:
        print("   ❌ No models found")
        print("   💡 Solution: Run 'ollama pull llama3.2:1b'")
        return
    
    # Test 3: Find fastest model
    print("\n3. Finding fastest model...")
    fastest = await client.get_fastest_available_model()
    if fastest:
        print(f"   ✅ Fastest model: {fastest}")
    else:
        print("   ❌ No fast models available")
        print("   💡 Solution: Run 'ollama pull llama3.2:1b'")
        return
    
    # Test 4: Generate a response
    print("\n4. Testing AI response...")
    messages = [
        {"role": "system", "content": "You are ECHO, a helpful productivity assistant."},
        {"role": "user", "content": "Hello! How are you?"}
    ]
    
    try:
        response = await client.generate_response(messages)
        if response:
            print(f"   ✅ AI Response: {response}")
            print("\n🎉 SUCCESS! ECHO AI is working!")
        else:
            print("   ❌ No response generated")
            print("   💡 Check Ollama logs for errors")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("   💡 Check if the model is compatible")


if __name__ == "__main__":
    asyncio.run(quick_test())