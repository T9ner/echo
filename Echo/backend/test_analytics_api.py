"""
Test the Analytics API

This script demonstrates how your analytics system works by:
1. Getting productivity overview with scores and metrics
2. Testing chart data generation for visualizations
3. Getting AI-powered insights and recommendations
4. Comparing productivity across different periods
5. Testing data export functionality

Run this to see your productivity analytics in action!
"""
import requests
import json
from datetime import datetime, date, timedelta

# API base URL (when server is running)
BASE_URL = "http://localhost:8000/api/v1"

def test_analytics_api():
    """Test all analytics API endpoints"""
    print("📊 TESTING ANALYTICS SYSTEM")
    print("=" * 50)
    print("Make sure to run 'python run.py' in another terminal first!")
    print("Also make sure you have some tasks and habits data for meaningful analytics!")
    print()
    
    try:
        # Test 1: Get productivity overview
        print("📈 TEST 1: Getting productivity overview...")
        response = requests.get(f"{BASE_URL}/analytics/overview")
        if response.status_code == 200:
            overview = response.json()
            print(f"✅ Productivity Overview:")
            print(f"   Period: {overview['period']['days']} days")
            print(f"   Overall Score: {overview['overall_score']['overall_score']:.1f} ({overview['overall_score']['grade']})")
            print(f"   Description: {overview['overall_score']['description']}")
            
            # Task metrics
            tasks = overview['tasks']
            print(f"   Tasks: {tasks['completed_tasks']}/{tasks['total_tasks']} completed ({tasks['completion_rate']:.1f}%)")
            if tasks['overdue_tasks'] > 0:
                print(f"   ⚠️  {tasks['overdue_tasks']} overdue tasks")
            
            # Habit metrics
            habits = overview['habits']
            print(f"   Habits: {habits['active_habits']}/{habits['total_habits']} active")
            print(f"   Best Streak: {habits['best_streak']} days")
            print(f"   Consistency: {habits['consistency_rate']:.1f}%")
            
            # Recommendations
            if overview['recommendations']:
                print(f"   Recommendations:")
                for rec in overview['recommendations'][:3]:  # Show top 3
                    print(f"     • {rec}")
        else:
            print(f"❌ Failed to get overview: {response.status_code}")
            return
        
        # Test 2: Get chart data
        print(f"\n📊 TEST 2: Getting chart data for visualizations...")
        response = requests.get(f"{BASE_URL}/analytics/charts")
        if response.status_code == 200:
            charts = response.json()
            print(f"✅ Generated {len(charts)} charts:")
            for chart in charts:
                print(f"   • {chart['title']} ({chart['chart_type']} chart)")
                print(f"     Data points: {len(chart['data_points'])}")
                if chart['data_points']:
                    # Show sample data point
                    sample = chart['data_points'][0]
                    print(f"     Sample: {sample['label']} = {sample['value']}")
        else:
            print(f"❌ Failed to get charts: {response.status_code}")
        
        # Test 3: Get AI insights
        print(f"\n🧠 TEST 3: Getting AI-powered insights...")
        response = requests.get(f"{BASE_URL}/analytics/insights")
        if response.status_code == 200:
            insights = response.json()
            print(f"✅ Discovered {len(insights)} insights:")
            for insight in insights:
                print(f"   🔍 {insight['title']}")
                print(f"      {insight['description']}")
                print(f"      Type: {insight['insight_type']} (Confidence: {insight['confidence']:.0%})")
                if insight['action_items']:
                    print(f"      Actions: {', '.join(insight['action_items'][:2])}")
                print()
        else:
            print(f"❌ Failed to get insights: {response.status_code}")
        
        # Test 4: Compare periods
        print(f"📅 TEST 4: Comparing productivity periods...")
        # Compare last 15 days vs previous 15 days
        today = date.today()
        current_start = today - timedelta(days=14)
        current_end = today
        previous_start = current_start - timedelta(days=15)
        previous_end = current_start - timedelta(days=1)
        
        params = {
            "current_start": current_start.isoformat(),
            "current_end": current_end.isoformat(),
            "previous_start": previous_start.isoformat(),
            "previous_end": previous_end.isoformat()
        }
        
        response = requests.get(f"{BASE_URL}/analytics/compare", params=params)
        if response.status_code == 200:
            comparison = response.json()
            print(f"✅ Period Comparison:")
            
            changes = comparison['changes']
            print(f"   Task Completion Rate: {changes['task_completion_rate_change']:+.1f}%")
            print(f"   Habit Consistency: {changes['habit_consistency_change']:+.1f}%")
            print(f"   Overall Score: {changes['overall_score_change']:+.1f} points")
            
            if comparison['improvement_areas']:
                print(f"   📈 Improvements:")
                for improvement in comparison['improvement_areas']:
                    print(f"     • {improvement}")
            
            if comparison['decline_areas']:
                print(f"   📉 Areas to focus on:")
                for decline in comparison['decline_areas']:
                    print(f"     • {decline}")
        else:
            print(f"❌ Failed to compare periods: {response.status_code}")
        
        # Test 5: Test specific date range
        print(f"\n📆 TEST 5: Testing custom date range...")
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        params = {"start_date": start_date, "end_date": end_date}
        response = requests.get(f"{BASE_URL}/analytics/overview", params=params)
        if response.status_code == 200:
            weekly_overview = response.json()
            print(f"✅ Last 7 days analytics:")
            print(f"   Period: {weekly_overview['period']['start_date']} to {weekly_overview['period']['end_date']}")
            print(f"   Score: {weekly_overview['overall_score']['overall_score']:.1f}")
            
            # Show momentum
            momentum = weekly_overview['trends']['momentum']
            print(f"   Momentum: {momentum['direction']} ({momentum['percentage_change']:+.1f}%)")
        else:
            print(f"❌ Failed to get weekly overview: {response.status_code}")
        
        # Test 6: Test specific chart types
        print(f"\n📊 TEST 6: Testing specific chart types...")
        params = {"chart_types": "daily_tasks,task_priority"}
        response = requests.get(f"{BASE_URL}/analytics/charts", params=params)
        if response.status_code == 200:
            specific_charts = response.json()
            print(f"✅ Generated {len(specific_charts)} specific charts:")
            for chart in specific_charts:
                print(f"   • {chart['title']}")
        else:
            print(f"❌ Failed to get specific charts: {response.status_code}")
        
        # Test 7: Export data
        print(f"\n💾 TEST 7: Testing data export...")
        response = requests.get(f"{BASE_URL}/analytics/export")
        if response.status_code == 200:
            export_data = response.json()
            print(f"✅ Data exported successfully:")
            print(f"   Export type: {export_data['export_type']}")
            print(f"   Exported at: {export_data['exported_at']}")
            print(f"   Data size: {len(str(export_data['data']))} characters")
        else:
            print(f"❌ Failed to export data: {response.status_code}")
        
        print("\n🎉 ALL ANALYTICS TESTS COMPLETED!")
        print("Your Analytics System is working! 📊✨")
        print("\n🔥 Key Features Demonstrated:")
        print("   • Comprehensive productivity metrics")
        print("   • AI-powered pattern recognition")
        print("   • Beautiful chart data for visualizations")
        print("   • Period comparisons and trend analysis")
        print("   • Personalized insights and recommendations")
        print("   • Data export capabilities")
        print("   • Custom date range filtering")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error!")
        print("Make sure the server is running:")
        print("   1. Open another terminal")
        print("   2. cd backend")
        print("   3. python run.py")
        print("   4. Then run this test again")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def show_analytics_api_documentation():
    """Show how to explore the analytics API documentation"""
    print("\n📚 EXPLORE YOUR ANALYTICS API:")
    print("=" * 40)
    print("1. Start the server: python run.py")
    print("2. Visit: http://localhost:8000/docs")
    print("3. Look for the 'analytics' section!")
    print()
    print("Your analytics endpoints:")
    print("• GET    /api/v1/analytics/overview   - Productivity dashboard 📊")
    print("• GET    /api/v1/analytics/charts     - Chart data for visualizations")
    print("• GET    /api/v1/analytics/insights   - AI-powered insights 🧠")
    print("• GET    /api/v1/analytics/compare    - Period comparisons")
    print("• GET    /api/v1/analytics/export     - Data export")
    print()
    print("💡 Pro tip: Create some tasks and habits first, then check")
    print("   your analytics to see meaningful insights and patterns!")
    print()
    print("🎯 The analytics work best with at least:")
    print("   • 5+ tasks created and some completed")
    print("   • 2+ habits with some logged completions")
    print("   • Data spanning several days")

if __name__ == "__main__":
    test_analytics_api()
    show_analytics_api_documentation()