#!/usr/bin/env python3
"""
ECHO Fast AI Setup Script

This script helps you set up the fastest, free AI models for ECHO.
It will:
1. Check if Ollama is installed and running
2. Install the fastest models for productivity tasks
3. Test the setup

Run this script to get ECHO running with lightning-fast, free AI!
"""
import asyncio
import sys
import subprocess
import platform
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.services.local_ai_client import LocalAIClient


async def check_ollama_installed():
    """Check if Ollama is installed"""
    try:
        result = subprocess.run(['ollama', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Ollama is installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ Ollama is not installed or not working")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Ollama is not installed")
        return False


def install_ollama():
    """Provide instructions to install Ollama"""
    system = platform.system().lower()
    
    print("\n🚀 Installing Ollama (Free AI Runtime):")
    print("=" * 50)
    
    if system == "windows":
        print("1. Download Ollama for Windows from: https://ollama.ai/download")
        print("2. Run the installer")
        print("3. Restart your terminal")
    elif system == "darwin":  # macOS
        print("Option 1 - Download:")
        print("1. Download Ollama for macOS from: https://ollama.ai/download")
        print("2. Install the .dmg file")
        print("\nOption 2 - Homebrew:")
        print("brew install ollama")
    else:  # Linux
        print("Run this command:")
        print("curl -fsSL https://ollama.ai/install.sh | sh")
    
    print("\n4. After installation, run: ollama serve")
    print("5. Then run this setup script again!")


async def setup_fast_models():
    """Set up the fastest AI models"""
    print("\n🧠 Setting up Fast AI Models:")
    print("=" * 40)
    
    client = LocalAIClient()
    
    # Check if Ollama is running
    if not await client.is_available():
        print("❌ Ollama is not running. Please start it with: ollama serve")
        return False
    
    print("✅ Ollama is running!")
    
    # List current models
    models = await client.list_models()
    print(f"📋 Currently installed models: {len(models)}")
    for model in models:
        print(f"   - {model}")
    
    # Install fast models
    fast_models = [
        ("gemma2:2b", "Google's Gemma2 2B - Best speed/quality balance"),
        ("phi3:mini", "Microsoft's Phi3 Mini - Very fast and capable"),
        ("qwen2:1.5b", "Alibaba's Qwen2 1.5B - Ultra fast"),
    ]
    
    print(f"\n⚡ Installing {len(fast_models)} fast models...")
    
    for model_name, description in fast_models:
        if model_name not in models:
            print(f"\n📥 Installing {model_name} ({description})...")
            success = await client.pull_model(model_name)
            if success:
                print(f"✅ Successfully installed {model_name}")
            else:
                print(f"❌ Failed to install {model_name}")
        else:
            print(f"✅ {model_name} already installed")
    
    return True


async def test_ai_response():
    """Test AI response generation"""
    print("\n🧪 Testing AI Response:")
    print("=" * 30)
    
    client = LocalAIClient()
    
    # Test message
    messages = [
        {
            "role": "system", 
            "content": "You are ECHO, a helpful productivity assistant. Keep responses brief and encouraging."
        },
        {
            "role": "user", 
            "content": "Hello! Can you help me be more productive today?"
        }
    ]
    
    print("🤖 Generating test response...")
    
    try:
        response = await client.generate_response(messages)
        if response:
            print(f"✅ AI Response: {response}")
            return True
        else:
            print("❌ No response generated")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def main():
    """Main setup function"""
    print("🎯 ECHO Fast AI Setup")
    print("=" * 50)
    print("Setting up lightning-fast, FREE AI for your productivity assistant!")
    print()
    
    # Step 1: Check Ollama installation
    if not await check_ollama_installed():
        install_ollama()
        return
    
    # Step 2: Setup models
    if not await setup_fast_models():
        return
    
    # Step 3: Test the setup
    if await test_ai_response():
        print("\n🎉 SUCCESS! ECHO is ready with fast, free AI!")
        print("\nNext steps:")
        print("1. Start your ECHO backend: python -m uvicorn app.main:app --reload")
        print("2. Start your ECHO frontend: npm run dev")
        print("3. Chat with ECHO and enjoy lightning-fast responses!")
    else:
        print("\n❌ Setup incomplete. Please check the errors above.")


if __name__ == "__main__":
    asyncio.run(main())