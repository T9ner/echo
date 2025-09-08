#!/usr/bin/env python3
"""
Quick Groq API Test

Test your Groq API key quickly to make sure it works.
"""
import asyncio
import httpx
from pathlib import Path
import sys

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings


async def test_groq_api():
    """Test Groq API directly"""
    print("🚀 Testing Groq API")
    print("=" * 30)
    
    # Check if API key is set
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
        print("❌ Groq API key not set!")
        print("💡 Please add your real API key to .env file:")
        print("   GROQ_API_KEY=gsk_your_actual_key_here")
        return False
    
    print(f"✅ API key configured: {settings.GROQ_API_KEY[:10]}...")
    
    # Test API call
    try:
        print("\n🧪 Testing API call...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are ECHO, a helpful productivity assistant. Be brief."
                        },
                        {
                            "role": "user",
                            "content": "Hello! Are you working? Just say yes or no."
                        }
                    ],
                    "max_tokens": 50,
                    "temperature": 0.7
                }
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"].strip()
                print(f"✅ AI Response: {ai_response}")
                print("\n🎉 SUCCESS! Groq API is working!")
                print("Your ECHO is now ready for deployment! 🚀")
                return True
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(test_groq_api())
    