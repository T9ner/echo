"""Test calendar API functionality"""
import requests
import json
from datetime import datetime, timedelta

def test_calendar_api():
    base_url = "http://localhost:8000/api/v1"
    
    print("🧪 Testing Calendar API...")
    
    # Test 1: Get all events (should be empty initially)
    try:
        response = requests.get(f"{base_url}/events/", timeout=5)
        print(f"✅ GET /events/ - Status: {response.status_code}")
        if response.status_code == 200:
            events = response.json()
            print(f"   📋 Found {len(events)} events")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        return False
    
    # Test 2: Create a new event
    try:
        new_event = {
            "title": "Test Calendar Event",
            "description": "Testing calendar functionality",
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "event_type": "meeting",
            "status": "scheduled"
        }
        
        response = requests.post(f"{base_url}/events/", json=new_event, timeout=5)
        print(f"✅ POST /events/ - Status: {response.status_code}")
        if response.status_code == 201:
            created_event = response.json()
            print(f"   📅 Created event: {created_event['title']}")
            event_id = created_event['id']
            
            # Test 3: Get the created event
            response = requests.get(f"{base_url}/events/{event_id}", timeout=5)
            print(f"✅ GET /events/{event_id} - Status: {response.status_code}")
            
            return True
        else:
            print(f"   ❌ Error creating event: {response.text}")
    except Exception as e:
        print(f"   ❌ Error creating event: {e}")
    
    return False

if __name__ == "__main__":
    success = test_calendar_api()
    if success:
        print("🎉 Calendar API is working!")
    else:
        print("❌ Calendar API tests failed")
