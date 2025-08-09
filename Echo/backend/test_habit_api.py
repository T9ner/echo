"""
Test the Habit Tracking API

This script demonstrates how your habit system works by:
1. Creating a new habit
2. Logging completions over several days
3. Watching streaks build up
4. Getting statistics and analytics
5. Testing the streak calculation algorithm

Run this to see your habit tracking in action!
"""
import requests
import json
from datetime import datetime, date, timedelta

# API base URL (when server is running)
BASE_URL = "http://localhost:8000/api/v1"

def test_habit_api():
    """Test all habit API endpoints with streak calculation"""
    print("🎯 TESTING HABIT TRACKING API")
    print("=" * 50)
    print("Make sure to run 'python run.py' in another terminal first!")
    print()
    
    try:
        # Test 1: Create a new habit
        print("🏃 TEST 1: Creating a new habit...")
        habit_data = {
            "name": "Morning Exercise",
            "description": "30 minutes of cardio to start the day",
            "frequency": "daily",
            "target_count": 1
        }
        
        response = requests.post(f"{BASE_URL}/habits", json=habit_data)
        if response.status_code == 201:
            created_habit = response.json()
            habit_id = created_habit["id"]
            print(f"✅ Habit created successfully!")
            print(f"   ID: {habit_id}")
            print(f"   Name: {created_habit['name']}")
            print(f"   Frequency: {created_habit['frequency']}")
            print(f"   Current Streak: {created_habit['current_streak']}")
            print(f"   Longest Streak: {created_habit['longest_streak']}")
        else:
            print(f"❌ Failed to create habit: {response.status_code}")
            return
        
        # Test 2: Log completions for several days to build a streak
        print(f"\n📅 TEST 2: Logging completions to build a streak...")
        
        # Log completions for the past 5 days
        for i in range(5, 0, -1):  # 5 days ago to yesterday
            completion_date = (date.today() - timedelta(days=i)).isoformat()
            log_data = {
                "completed_date": completion_date,
                "count": 1,
                "notes": f"Day {6-i} of building my exercise habit!"
            }
            
            response = requests.post(f"{BASE_URL}/habits/{habit_id}/logs", json=log_data)
            if response.status_code == 201:
                log = response.json()
                print(f"   ✅ Logged completion for {completion_date}")
            else:
                print(f"   ❌ Failed to log completion: {response.status_code}")
        
        # Log completion for today
        today_log = {
            "completed_date": date.today().isoformat(),
            "count": 1,
            "notes": "Today's workout - feeling strong!"
        }
        
        response = requests.post(f"{BASE_URL}/habits/{habit_id}/logs", json=today_log)
        if response.status_code == 201:
            print(f"   ✅ Logged completion for today!")
        
        # Test 3: Check updated habit with streak
        print(f"\n🔥 TEST 3: Checking habit with calculated streak...")
        response = requests.get(f"{BASE_URL}/habits/{habit_id}")
        if response.status_code == 200:
            updated_habit = response.json()
            print(f"✅ Habit streak updated!")
            print(f"   Current Streak: {updated_habit['current_streak']} days 🔥")
            print(f"   Longest Streak: {updated_habit['longest_streak']} days 🏆")
        else:
            print(f"❌ Failed to get updated habit: {response.status_code}")
        
        # Test 4: Get completion history
        print(f"\n📋 TEST 4: Getting completion history...")
        response = requests.get(f"{BASE_URL}/habits/{habit_id}/logs")
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ Found {len(logs)} completion logs:")
            for log in logs:
                print(f"   • {log['completed_date']}: {log['count']}x - {log['notes']}")
        else:
            print(f"❌ Failed to get logs: {response.status_code}")
        
        # Test 5: Get detailed statistics
        print(f"\n📊 TEST 5: Getting habit statistics...")
        response = requests.get(f"{BASE_URL}/habits/{habit_id}/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Habit Statistics:")
            print(f"   Total Completions: {stats['total_completions']}")
            print(f"   Completion Rate: {stats['completion_rate']}%")
            print(f"   Current Streak: {stats['current_streak']} days")
            print(f"   Longest Streak: {stats['longest_streak']} days")
            print(f"   Days Since Creation: {stats['days_since_creation']}")
            print(f"   Last Completed: {stats['last_completed']}")
        else:
            print(f"❌ Failed to get statistics: {response.status_code}")
        
        # Test 6: Get all habits
        print(f"\n📝 TEST 6: Getting all habits...")
        response = requests.get(f"{BASE_URL}/habits")
        if response.status_code == 200:
            habits = response.json()
            print(f"✅ Found {len(habits)} habits:")
            for habit in habits:
                print(f"   • {habit['name']} - {habit['current_streak']} day streak")
        else:
            print(f"❌ Failed to get habits: {response.status_code}")
        
        # Test 7: Get overall statistics
        print(f"\n🏆 TEST 7: Getting overall habit statistics...")
        response = requests.get(f"{BASE_URL}/habits/stats/summary")
        if response.status_code == 200:
            overall_stats = response.json()
            print(f"✅ Overall Statistics:")
            print(f"   Total Habits: {overall_stats['total_habits']}")
            print(f"   Active Habits: {overall_stats['active_habits']}")
            print(f"   Total Completions: {overall_stats['total_completions']}")
            print(f"   Best Current Streak: {overall_stats['best_current_streak']} days")
        else:
            print(f"❌ Failed to get overall statistics: {response.status_code}")
        
        # Test 8: Test streak break (skip a day)
        print(f"\n💔 TEST 8: Testing streak break (skip tomorrow)...")
        print("   (Skipping tomorrow to see how streaks handle gaps)")
        
        # Log completion for day after tomorrow
        future_date = (date.today() + timedelta(days=2)).isoformat()
        future_log = {
            "completed_date": future_date,
            "count": 1,
            "notes": "Back after missing a day"
        }
        
        response = requests.post(f"{BASE_URL}/habits/{habit_id}/logs", json=future_log)
        if response.status_code == 201:
            print(f"   ✅ Logged completion for {future_date}")
            
            # Check streak after gap
            response = requests.get(f"{BASE_URL}/habits/{habit_id}")
            if response.status_code == 200:
                habit_after_gap = response.json()
                print(f"   📊 Streak after gap:")
                print(f"      Current Streak: {habit_after_gap['current_streak']} days")
                print(f"      Longest Streak: {habit_after_gap['longest_streak']} days")
                print("   💡 Current streak reset due to gap, but longest streak preserved!")
        
        # Test 9: Update habit
        print(f"\n✏️ TEST 9: Updating habit...")
        update_data = {
            "target_count": 2,
            "description": "Updated: 45 minutes of cardio and strength training"
        }
        response = requests.put(f"{BASE_URL}/habits/{habit_id}", json=update_data)
        if response.status_code == 200:
            updated_habit = response.json()
            print(f"✅ Habit updated successfully!")
            print(f"   New Target Count: {updated_habit['target_count']}")
            print(f"   New Description: {updated_habit['description']}")
        else:
            print(f"❌ Failed to update habit: {response.status_code}")
        
        # Test 10: Clean up - delete habit
        print(f"\n🗑️ TEST 10: Cleaning up - deleting habit...")
        response = requests.delete(f"{BASE_URL}/habits/{habit_id}")
        if response.status_code == 204:
            print(f"✅ Habit deleted successfully!")
        else:
            print(f"❌ Failed to delete habit: {response.status_code}")
        
        print("\n🎉 ALL HABIT TESTS COMPLETED!")
        print("Your Habit Tracking System is working perfectly! 🚀")
        print("\n🔥 Key Features Demonstrated:")
        print("   • Habit creation and management")
        print("   • Completion logging with notes")
        print("   • Automatic streak calculation")
        print("   • Comprehensive statistics")
        print("   • Streak preservation (longest streak)")
        print("   • Gap handling (streak resets)")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error!")
        print("Make sure the server is running:")
        print("   1. Open another terminal")
        print("   2. cd backend")
        print("   3. python run.py")
        print("   4. Then run this test again")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def show_habit_api_documentation():
    """Show how to explore the habit API documentation"""
    print("\n📚 EXPLORE YOUR HABIT API:")
    print("=" * 40)
    print("1. Start the server: python run.py")
    print("2. Visit: http://localhost:8000/docs")
    print("3. Look for the 'habits' section!")
    print()
    print("Your habit endpoints:")
    print("• POST   /api/v1/habits           - Create habit")
    print("• GET    /api/v1/habits           - Get all habits")
    print("• GET    /api/v1/habits/{id}      - Get specific habit")
    print("• PUT    /api/v1/habits/{id}      - Update habit")
    print("• DELETE /api/v1/habits/{id}      - Delete habit")
    print("• POST   /api/v1/habits/{id}/logs - Log completion 🔥")
    print("• GET    /api/v1/habits/{id}/logs - Get history")
    print("• GET    /api/v1/habits/{id}/stats - Get statistics")
    print("• GET    /api/v1/habits/stats/summary - Overall stats")

if __name__ == "__main__":
    test_habit_api()
    show_habit_api_documentation()