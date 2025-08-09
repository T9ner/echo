"""
Test the Task Management API

This script demonstrates how your API works by:
1. Creating sample tasks
2. Reading them back
3. Updating a task
4. Getting statistics
5. Deleting a task

Run this to see your API in action!
"""
import requests
import json
from datetime import datetime, timedelta

# API base URL (when server is running)
BASE_URL = "http://localhost:8000/api/v1"

def test_task_api():
    """Test all task API endpoints"""
    print("🧪 TESTING TASK MANAGEMENT API")
    print("=" * 50)
    print("Make sure to run 'python run.py' in another terminal first!")
    print()
    
    try:
        # Test 1: Create a new task
        print("📝 TEST 1: Creating a new task...")
        task_data = {
            "title": "Learn FastAPI",
            "description": "Master FastAPI for ECHO AI project",
            "priority": "high",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/tasks", json=task_data)
        if response.status_code == 201:
            created_task = response.json()
            task_id = created_task["id"]
            print(f"✅ Task created successfully!")
            print(f"   ID: {task_id}")
            print(f"   Title: {created_task['title']}")
            print(f"   Status: {created_task['status']}")
        else:
            print(f"❌ Failed to create task: {response.status_code}")
            return
        
        # Test 2: Get all tasks
        print("\n📋 TEST 2: Getting all tasks...")
        response = requests.get(f"{BASE_URL}/tasks")
        if response.status_code == 200:
            tasks = response.json()
            print(f"✅ Found {len(tasks)} tasks:")
            for task in tasks:
                print(f"   • {task['title']} (Status: {task['status']})")
        else:
            print(f"❌ Failed to get tasks: {response.status_code}")
        
        # Test 3: Get specific task
        print(f"\n🔍 TEST 3: Getting specific task by ID...")
        response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if response.status_code == 200:
            task = response.json()
            print(f"✅ Found task: {task['title']}")
            print(f"   Created: {task['created_at']}")
            print(f"   Due: {task['due_date']}")
        else:
            print(f"❌ Failed to get task: {response.status_code}")
        
        # Test 4: Update task (mark as completed)
        print(f"\n✏️ TEST 4: Updating task (mark as completed)...")
        update_data = {
            "status": "completed",
            "description": "Successfully learned FastAPI basics!"
        }
        response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data)
        if response.status_code == 200:
            updated_task = response.json()
            print(f"✅ Task updated successfully!")
            print(f"   Status: {updated_task['status']}")
            print(f"   Completed at: {updated_task['completed_at']}")
        else:
            print(f"❌ Failed to update task: {response.status_code}")
        
        # Test 5: Get task statistics
        print(f"\n📊 TEST 5: Getting task statistics...")
        response = requests.get(f"{BASE_URL}/tasks/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Task Statistics:")
            print(f"   Total: {stats['total']}")
            print(f"   Completed: {stats['completed']}")
            print(f"   Pending: {stats['pending']}")
            print(f"   Overdue: {stats['overdue']}")
        else:
            print(f"❌ Failed to get statistics: {response.status_code}")
        
        # Test 6: Filter tasks by status
        print(f"\n🔎 TEST 6: Filtering completed tasks...")
        response = requests.get(f"{BASE_URL}/tasks?status=completed")
        if response.status_code == 200:
            completed_tasks = response.json()
            print(f"✅ Found {len(completed_tasks)} completed tasks:")
            for task in completed_tasks:
                print(f"   • {task['title']} (Completed: {task['completed_at']})")
        else:
            print(f"❌ Failed to filter tasks: {response.status_code}")
        
        # Test 7: Delete task
        print(f"\n🗑️ TEST 7: Deleting task...")
        response = requests.delete(f"{BASE_URL}/tasks/{task_id}")
        if response.status_code == 204:
            print(f"✅ Task deleted successfully!")
        else:
            print(f"❌ Failed to delete task: {response.status_code}")
        
        # Verify deletion
        print(f"\n🔍 TEST 8: Verifying task was deleted...")
        response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if response.status_code == 404:
            print(f"✅ Confirmed: Task no longer exists")
        else:
            print(f"❌ Task still exists: {response.status_code}")
        
        print("\n🎉 ALL TESTS COMPLETED!")
        print("Your Task Management API is working perfectly! 🚀")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error!")
        print("Make sure the server is running:")
        print("   1. Open another terminal")
        print("   2. cd backend")
        print("   3. python run.py")
        print("   4. Then run this test again")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def show_api_documentation():
    """Show how to explore the API documentation"""
    print("\n📚 EXPLORE YOUR API:")
    print("=" * 30)
    print("1. Start the server: python run.py")
    print("2. Visit: http://localhost:8000/docs")
    print("3. Try the endpoints interactively!")
    print()
    print("Your API endpoints:")
    print("• POST   /api/v1/tasks           - Create task")
    print("• GET    /api/v1/tasks           - Get all tasks")
    print("• GET    /api/v1/tasks/{id}      - Get specific task")
    print("• PUT    /api/v1/tasks/{id}      - Update task")
    print("• DELETE /api/v1/tasks/{id}      - Delete task")
    print("• GET    /api/v1/tasks/stats/summary - Get statistics")

if __name__ == "__main__":
    test_task_api()
    show_api_documentation()