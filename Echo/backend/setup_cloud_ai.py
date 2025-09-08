#!/usr/bin/env python3
"""
ECHO Cloud AI Setup Script

This script helps you set up FREE cloud AI APIs so your deployed ECHO
works for everyone - even friends who don't have Ollama installed!

Perfect for sharing your ECHO deployment! 🌐
"""
import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.services.cloud_ai_client import CloudAIClient


async def test_cloud_ai():
    """Test cloud AI functionality"""
    print("🌐 ECHO Cloud AI Setup & Test")
    print("=" * 50)
    
    client = CloudAIClient()
    
    # Check which providers have API keys
    print("1. Checking API key configuration...")
    
    from app.core.config import settings
    
    providers_configured = []
    if settings.GROQ_API_KEY:
        providers_configured.append("Groq (Recommended)")
    if settings.OPENROUTER_API_KEY:
        providers_configured.append("OpenRouter")
    if settings.HUGGINGFACE_API_KEY:
        providers_configured.append("Hugging Face")
    
    if providers_configured:
        print(f"   ✅ Configured providers: {', '.join(providers_configured)}")
    else:
        print("   ❌ No API keys configured")
        print("\n" + client.get_setup_instructions())
        return False
    
    # Test cloud AI availability
    print("\n2. Testing cloud AI availability...")
    is_available = await client.is_available()
    
    if is_available:
        print("   ✅ Cloud AI is available")
    else:
        print("   ❌ Cloud AI is not available")
        print("   💡 Check your API keys and internet connection")
        return False
    
    # Test AI response generation
    print("\n3. Testing AI response generation...")
    
    messages = [
        {
            "role": "system",
            "content": "You are ECHO, a helpful productivity assistant. Be brief and encouraging."
        },
        {
            "role": "user",
            "content": "Hello! I'm testing the cloud AI. Can you help me be more productive?"
        }
    ]
    
    try:
        response = await client.generate_response(messages)
        if response and len(response) > 20:
            print(f"   ✅ AI Response: {response}")
            print("\n🎉 SUCCESS! Cloud AI is working!")
            print("\n✨ Your ECHO is now ready for deployment!")
            print("   Friends can use your deployed ECHO without installing anything!")
            return True
        else:
            print("   ❌ AI response is too short or empty")
            return False
    except Exception as e:
        print(f"   ❌ Error testing AI: {e}")
        return False


def show_deployment_tips():
    """Show tips for deploying ECHO with cloud AI"""
    print("\n🚀 DEPLOYMENT TIPS")
    print("=" * 30)
    print("Now that cloud AI is working, you can deploy ECHO and share it!")
    print()
    print("📋 Deployment Checklist:")
    print("✅ Cloud AI configured and tested")
    print("✅ Database configured (PostgreSQL for production)")
    print("✅ Environment variables set")
    print("✅ CORS origins configured for your domain")
    print()
    print("🌍 Popular deployment platforms:")
    print("• Railway: https://railway.app/")
    print("• Render: https://render.com/")
    print("• Vercel: https://vercel.com/")
    print("• Heroku: https://heroku.com/")
    print()
    print("💡 Don't forget to:")
    print("• Set environment variables on your platform")
    print("• Update CORS origins for your domain")
    print("• Use PostgreSQL for production database")


async def main():
    """Main setup function"""
    success = await test_cloud_ai()
    
    if success:
        show_deployment_tips()
    else:
        print("\n❌ Cloud AI setup incomplete.")
        print("Please follow the instructions above to get FREE API keys.")
        print("Then run this script again to test!")


if __name__ == "__main__":
    asyncio.run(main())