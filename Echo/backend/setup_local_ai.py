#!/usr/bin/env python3
"""
Local AI Setup Script for ECHO

This script helps you set up local AI models using Ollama for ECHO.
It will:
1. Check if Ollama is installed
2. Install recommended models
3. Test the setup
4. Provide usage instructions

Run this after installing Ollama from https://ollama.ai/
"""
import subprocess
import sys
import time
import requests
import json
from typing import List, Tuple


class Colors:
    """ANSI color codes for pretty output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_step(message: str):
    """Print a step with formatting"""
    print(f"\n{Colors.BLUE}🔧 {message}{Colors.END}")


def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")


def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")


def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")


def run_command(command: List[str]) -> Tuple[bool, str]:
    """Run a command and return success status and output"""
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=300)
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


def check_ollama_installed() -> bool:
    """Check if Ollama is installed"""
    print_step("Checking if Ollama is installed...")
    success, output = run_command(["ollama", "--version"])
    
    if success:
        print_success(f"Ollama is installed: {output.strip()}")
        return True
    else:
        print_error("Ollama is not installed or not in PATH")
        print(f"{Colors.YELLOW}Please install Ollama from: https://ollama.ai/{Colors.END}")
        return False


def check_ollama_running() -> bool:
    """Check if Ollama server is running"""
    print_step("Checking if Ollama server is running...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print_success("Ollama server is running")
            return True
        else:
            print_warning("Ollama server responded with error")
            return False
    except requests.RequestException:
        print_warning("Ollama server is not running")
        print(f"{Colors.YELLOW}Starting Ollama server...{Colors.END}")
        
        # Try to start Ollama
        try:
            subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(3)  # Wait for server to start
            
            # Check again
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                print_success("Ollama server started successfully")
                return True
        except Exception as e:
            print_error(f"Failed to start Ollama server: {e}")
        
        return False


def list_available_models() -> List[str]:
    """List currently available models"""
    print_step("Checking available models...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [model["name"] for model in models]
            
            if model_names:
                print_success(f"Found {len(model_names)} models:")
                for model in model_names:
                    print(f"  • {model}")
            else:
                print_warning("No models found")
            
            return model_names
        else:
            print_error("Failed to list models")
            return []
    except Exception as e:
        print_error(f"Error listing models: {e}")
        return []


def pull_model(model_name: str) -> bool:
    """Pull/download a model"""
    print_step(f"Pulling model: {model_name}")
    print(f"{Colors.YELLOW}This may take several minutes depending on model size...{Colors.END}")
    
    success, output = run_command(["ollama", "pull", model_name])
    
    if success:
        print_success(f"Successfully pulled {model_name}")
        return True
    else:
        print_error(f"Failed to pull {model_name}: {output}")
        return False


def test_model(model_name: str) -> bool:
    """Test a model with a simple prompt"""
    print_step(f"Testing model: {model_name}")
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": "Hello! Please respond with just 'AI test successful' and nothing else.",
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get("response", "").strip()
            print_success(f"Model test successful: {ai_response[:50]}...")
            return True
        else:
            print_error(f"Model test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Model test error: {e}")
        return False


def main():
    """Main setup function"""
    print(f"\n{Colors.BOLD}🤖 ECHO Local AI Setup{Colors.END}")
    print(f"{Colors.BOLD}Setting up local AI models for cost-effective AI assistance{Colors.END}\n")
    
    # Step 1: Check Ollama installation
    if not check_ollama_installed():
        sys.exit(1)
    
    # Step 2: Check if server is running
    if not check_ollama_running():
        print_error("Cannot continue without Ollama server running")
        sys.exit(1)
    
    # Step 3: List current models
    current_models = list_available_models()
    
    # Step 4: Recommend and install models
    recommended_models = [
        ("gemma2:2b", "Small, fast model (1.6GB) - Good for basic tasks"),
        ("gemma2:9b", "Larger, more capable model (5.4GB) - Better responses"),
        ("llama3:8b", "Alternative model (4.7GB) - Good balance of size/quality")
    ]
    
    print_step("Recommended models for ECHO:")
    for model, description in recommended_models:
        status = "✅ Installed" if model in current_models else "⭕ Not installed"
        print(f"  • {model} - {description} [{status}]")
    
    # Ask user which models to install
    print(f"\n{Colors.YELLOW}Which models would you like to install?{Colors.END}")
    print("1. gemma2:2b (Recommended for starting - small and fast)")
    print("2. gemma2:9b (Better quality responses - larger download)")
    print("3. llama3:8b (Alternative option)")
    print("4. All models")
    print("5. Skip installation")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    models_to_install = []
    if choice == "1":
        models_to_install = ["gemma2:2b"]
    elif choice == "2":
        models_to_install = ["gemma2:9b"]
    elif choice == "3":
        models_to_install = ["llama3:8b"]
    elif choice == "4":
        models_to_install = ["gemma2:2b", "gemma2:9b", "llama3:8b"]
    elif choice == "5":
        print_warning("Skipping model installation")
    else:
        print_error("Invalid choice")
        sys.exit(1)
    
    # Install selected models
    for model in models_to_install:
        if model not in current_models:
            if not pull_model(model):
                print_error(f"Failed to install {model}")
                continue
        else:
            print_success(f"{model} already installed")
        
        # Test the model
        test_model(model)
    
    # Final setup verification
    print_step("Final setup verification...")
    final_models = list_available_models()
    
    if final_models:
        print_success("Local AI setup complete!")
        print(f"\n{Colors.BOLD}Next Steps:{Colors.END}")
        print("1. Your .env file is already configured to use local AI")
        print("2. Restart your ECHO backend server")
        print("3. Test the chat interface in your frontend")
        print(f"4. Models will run locally on your machine - no monthly fees! 🎉")
        
        print(f"\n{Colors.BOLD}Usage Tips:{Colors.END}")
        print("• Smaller models (2b) are faster but less capable")
        print("• Larger models (9b) give better responses but use more resources")
        print("• You can switch models in the .env file (LOCAL_AI_MODEL setting)")
        print("• All processing happens locally - your data stays private")
        
    else:
        print_error("No models available. Please install at least one model to use local AI.")


if __name__ == "__main__":
    main()
