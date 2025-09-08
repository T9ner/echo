"""
Cloud AI Client - Free Cloud AI APIs for Deployed ECHO

This handles communication with free cloud AI services:
1. Groq API (Free, very fast)
2. Hugging Face Inference API (Free tier)
3. OpenRouter (Free tier)
4. Together AI (Free tier)

Perfect for deployed applications where users don't have local AI!
"""
import httpx
import json
import logging
from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)


class CloudAIClient:
    """
    Cloud AI client using free AI APIs for deployed applications
    
    Supports multiple free providers:
    - Groq (very fast, free tier)
    - Hugging Face (free inference API)
    - OpenRouter (free tier)
    - Together AI (free tier)
    """
    
    def __init__(self):
        """Initialize the cloud AI client"""
        self.timeout = 30.0
        
        # Free AI providers (in order of preference)
        self.providers = [
            {
                "name": "groq",
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "model": "llama3-8b-8192",  # Fast and free
                "api_key": settings.GROQ_API_KEY,
                "headers": lambda key: {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            },
            {
                "name": "huggingface",
                "url": "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
                "model": "microsoft/DialoGPT-medium",
                "api_key": settings.HUGGINGFACE_API_KEY,
                "headers": lambda key: {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            },
            {
                "name": "openrouter",
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "model": "meta-llama/llama-3.1-8b-instruct:free",  # Free tier
                "api_key": settings.OPENROUTER_API_KEY,
                "headers": lambda key: {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://echo-ai.app",
                    "X-Title": "ECHO AI Assistant"
                }
            }
        ]
        
        logger.info("CloudAI client initialized with multiple free providers")
    
    async def is_available(self) -> bool:
        """
        Check if any cloud AI provider is available
        
        Returns:
            bool: True if at least one provider is available
        """
        for provider in self.providers:
            if provider["api_key"]:
                try:
                    # Quick test request
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        response = await client.post(
                            provider["url"],
                            headers=provider["headers"](provider["api_key"]),
                            json={
                                "model": provider["model"],
                                "messages": [{"role": "user", "content": "test"}],
                                "max_tokens": 1
                            }
                        )
                        if response.status_code in [200, 400]:  # 400 is OK for test
                            logger.info(f"Provider {provider['name']} is available")
                            return True
                except Exception as e:
                    logger.debug(f"Provider {provider['name']} not available: {e}")
                    continue
        
        logger.warning("No cloud AI providers available")
        return False
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 300,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        Generate a response using cloud AI providers
        
        Args:
            messages: List of message objects for conversation
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0-1.0)
            
        Returns:
            Generated response text, or None if all providers failed
        """
        for provider in self.providers:
            if not provider["api_key"]:
                continue
                
            try:
                logger.info(f"Trying provider: {provider['name']}")
                
                # Prepare request based on provider
                if provider["name"] == "groq" or provider["name"] == "openrouter":
                    # OpenAI-compatible format
                    payload = {
                        "model": provider["model"],
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "stream": False
                    }
                elif provider["name"] == "huggingface":
                    # Hugging Face format
                    # Convert messages to single prompt
                    prompt = self._messages_to_prompt(messages)
                    payload = {
                        "inputs": prompt,
                        "parameters": {
                            "max_new_tokens": max_tokens,
                            "temperature": temperature,
                            "return_full_text": False
                        }
                    }
                
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        provider["url"],
                        headers=provider["headers"](provider["api_key"]),
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        # Parse response based on provider
                        if provider["name"] == "groq" or provider["name"] == "openrouter":
                            content = result["choices"][0]["message"]["content"].strip()
                        elif provider["name"] == "huggingface":
                            if isinstance(result, list) and len(result) > 0:
                                content = result[0].get("generated_text", "").strip()
                            else:
                                content = result.get("generated_text", "").strip()
                        
                        if content and len(content) > 10:
                            logger.info(f"Successfully generated response using {provider['name']}: {len(content)} chars")
                            return content
                        else:
                            logger.warning(f"Provider {provider['name']} returned empty response")
                    else:
                        logger.warning(f"Provider {provider['name']} returned status {response.status_code}: {response.text}")
                        
            except Exception as e:
                logger.error(f"Error with provider {provider['name']}: {e}")
                continue
        
        logger.error("All cloud AI providers failed")
        return None
    
    def _messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """
        Convert OpenAI-style messages to a simple prompt format
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            
        Returns:
            Formatted prompt string
        """
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"Human: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        # Add final prompt for assistant response
        prompt_parts.append("Assistant:")
        
        return "\n\n".join(prompt_parts)
    
    def get_setup_instructions(self) -> str:
        """
        Get instructions for setting up free API keys
        
        Returns:
            Setup instructions string
        """
        return """
🌐 **Free Cloud AI Setup for Deployed ECHO**

To enable AI for your deployed ECHO (so friends can use it), get FREE API keys:

**Option 1: Groq (Recommended - Very Fast)**
1. Go to: https://console.groq.com/
2. Sign up (free)
3. Create API key
4. Add to .env: GROQ_API_KEY=your_key_here

**Option 2: OpenRouter (Good Free Tier)**
1. Go to: https://openrouter.ai/
2. Sign up (free)
3. Get API key
4. Add to .env: OPENROUTER_API_KEY=your_key_here

**Option 3: Hugging Face (Free)**
1. Go to: https://huggingface.co/
2. Sign up (free)
3. Go to Settings > Access Tokens
4. Create token
5. Add to .env: HUGGINGFACE_API_KEY=your_key_here

**Then set in .env:**
```
USE_CLOUD_AI=true
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
HUGGINGFACE_API_KEY=your_hf_key
```

This way your deployed ECHO works for everyone! 🚀
"""


# Global client instance
cloud_ai_client = CloudAIClient()