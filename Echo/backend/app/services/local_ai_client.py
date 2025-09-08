"""
Local AI Client - Interface for Local AI Models via Ollama

This handles communication with local AI models like Gemma3 and GPT-OSS:
1. Ollama API integration
2. Model management and selection
3. Streaming responses
4. Fallback handling

No monthly costs, just local compute power!
"""
import httpx
import json
import logging
from typing import Optional, Dict, Any, AsyncGenerator, List
import asyncio
from datetime import datetime

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)


class LocalAIClient:
    """
    Local AI client using Ollama for running models locally
    
    Supports models like:
    - Gemma3 (Google's open model)
    - GPT-OSS (Open source GPT alternatives)
    - Llama models
    - And many more!
    """
    
    def __init__(self, ollama_host: str = "http://localhost:11434"):
        """
        Initialize the local AI client
        
        Args:
            ollama_host: Ollama server URL (default: http://localhost:11434)
        """
        self.ollama_host = ollama_host
        # Ultra-fast models for productivity tasks (ordered by speed)
        self.fast_models = [
            "llama3.2:1b",    # Meta's 1B model - very fast and widely available
            "gemma2:2b",      # Google's 2B model - excellent speed/quality balance
            "phi3:mini",      # Microsoft's 3.8B model - very fast
            "qwen2:1.5b",     # Alibaba's 1.5B model - ultra fast
            "tinyllama:1.1b", # Tiny but functional - fastest option
        ]
        self.default_model = settings.LOCAL_AI_MODEL or "gemma2:2b"
        self.timeout = 30.0  # Reasonable timeout for reliability
        logger.info(f"LocalAI client initialized with host: {ollama_host}, default model: {self.default_model}")
    
    async def is_available(self) -> bool:
        """
        Check if Ollama server is available and has models
        
        Returns:
            bool: True if Ollama is running and has models
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Check if Ollama is running
                response = await client.get(f"{self.ollama_host}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    logger.info(f"Found {len(models)} available models")
                    return len(models) > 0
                return False
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")
            return False
    
    async def list_models(self) -> List[str]:
        """
        Get list of available models
        
        Returns:
            List of model names
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_host}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return [model["name"] for model in models]
                return []
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    async def get_fastest_available_model(self) -> Optional[str]:
        """
        Get the fastest available model from our preferred list
        
        Returns:
            Name of fastest available model, or None if none available
        """
        try:
            available_models = await self.list_models()
            
            # Check our fast models in order of preference (fastest first)
            for fast_model in self.fast_models:
                if fast_model in available_models:
                    logger.info(f"Selected fastest available model: {fast_model}")
                    return fast_model
            
            # If none of our preferred models are available, use any available model
            if available_models:
                fallback_model = available_models[0]
                logger.info(f"Using fallback model: {fallback_model}")
                return fallback_model
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding fastest model: {e}")
            return None
    
    async def pull_model(self, model_name: str) -> bool:
        """
        Download/pull a model to local system
        
        Args:
            model_name: Name of model to pull (e.g., "gemma2:2b", "llama3:8b")
            
        Returns:
            bool: True if successful
        """
        try:
            logger.info(f"Pulling model: {model_name}")
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 min timeout for downloads
                response = await client.post(
                    f"{self.ollama_host}/api/pull",
                    json={"name": model_name}
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {e}")
            return False
    
    async def ensure_fast_model_available(self) -> bool:
        """
        Ensure at least one fast model is available, downloading if necessary
        
        Returns:
            bool: True if a fast model is available
        """
        try:
            # Check if we already have a fast model
            fastest = await self.get_fastest_available_model()
            if fastest:
                logger.info(f"Fast model already available: {fastest}")
                return True
            
            # Try to pull the fastest model
            logger.info("No fast models found, attempting to pull gemma2:2b...")
            success = await self.pull_model("gemma2:2b")
            
            if success:
                logger.info("Successfully pulled gemma2:2b")
                return True
            else:
                logger.warning("Failed to pull gemma2:2b, trying tinyllama:1.1b...")
                return await self.pull_model("tinyllama:1.1b")
                
        except Exception as e:
            logger.error(f"Error ensuring fast model: {e}")
            return False
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: int = 300,  # Reduced for faster responses
        temperature: float = 0.3  # Lower temperature for more focused responses
    ) -> Optional[str]:
        """
        Generate a response using local AI model
        
        Args:
            messages: List of message objects for conversation
            model: Model name to use (defaults to self.default_model)
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0-1.0)
            
        Returns:
            Generated response text, or None if failed
        """
        if not await self.is_available():
            logger.warning("Local AI not available")
            return None
        
        # Auto-select fastest model if none specified
        if not model:
            model = await self.get_fastest_available_model()
            if not model:
                logger.error("No models available")
                return None
        
        # Fallback to default model if auto-selection fails
        if not model:
            model = self.default_model
        
        try:
            # Convert messages to prompt format
            prompt = self._messages_to_prompt(messages)
            
            logger.info(f"Generating response with model: {model}")
            logger.debug(f"Prompt: {prompt[:100]}...")
            logger.debug(f"Full request payload: {json.dumps({
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': temperature,
                    'num_predict': max_tokens,
                }
            }, indent=2)}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_k": 20,        # Limit vocabulary for faster generation
                            "top_p": 0.9,       # Focus on most likely tokens
                            "repeat_penalty": 1.1,  # Reduce repetition
                            "num_ctx": 2048,    # Smaller context window for speed
                        }
                    }
                )
                
                logger.debug(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("response", "").strip()
                    logger.info(f"Successfully generated local AI response: {len(content)} chars")
                    return content
                else:
                    logger.error(f"Local AI API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Local AI error: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    async def generate_streaming_response(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from local AI
        
        Args:
            messages: List of message objects
            model: Model name to use
            max_tokens: Maximum tokens
            temperature: Creativity level
            
        Yields:
            str: Response chunks as they arrive
        """
        if not await self.is_available():
            logger.warning("Local AI not available for streaming")
            yield "I'm sorry, but the local AI service is not available right now."
            return
        
        # Auto-select fastest model if none specified
        if not model:
            model = await self.get_fastest_available_model()
            if not model:
                yield "No AI models are currently available."
                return
        
        try:
            prompt = self._messages_to_prompt(messages)
            
            logger.info(f"Starting streaming response with model: {model}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": True,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                            "top_k": 20,        # Limit vocabulary for faster generation
                            "top_p": 0.9,       # Focus on most likely tokens
                            "repeat_penalty": 1.1,  # Reduce repetition
                            "num_ctx": 2048,    # Smaller context window for speed
                        }
                    }
                ) as response:
                    
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    chunk_data = json.loads(line)
                                    chunk = chunk_data.get("response", "")
                                    if chunk:
                                        yield chunk
                                    
                                    # Check if done
                                    if chunk_data.get("done", False):
                                        break
                                        
                                except json.JSONDecodeError:
                                    continue
                    else:
                        yield "Error generating response from local AI."
                        
        except Exception as e:
            logger.error(f"Local AI streaming error: {e}")
            yield "I encountered an error while generating the response."
    
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
    
    def get_fallback_response(self, user_message: str) -> str:
        """
        Generate a fallback response when local AI is unavailable
        
        Args:
            user_message: The user's message
            
        Returns:
            A helpful fallback response
        """
        user_lower = user_message.lower()
        
        if any(word in user_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm ECHO, your productivity assistant. My local AI brain is currently unavailable, but I can still help you manage tasks and habits through the app interface."
        
        elif any(word in user_lower for word in ['task', 'todo']):
            return "I can help you manage tasks! You can create, update, and track your tasks using the task management features. The local AI for smart suggestions is temporarily unavailable."
        
        elif any(word in user_lower for word in ['habit', 'streak']):
            return "I can help you track habits and build streaks! Use the habits section to create new habits and log completions. AI-powered habit insights are temporarily unavailable."
        
        else:
            return "I'm ECHO, your productivity assistant! While my local AI capabilities are currently unavailable, you can still use all the core productivity features. Please check that Ollama is running with models installed."


# Global client instance
local_ai_client = LocalAIClient()


# Example usage and setup instructions:
"""
# 1. Install Ollama (https://ollama.ai/)
# 2. Pull a model:
#    ollama pull gemma2:2b    # Smaller, faster model
#    ollama pull gemma2:9b    # Larger, more capable
#    ollama pull llama3:8b    # Alternative model

# 3. Test the client:
messages = [
    {"role": "system", "content": "You are ECHO, a helpful productivity assistant."},
    {"role": "user", "content": "How can I be more productive?"}
]
response = await local_ai_client.generate_response(messages)
print(response)
"""
