#!/usr/bin/env python3
"""
ECHO AI Fix Script

This script automatically fixes common AI issues:
1. Checks if Ollama is running
2. Installs a fast, reliable model if none exist
3. Tests the AI to make sure it's working

Run this if ECHO is not responding with AI-like responses.
"""
import asyncio
import subprocess
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.services.local_ai_client import LocalAIClient


def check_ollama_running():
    """Check if Ollama is running"""
    try:
        result = subprocess.run(['ollama', 'list'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


async def fix_ai():
    """Fix common AI issues"""
    print("🔧 ECHO AI Fix Tool")
    print("=" * 30)
    
    # Step 1: Check if Ollama is running
    print("1. Checking Ollama...")
    if not check_ollama_running():
        print("   ❌ Ollama is not running")
        print("   💡 Please run: ollama serve")
        print("   💡 Then run this script again")
        return False
    else:
        print("   ✅ Ollama is running")
    
    # Step 2: Check models
    client = LocalAIClient()
    models = await client.list_models()
    
    print(f"\n2. Checking models... Found {len(models)} models")
    
    if not models:
        print("   ❌ No models installed")
        print("   📥 Installing llama3.2:1b (fast and reliable)...")
        
        # Install a reliable model
        success = await client.pull_model("llama3.2:1b")
        if success:
            print("   ✅ Successfully installed llama3.2:1b")
        else:
            print("   ❌ Failed to install model")
            print("   💡 Try manually: ollama pull llama3.2:1b")
            return False
    else:
        print("   ✅ Models available:")
        for model in models[:3]:  # Show first 3
            print(f"      - {model}")
    
    # Step 3: Test AI response
    print("\n3. Testing AI response...")
    
    messages = [
        {"role": "system", "content": "You are ECHO, a helpful productivity assistant. Be brief."},
        {"role": "user", "content": "Hello! Are you working?"}
    ]
    
    try:
        response = await client.generate_response(messages)
        if response and len(response) > 10:
            print(f"   ✅ AI is working! Response: {response[:50]}...")
            print("\n🎉 SUCCESS! ECHO AI is now working!")
            return True
        else:
            print("   ❌ AI response is too short or empty")
            return False
    except Exception as e:
        print(f"   ❌ Error testing AI: {e}")
        return False


async def main():
    """Main function"""
    success = await fix_ai()
    
    if success:
        print("\n✨ ECHO AI is ready!")
        print("You can now chat with ECHO and get AI-powered responses.")
    else:
        print("\n❌ Could not fix AI issues.")
        print("Please check:")
        print("1. Ollama is installed: https://ollama.ai/download")
        print("2. Ollama is running: ollama serve")
        print("3. A model is installed: ollama pull llama3.2:1b")


if __name__ == "__main__":
    asyncio.run(main())