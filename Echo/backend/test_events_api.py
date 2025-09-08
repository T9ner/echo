#!/usr/bin/env python3
"""
Test the Events API endpoints

This script tests the calendar/events functionality by:
1. Creating sample events
2. Retrieving events with filtering
3. Testing month view
4. Checking conflict detection
5. Testing reminders
"""
import httpx
import json
from datetime import datetime, timedelta
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

async def test_events_api():
    """Test all events API endpoints"""
    
    print("🗓️  TESTING EVENTS API")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Health check
        print("\n1. Testing API health...")
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ API is healthy")
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            return
        
        # Test 2: Create events
        print("\n2. Creating sample events...")
        
        # Sample events
        events_to_create = [
            {
                "title": "Team Standup",
                "description": "Daily team synchronization meeting",
                "location": "Conference Room A",
                "start_time": (datetime.now() + timedelta(days=1, hours=9)).isoformat(),
                "end_time": (datetime.now() + timedelta(days=1, hours=9, minutes=30)).isoformat(),
                "event_type": "meeting",
                "all_day": False
            },
            {
                "title": "Project Deadline",
                "description": "Final submission for Q1 project",
                "start_time": (datetime.now() + timedelta(days=7)).isoformat(),
                "end_time": (datetime.now() + timedelta(days=7, hours=1)).isoformat(),
                "event_type": "task",
                "all_day": True
            },
            {
                "title": "Doctor Appointment",
                "description": "Annual checkup",
                "location": "Medical Center",
                "start_time": (datetime.now() + timedelta(days=3, hours=14)).isoformat(),
                "end_time": (datetime.now() + timedelta(days=3, hours=15)).isoformat(),
                "event_type": "personal",
                "all_day": False
            }
        ]
        
        created_events = []
        for event_data in events_to_create:
            try:
                response = await client.post(f"{BASE_URL}/events/", json=event_data)
                if response.status_code == 201:
                    event = response.json()
                    created_events.append(event)
                    print(f"✅ Created event: {event['title']}")
                else:
                    print(f"❌ Failed to create event: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Error creating event: {e}")
        
        if not created_events:
            print("❌ No events created, stopping tests")
            return
        
        # Test 3: Get all events
        print(f"\n3. Retrieving all events...")
        try:
            response = await client.get(f"{BASE_URL}/events/")
            if response.status_code == 200:
                events_list = response.json()
                print(f"✅ Retrieved {events_list['total']} events")
                print(f"   Page {events_list['page']} of events")
            else:
                print(f"❌ Failed to get events: {response.status_code}")
        except Exception as e:
            print(f"❌ Error getting events: {e}")
        
        # Test 4: Get specific event
        print(f"\n4. Getting specific event details...")
        if created_events:
            event_id = created_events[0]['id']
            try:
                response = await client.get(f"{BASE_URL}/events/{event_id}")
                if response.status_code == 200:
                    event = response.json()
                    print(f"✅ Retrieved event: {event['title']}")
                    print(f"   Duration: {event['duration_minutes']} minutes")
                    print(f"   Recurring: {event['is_recurring']}")
                else:
                    print(f"❌ Failed to get event: {response.status_code}")
            except Exception as e:
                print(f"❌ Error getting event: {e}")
        
        # Test 5: Update event
        print(f"\n5. Updating event...")
        if created_events:
            event_id = created_events[0]['id']
            update_data = {
                "description": "Updated: Daily team synchronization meeting with agenda",
                "location": "Conference Room B"
            }
            try:
                response = await client.put(f"{BASE_URL}/events/{event_id}", json=update_data)
                if response.status_code == 200:
                    updated_event = response.json()
                    print(f"✅ Updated event: {updated_event['title']}")
                    print(f"   New location: {updated_event['location']}")
                else:
                    print(f"❌ Failed to update event: {response.status_code}")
            except Exception as e:
                print(f"❌ Error updating event: {e}")
        
        # Test 6: Get month events
        print(f"\n6. Getting events for current month...")
        now = datetime.now()
        try:
            response = await client.get(f"{BASE_URL}/events/month/{now.year}/{now.month}")
            if response.status_code == 200:
                month_data = response.json()
                print(f"✅ Retrieved {month_data['total_events']} events for {now.year}-{now.month:02d}")
            else:
                print(f"❌ Failed to get month events: {response.status_code}")
        except Exception as e:
            print(f"❌ Error getting month events: {e}")
        
        # Test 7: Check conflicts
        print(f"\n7. Testing conflict detection...")
        if created_events:
            # Try to create a conflicting event
            conflict_check = {
                "start_time": created_events[0]['start_time'],
                "end_time": created_events[0]['end_time'],
                "all_day": False
            }
            try:
                response = await client.post(f"{BASE_URL}/events/conflicts", json=conflict_check)
                if response.status_code == 200:
                    conflict_result = response.json()
                    if conflict_result['has_conflicts']:
                        print(f"✅ Conflict detection working: Found {len(conflict_result['conflicting_events'])} conflicts")
                    else:
                        print("⚠️  No conflicts detected (unexpected)")
                else:
                    print(f"❌ Failed to check conflicts: {response.status_code}")
            except Exception as e:
                print(f"❌ Error checking conflicts: {e}")
        
        # Test 8: Add reminder
        print(f"\n8. Adding reminder to event...")
        if created_events:
            event_id = created_events[0]['id']
            reminder_data = {
                "minutes_before": 15,
                "method": "notification"
            }
            try:
                response = await client.post(f"{BASE_URL}/events/{event_id}/reminders", json=reminder_data)
                if response.status_code == 201:
                    reminder = response.json()
                    print(f"✅ Added reminder: {reminder['minutes_before']} minutes before")
                else:
                    print(f"❌ Failed to add reminder: {response.status_code}")
            except Exception as e:
                print(f"❌ Error adding reminder: {e}")
        
        # Test 9: Get upcoming events
        print(f"\n9. Getting upcoming events...")
        try:
            response = await client.get(f"{BASE_URL}/events/upcoming/list?limit=5")
            if response.status_code == 200:
                upcoming = response.json()
                print(f"✅ Retrieved {len(upcoming)} upcoming events")
                for event in upcoming[:3]:  # Show first 3
                    print(f"   - {event['title']} at {event['start_time']}")
            else:
                print(f"❌ Failed to get upcoming events: {response.status_code}")
        except Exception as e:
            print(f"❌ Error getting upcoming events: {e}")
        
        # Test 10: Get event statistics
        print(f"\n10. Getting event statistics...")
        try:
            response = await client.get(f"{BASE_URL}/events/stats/by-type")
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Event statistics:")
                for event_type, count in stats['stats_by_type'].items():
                    print(f"   - {event_type}: {count} events")
                print(f"   Total: {stats['total_events']} events")
            else:
                print(f"❌ Failed to get statistics: {response.status_code}")
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
        
        # Test 11: Search events
        print(f"\n11. Searching events...")
        try:
            response = await client.get(f"{BASE_URL}/events/?search=team")
            if response.status_code == 200:
                search_results = response.json()
                print(f"✅ Search found {search_results['total']} events matching 'team'")
            else:
                print(f"❌ Failed to search events: {response.status_code}")
        except Exception as e:
            print(f"❌ Error searching events: {e}")
        
        # Test 12: Delete event (cleanup)
        print(f"\n12. Cleaning up - deleting test events...")
        deleted_count = 0
        for event in created_events:
            try:
                response = await client.delete(f"{BASE_URL}/events/{event['id']}")
                if response.status_code == 204:
                    deleted_count += 1
                    print(f"✅ Deleted event: {event['title']}")
                else:
                    print(f"❌ Failed to delete event: {response.status_code}")
            except Exception as e:
                print(f"❌ Error deleting event: {e}")
        
        print(f"\n🎉 Events API testing completed!")
        print(f"   Created: {len(created_events)} events")
        print(f"   Deleted: {deleted_count} events")


def show_events_api_documentation():
    """Show how to explore the events API documentation"""
    print("\n📚 EXPLORE YOUR EVENTS API:")
    print("=" * 40)
    print("1. Start the server: python run.py")
    print("2. Open: http://localhost:8000/docs")
    print("3. Look for the 'events' section!")
    print()
    print("Your Events API endpoints:")
    print("• POST   /api/v1/events/                    - Create new event 📅")
    print("• GET    /api/v1/events/                    - List events with filtering")
    print("• GET    /api/v1/events/{id}               - Get specific event")
    print("• PUT    /api/v1/events/{id}               - Update event")
    print("• DELETE /api/v1/events/{id}               - Delete event")
    print("• GET    /api/v1/events/month/{year}/{month} - Get month events")
    print("• POST   /api/v1/events/conflicts          - Check conflicts")
    print("• POST   /api/v1/events/bulk               - Create multiple events")
    print("• POST   /api/v1/events/{id}/reminders     - Add reminder")
    print("• GET    /api/v1/events/upcoming/list      - Get upcoming events")
    print("• GET    /api/v1/events/stats/by-type      - Get event statistics")


if __name__ == "__main__":
    asyncio.run(test_events_api())
    show_events_api_documentation()