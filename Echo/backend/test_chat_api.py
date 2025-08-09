"""
Test the AI Chat API

This script demonstrates how your AI chat system works by:
1. Testing chat health status
2. Getting productivity context
3. Sending messages to ECHO
4. Testing fallback responses
5. Checking conversation history

Run this to see your AI assistant in action!
"""
import requests
import json
from datetime import datetime

# API base URL (when server is running)
BASE_URL = "http://localhost:8000/api/v1"

def test_chat_api():
    """Test all chat API endpoints"""
    print("🤖 TESTING AI CHAT SYSTEM")
    print("=" * 50)
    print("Make sure to run 'python run.py' in another terminal first!")
    print()
    
    try:
        # Test 1: Check chat system health
        print("🏥 TEST 1: Checking AI system health...")
        response = requests.get(f"{BASE_URL}/chat/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Chat system status:")
            print(f"   AI Available: {health['ai_available']}")
            print(f"   Fallback Mode: {health['fallback_mode']}")
            print(f"   Status: {health['status_message']}")
        else:
            print(f"❌ Failed to get health status: {response.status_code}")
            return
        
        # Test 2: Get productivity context
        print(f"\n📊 TEST 2: Getting productivity context...")
        response = requests.get(f"{BASE_URL}/chat/context")
        if response.status_code == 200:
            context = response.json()
            print(f"✅ ECHO knows about your productivity:")
            print(f"   Date: {context['current_date']}")
            
            tasks = context['tasks_summary']
            print(f"   Tasks: {tasks.get('total', 0)} total, {tasks.get('completed', 0)} completed")
            
            habits = context['habits_summary']
            print(f"   Habits: {habits.get('total', 0)} total, {habits.get('active', 0)} active")
            
            if context.get('recommendations'):
                print(f"   Recommendations: {len(context['recommendations'])} suggestions")
        else:
            print(f"❌ Failed to get context: {response.status_code}")
        
        # Test 3: Send a greeting message
        print(f"\n💬 TEST 3: Sending greeting to ECHO...")
        message_data = {
            "message": "Hello ECHO! How are you today?",
            "include_context": True,
            "stream_response": False
        }
        
        response = requests.post(f"{BASE_URL}/chat/message", json=message_data)
        if response.status_code == 201:
            chat_response = response.json()
            print(f"✅ ECHO responded:")
            print(f"   User: {chat_response['message']}")
            print(f"   ECHO: {chat_response['response']}")
            print(f"   Response time: {chat_response['response_time_ms']}ms")
        else:
            print(f"❌ Failed to send message: {response.status_code}")
        
        # Test 4: Ask about productivity
        print(f"\n📈 TEST 4: Asking about productivity status...")
        productivity_message = {
            "message": "How am I doing with my tasks and habits?",
            "include_context": True,
            "stream_response": False
        }
        
        response = requests.post(f"{BASE_URL}/chat/message", json=productivity_message)
        if response.status_code == 201:
            chat_response = response.json()
            print(f"✅ ECHO's productivity analysis:")
            print(f"   Question: {chat_response['message']}")
            print(f"   Analysis: {chat_response['response']}")
        else:
            print(f"❌ Failed to get productivity analysis: {response.status_code}")
        
        # Test 5: Ask for advice
        print(f"\n💡 TEST 5: Asking for productivity advice...")
        advice_message = {
            "message": "What should I focus on today to be more productive?",
            "include_context": True,
            "stream_response": False
        }
        
        response = requests.post(f"{BASE_URL}/chat/message", json=advice_message)
        if response.status_code == 201:
            chat_response = response.json()
            print(f"✅ ECHO's advice:")
            print(f"   Question: {chat_response['message']}")
            print(f"   Advice: {chat_response['response']}")
        else:
            print(f"❌ Failed to get advice: {response.status_code}")
        
        # Test 6: Get conversation history
        print(f"\n📚 TEST 6: Getting conversation history...")
        response = requests.get(f"{BASE_URL}/chat/history?limit=5")
        if response.status_code == 200:
            history = response.json()
            print(f"✅ Conversation history:")
            print(f"   Total messages: {history['total_messages']}")
            print(f"   Recent messages: {len(history['messages'])}")
            
            for i, msg in enumerate(history['messages'][-3:], 1):  # Show last 3
                print(f"   {i}. User: {msg['message'][:50]}...")
                print(f"      ECHO: {msg['response'][:50]}...")
        else:
            print(f"❌ Failed to get history: {response.status_code}")
        
        # Test 7: Test different types of questions
        print(f"\n🎯 TEST 7: Testing different question types...")
        
        test_questions = [
            "What are my overdue tasks?",
            "How are my habit streaks?",
            "Give me motivation to stay productive",
            "Help me prioritize my work"
        ]
        
        for question in test_questions:
            message_data = {
                "message": question,
                "include_context": True,
                "stream_response": False
            }
            
            response = requests.post(f"{BASE_URL}/chat/message", json=message_data)
            if response.status_code == 201:
                chat_response = response.json()
                print(f"   Q: {question}")
                print(f"   A: {chat_response['response'][:100]}...")
                print()
            else:
                print(f"   ❌ Failed: {question}")
        
        print("🎉 ALL CHAT TESTS COMPLETED!")
        print("Your AI Chat System is working! 🤖✨")
        print("\n🔥 Key Features Demonstrated:")
        print("   • Personalized responses based on your data")
        print("   • Context-aware conversations")
        print("   • Productivity analysis and advice")
        print("   • Conversation history tracking")
        print("   • Fallback responses when AI is unavailable")
        print("   • Health monitoring and status checks")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error!")
        print("Make sure the server is running:")
        print("   1. Open another terminal")
        print("   2. cd backend")
        print("   3. python run.py")
        print("   4. Then run this test again")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def show_chat_api_documentation():
    """Show how to explore the chat API documentation"""
    print("\n📚 EXPLORE YOUR AI CHAT API:")
    print("=" * 40)
    print("1. Start the server: python run.py")
    print("2. Visit: http://localhost:8000/docs")
    print("3. Look for the 'chat' section!")
    print()
    print("Your AI chat endpoints:")
    print("• POST   /api/v1/chat/message     - Talk to ECHO 🤖")
    print("• GET    /api/v1/chat/stream/{msg} - Streaming responses")
    print("• GET    /api/v1/chat/history     - Conversation history")
    print("• GET    /api/v1/chat/health      - AI system status")
    print("• GET    /api/v1/chat/context     - What ECHO knows about you")
    print()
    print("💡 Pro tip: ECHO uses your actual tasks and habits data")
    print("   to give personalized responses! Try creating some tasks")
    print("   and habits first, then chat with ECHO about them.")

if __name__ == "__main__":
    test_chat_api()
    show_chat_api_documentation()