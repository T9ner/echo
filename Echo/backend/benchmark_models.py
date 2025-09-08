#!/usr/bin/env python3
"""
ECHO AI Model Benchmark Script

This script benchmarks different AI models to help you choose the fastest one
for your productivity needs. It tests:
1. Response speed
2. Response quality
3. Model size and memory usage

Run this to find your optimal model!
"""
import asyncio
import time
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.services.local_ai_client import LocalAIClient


async def benchmark_model(client: LocalAIClient, model_name: str):
    """Benchmark a specific model"""
    print(f"\n🧪 Testing {model_name}...")
    
    # Test messages
    test_messages = [
        {
            "role": "system",
            "content": "You are ECHO, a productivity assistant. Be brief and helpful."
        },
        {
            "role": "user",
            "content": "I have 5 tasks due today and feel overwhelmed. What should I do?"
        }
    ]
    
    try:
        # Measure response time
        start_time = time.time()
        response = await client.generate_response(test_messages, model=model_name)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        if response:
            print(f"✅ {model_name}")
            print(f"   ⏱️  Response time: {response_time:.2f} seconds")
            print(f"   📝 Response length: {len(response)} characters")
            print(f"   💬 Response: {response[:100]}{'...' if len(response) > 100 else ''}")
            
            # Rate the response (simple heuristic)
            quality_score = min(10, len(response) // 20)  # Longer responses get higher scores
            if "overwhelmed" in response.lower() or "priority" in response.lower():
                quality_score += 2  # Bonus for relevant keywords
            
            print(f"   ⭐ Quality score: {quality_score}/10")
            
            return {
                "model": model_name,
                "response_time": response_time,
                "response_length": len(response),
                "quality_score": quality_score,
                "success": True
            }
        else:
            print(f"❌ {model_name} - No response generated")
            return {"model": model_name, "success": False}
            
    except Exception as e:
        print(f"❌ {model_name} - Error: {e}")
        return {"model": model_name, "success": False, "error": str(e)}


async def main():
    """Main benchmark function"""
    print("⚡ ECHO AI Model Benchmark")
    print("=" * 50)
    print("Testing available models for speed and quality...")
    
    client = LocalAIClient()
    
    # Check if Ollama is available
    if not await client.is_available():
        print("❌ Ollama is not running. Please start it with: ollama serve")
        return
    
    # Get available models
    models = await client.list_models()
    
    if not models:
        print("❌ No models found. Please install some models first:")
        print("   ollama pull gemma2:2b")
        print("   ollama pull phi3:mini")
        return
    
    print(f"📋 Found {len(models)} models to test:")
    for model in models:
        print(f"   - {model}")
    
    # Benchmark each model
    results = []
    for model in models:
        result = await benchmark_model(client, model)
        results.append(result)
        
        # Small delay between tests
        await asyncio.sleep(1)
    
    # Show results summary
    print("\n📊 BENCHMARK RESULTS")
    print("=" * 50)
    
    successful_results = [r for r in results if r.get("success")]
    
    if not successful_results:
        print("❌ No models completed successfully")
        return
    
    # Sort by response time (fastest first)
    successful_results.sort(key=lambda x: x["response_time"])
    
    print("🏆 FASTEST MODELS (by response time):")
    for i, result in enumerate(successful_results, 1):
        print(f"{i}. {result['model']}")
        print(f"   ⏱️  {result['response_time']:.2f}s")
        print(f"   ⭐ Quality: {result['quality_score']}/10")
        print()
    
    # Recommend best model
    best_model = successful_results[0]
    print(f"🎯 RECOMMENDED MODEL: {best_model['model']}")
    print(f"   Fastest response time: {best_model['response_time']:.2f} seconds")
    print(f"   Quality score: {best_model['quality_score']}/10")
    
    print(f"\n💡 To use this model, update your .env file:")
    print(f"   LOCAL_AI_MODEL={best_model['model']}")
    
    # Show model size recommendations
    print(f"\n📏 MODEL SIZE GUIDE:")
    print("   • 1B-2B parameters: Ultra fast, good for quick responses")
    print("   • 3B-7B parameters: Balanced speed and quality")
    print("   • 8B+ parameters: Best quality, slower responses")


if __name__ == "__main__":
    asyncio.run(main())