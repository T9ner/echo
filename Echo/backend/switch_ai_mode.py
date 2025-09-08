#!/usr/bin/env python3
"""
ECHO AI Mode Switcher

Easily switch between local AI (development) and cloud AI (deployment) modes.
"""
import os
import sys
from pathlib import Path


def read_env_file():
    """Read current .env file"""
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return {}
    
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
    return env_vars


def write_env_file(env_vars):
    """Write updated .env file"""
    env_path = Path(__file__).parent / ".env"
    
    # Template with comments
    template = """# Database Configuration
# Using PostgreSQL for production-ready database management
USE_SQLITE={USE_SQLITE}

# PostgreSQL settings
POSTGRES_SERVER={POSTGRES_SERVER}
POSTGRES_USER={POSTGRES_USER}
POSTGRES_PASSWORD={POSTGRES_PASSWORD}
POSTGRES_DB={POSTGRES_DB}
POSTGRES_PORT={POSTGRES_PORT}

# AI Configuration
# Local AI (Ollama) - Free and Private for development
USE_LOCAL_AI={USE_LOCAL_AI}
OLLAMA_HOST={OLLAMA_HOST}
LOCAL_AI_MODEL={LOCAL_AI_MODEL}

# Cloud AI - Free APIs for deployed apps (so friends can use ECHO!)
USE_CLOUD_AI={USE_CLOUD_AI}
GROQ_API_KEY={GROQ_API_KEY}
HUGGINGFACE_API_KEY={HUGGINGFACE_API_KEY}
OPENROUTER_API_KEY={OPENROUTER_API_KEY}

# Google Calendar API
GOOGLE_CLIENT_ID={GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET={GOOGLE_CLIENT_SECRET}
"""
    
    with open(env_path, 'w') as f:
        f.write(template.format(**env_vars))


def switch_to_local():
    """Switch to local AI mode (development)"""
    print("🏠 Switching to LOCAL AI mode (development)")
    print("=" * 50)
    
    env_vars = read_env_file()
    
    # Set local AI mode
    env_vars['USE_LOCAL_AI'] = 'true'
    env_vars['USE_CLOUD_AI'] = 'false'
    
    # Ensure local AI defaults
    env_vars.setdefault('OLLAMA_HOST', 'http://localhost:11434')
    env_vars.setdefault('LOCAL_AI_MODEL', 'llama3.2:1b')
    
    write_env_file(env_vars)
    
    print("✅ Switched to local AI mode")
    print("💡 Make sure Ollama is running: ollama serve")
    print("💡 Install a model: ollama pull llama3.2:1b")
    print("💡 Test with: python test_ai_quick.py")


def switch_to_cloud():
    """Switch to cloud AI mode (deployment)"""
    print("🌐 Switching to CLOUD AI mode (deployment)")
    print("=" * 50)
    
    env_vars = read_env_file()
    
    # Set cloud AI mode
    env_vars['USE_LOCAL_AI'] = 'false'
    env_vars['USE_CLOUD_AI'] = 'true'
    
    # Ensure cloud AI keys exist (empty if not set)
    env_vars.setdefault('GROQ_API_KEY', '')
    env_vars.setdefault('HUGGINGFACE_API_KEY', '')
    env_vars.setdefault('OPENROUTER_API_KEY', '')
    
    write_env_file(env_vars)
    
    print("✅ Switched to cloud AI mode")
    print("💡 Add your API keys to .env file")
    print("💡 Test with: python setup_cloud_ai.py")
    print("💡 Deploy guide: see DEPLOYMENT_GUIDE.md")


def switch_to_hybrid():
    """Switch to hybrid mode (both local and cloud)"""
    print("🔄 Switching to HYBRID AI mode (best of both)")
    print("=" * 50)
    
    env_vars = read_env_file()
    
    # Set hybrid mode
    env_vars['USE_LOCAL_AI'] = 'true'
    env_vars['USE_CLOUD_AI'] = 'true'
    
    # Ensure defaults
    env_vars.setdefault('OLLAMA_HOST', 'http://localhost:11434')
    env_vars.setdefault('LOCAL_AI_MODEL', 'llama3.2:1b')
    env_vars.setdefault('GROQ_API_KEY', '')
    env_vars.setdefault('HUGGINGFACE_API_KEY', '')
    env_vars.setdefault('OPENROUTER_API_KEY', '')
    
    write_env_file(env_vars)
    
    print("✅ Switched to hybrid AI mode")
    print("💡 ECHO will try local AI first, then cloud AI as fallback")
    print("💡 Perfect for development with deployment backup!")


def show_current_mode():
    """Show current AI configuration"""
    env_vars = read_env_file()
    
    use_local = env_vars.get('USE_LOCAL_AI', 'false').lower() == 'true'
    use_cloud = env_vars.get('USE_CLOUD_AI', 'false').lower() == 'true'
    
    print("📊 Current AI Configuration")
    print("=" * 30)
    print(f"Local AI (Ollama): {'✅ Enabled' if use_local else '❌ Disabled'}")
    print(f"Cloud AI (APIs):   {'✅ Enabled' if use_cloud else '❌ Disabled'}")
    
    if use_local:
        print(f"  • Ollama Host: {env_vars.get('OLLAMA_HOST', 'Not set')}")
        print(f"  • Model: {env_vars.get('LOCAL_AI_MODEL', 'Not set')}")
    
    if use_cloud:
        groq_key = env_vars.get('GROQ_API_KEY', '')
        hf_key = env_vars.get('HUGGINGFACE_API_KEY', '')
        or_key = env_vars.get('OPENROUTER_API_KEY', '')
        
        print(f"  • Groq API: {'✅ Configured' if groq_key else '❌ Not set'}")
        print(f"  • HuggingFace API: {'✅ Configured' if hf_key else '❌ Not set'}")
        print(f"  • OpenRouter API: {'✅ Configured' if or_key else '❌ Not set'}")
    
    if not use_local and not use_cloud:
        print("⚠️  No AI enabled! ECHO will use basic fallback responses.")


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("🤖 ECHO AI Mode Switcher")
        print("=" * 30)
        print("Usage:")
        print("  python switch_ai_mode.py local    # Local AI (development)")
        print("  python switch_ai_mode.py cloud    # Cloud AI (deployment)")
        print("  python switch_ai_mode.py hybrid   # Both (recommended)")
        print("  python switch_ai_mode.py status   # Show current mode")
        print()
        show_current_mode()
        return
    
    mode = sys.argv[1].lower()
    
    if mode == 'local':
        switch_to_local()
    elif mode == 'cloud':
        switch_to_cloud()
    elif mode == 'hybrid':
        switch_to_hybrid()
    elif mode == 'status':
        show_current_mode()
    else:
        print(f"❌ Unknown mode: {mode}")
        print("Valid modes: local, cloud, hybrid, status")


if __name__ == "__main__":
    main()