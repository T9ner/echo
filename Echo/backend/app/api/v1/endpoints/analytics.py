"""
Analytics API Endpoints - Your Productivity Insights Interface

These are the URLs your React frontend will call for analytics:
- GET /analytics/overview - Get comprehensive productivity overview
- GET /analytics/charts - Get chart data for visualizations
- GET /analytics/insights - Get AI-powered insights and patterns
- GET /analytics/compare - Compare productivity across periods
- GET /analytics/export - Export analytics data

Think of these as your "productivity dashboard" buttons!
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import logging

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    AnalyticsDateRange, ProductivityOverview, ChartData, ChartDataPoint,
    AnalyticsInsight, ProductivityReport, AnalyticsComparison
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router for analytics endpoints
router = APIRouter()


@router.get("/overview", response_model=ProductivityOverview)
def get_productivity_overview(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive productivity overview
    
    This is your main productivity dashboard with all key metrics,
    trends, and personalized recommendations.
    
    Args:
        start_date: Start of analysis period (default: 30 days ago)
        end_date: End of analysis period (default: today)
        db: Database session (automatically injected)
        
    Returns:
        ProductivityOverview: Complete productivity metrics and insights
        
    Example Request:
        GET /analytics/overview?start_date=2024-01-01&end_date=2024-01-31
        
    Example Response:
        {
            "period": {"start_date": "2024-01-01", "end_date": "2024-01-31", "days": 31},
            "tasks": {
                "total_tasks": 25,
                "completed_tasks": 20,
                "completion_rate": 80.0,
                "overdue_tasks": 2
            },
            "habits": {
                "total_habits": 5,
                "active_habits": 4,
                "average_streak": 12.5,
                "consistency_rate": 85.5
            },
            "overall_score": {
                "overall_score": 82.5,
                "grade": "A",
                "description": "Excellent productivity! Keep up the great work! 🔥"
            },
            "recommendations": [
                "Focus on those 2 overdue tasks to get back on track",
                "Great job maintaining your habit streaks!"
            ]
        }
    """
    try:
        logger.info(f"Getting productivity overview for period: {start_date} to {end_date}")
        
        analytics_service = AnalyticsService(db)
        overview = analytics_service.get_productivity_overview(start_date, end_date)
        
        logger.info("Successfully generated productivity overview")
        return overview
        
    except Exception as e:
        logger.error(f"Error getting productivity overview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get productivity overview: {str(e)}")


@router.get("/charts", response_model=List[ChartData])
def get_analytics_charts(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    chart_types: Optional[str] = Query(None, description="Comma-separated list of chart types"),
    db: Session = Depends(get_db)
):
    """
    Get chart data for productivity visualizations
    
    Returns data formatted for frontend charting libraries like Chart.js
    or Recharts. Perfect for creating beautiful productivity dashboards.
    
    Args:
        start_date: Start of analysis period
        end_date: End of analysis period
        chart_types: Specific charts to generate (optional)
        db: Database session
        
    Returns:
        List[ChartData]: Chart data ready for visualization
        
    Example Request:
        GET /analytics/charts?chart_types=daily_tasks,habit_streaks
        
    Example Response:
        [
            {
                "title": "Daily Task Completions",
                "chart_type": "line",
                "data_points": [
                    {"label": "2024-01-01", "value": 3},
                    {"label": "2024-01-02", "value": 5}
                ],
                "x_axis_label": "Date",
                "y_axis_label": "Tasks Completed"
            },
            {
                "title": "Habit Completion Rate",
                "chart_type": "bar",
                "data_points": [
                    {"label": "Exercise", "value": 85.5},
                    {"label": "Reading", "value": 72.3}
                ]
            }
        ]
    """
    try:
        logger.info(f"Generating analytics charts for period: {start_date} to {end_date}")
        
        analytics_service = AnalyticsService(db)
        overview = analytics_service.get_productivity_overview(start_date, end_date)
        
        # Generate chart data from overview
        charts = []
        
        # Daily task completion chart
        if not chart_types or "daily_tasks" in chart_types:
            daily_task_data = [
                ChartDataPoint(
                    label=day["date"],
                    value=day["tasks_completed"],
                    metadata={"day_of_week": day["day_of_week"]}
                )
                for day in overview["tasks"]["productivity_by_day"]
            ]
            
            charts.append(ChartData(
                title="Daily Task Completions",
                chart_type="line",
                data_points=daily_task_data,
                x_axis_label="Date",
                y_axis_label="Tasks Completed",
                colors=["#3B82F6"]
            ))
        
        # Daily habit completion chart
        if not chart_types or "daily_habits" in chart_types:
            daily_habit_data = [
                ChartDataPoint(
                    label=day["date"],
                    value=day["total_completions"],
                    metadata={"unique_habits": day["unique_habits_completed"]}
                )
                for day in overview["habits"]["completion_by_day"]
            ]
            
            charts.append(ChartData(
                title="Daily Habit Completions",
                chart_type="line",
                data_points=daily_habit_data,
                x_axis_label="Date",
                y_axis_label="Habit Completions",
                colors=["#10B981"]
            ))
        
        # Task completion by priority
        if not chart_types or "task_priority" in chart_types:
            priority_data = [
                ChartDataPoint(
                    label=priority.title(),
                    value=metrics["completion_rate"],
                    metadata={"total": metrics["total"], "completed": metrics["completed"]}
                )
                for priority, metrics in overview["tasks"]["by_priority"].items()
            ]
            
            charts.append(ChartData(
                title="Task Completion Rate by Priority",
                chart_type="bar",
                data_points=priority_data,
                x_axis_label="Priority",
                y_axis_label="Completion Rate (%)",
                colors=["#EF4444", "#F59E0B", "#10B981", "#8B5CF6"]
            ))
        
        # Weekly productivity trends
        if not chart_types or "weekly_trends" in chart_types:
            weekly_data = [
                ChartDataPoint(
                    label=f"Week of {week['week_start']}",
                    value=week["productivity_score"],
                    metadata={
                        "tasks_completed": week["tasks_completed"],
                        "habit_completions": week["habit_completions"]
                    }
                )
                for week in overview["trends"]["weekly_trends"]
            ]
            
            charts.append(ChartData(
                title="Weekly Productivity Trends",
                chart_type="line",
                data_points=weekly_data,
                x_axis_label="Week",
                y_axis_label="Productivity Score",
                colors=["#8B5CF6"]
            ))
        
        # Day of week patterns
        if not chart_types or "day_patterns" in chart_types:
            day_pattern_data = [
                ChartDataPoint(
                    label=day.title(),
                    value=metrics["productivity_score"],
                    metadata={
                        "tasks_completed": metrics["tasks_completed"],
                        "habit_completions": metrics["habit_completions"]
                    }
                )
                for day, metrics in overview["trends"]["day_of_week_patterns"].items()
            ]
            
            charts.append(ChartData(
                title="Productivity by Day of Week",
                chart_type="radar",
                data_points=day_pattern_data,
                x_axis_label="Day of Week",
                y_axis_label="Productivity Score",
                colors=["#F59E0B"]
            ))
        
        logger.info(f"Generated {len(charts)} charts")
        return charts
        
    except Exception as e:
        logger.error(f"Error generating analytics charts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate charts: {str(e)}")


@router.get("/insights", response_model=List[AnalyticsInsight])
def get_productivity_insights(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered productivity insights and patterns
    
    Analyzes your productivity data to discover patterns, trends,
    and actionable insights for improvement.
    
    Args:
        start_date: Start of analysis period
        end_date: End of analysis period
        db: Database session
        
    Returns:
        List[AnalyticsInsight]: Discovered insights and patterns
        
    Example Response:
        [
            {
                "title": "Strong Monday Productivity",
                "description": "You complete 40% more tasks on Mondays compared to other days",
                "insight_type": "pattern",
                "confidence": 0.85,
                "action_items": [
                    "Schedule important tasks for Mondays",
                    "Use Monday momentum to tackle difficult tasks"
                ]
            },
            {
                "title": "Declining Habit Consistency",
                "description": "Your habit completion rate has dropped 15% in the last two weeks",
                "insight_type": "trend",
                "confidence": 0.92,
                "action_items": [
                    "Review your habit schedule",
                    "Consider reducing habit complexity"
                ]
            }
        ]
    """
    try:
        logger.info(f"Generating productivity insights for period: {start_date} to {end_date}")
        
        analytics_service = AnalyticsService(db)
        overview = analytics_service.get_productivity_overview(start_date, end_date)
        
        insights = []
        
        # Analyze day-of-week patterns
        day_patterns = overview["trends"]["day_of_week_patterns"]
        if day_patterns:
            best_day = max(day_patterns.items(), key=lambda x: x[1]["productivity_score"])
            worst_day = min(day_patterns.items(), key=lambda x: x[1]["productivity_score"])
            
            if best_day[1]["productivity_score"] > worst_day[1]["productivity_score"] * 1.3:
                insights.append(AnalyticsInsight(
                    title=f"Strong {best_day[0].title()} Productivity",
                    description=f"You're most productive on {best_day[0].title()}s with {best_day[1]['productivity_score']:.1f} productivity score",
                    insight_type="pattern",
                    confidence=0.85,
                    action_items=[
                        f"Schedule important tasks for {best_day[0].title()}s",
                        f"Use {best_day[0].title()} momentum to tackle difficult tasks"
                    ]
                ))
        
        # Analyze momentum trends
        momentum = overview["trends"]["momentum"]
        if momentum["direction"] == "improving" and momentum["percentage_change"] > 10:
            insights.append(AnalyticsInsight(
                title="Improving Productivity Trend",
                description=f"Your productivity has improved by {momentum['percentage_change']:.1f}% recently",
                insight_type="trend",
                confidence=0.90,
                action_items=[
                    "Keep doing what you're doing!",
                    "Document what's working well",
                    "Consider scaling successful strategies"
                ]
            ))
        elif momentum["direction"] == "declining" and momentum["percentage_change"] < -10:
            insights.append(AnalyticsInsight(
                title="Declining Productivity Trend",
                description=f"Your productivity has declined by {abs(momentum['percentage_change']):.1f}% recently",
                insight_type="trend",
                confidence=0.88,
                action_items=[
                    "Review recent changes in routine",
                    "Consider reducing task complexity",
                    "Focus on maintaining existing habits"
                ]
            ))
        
        # Analyze task completion patterns
        task_metrics = overview["tasks"]
        if task_metrics["completion_rate"] > 85:
            insights.append(AnalyticsInsight(
                title="Excellent Task Completion",
                description=f"You have a {task_metrics['completion_rate']:.1f}% task completion rate - excellent work!",
                insight_type="achievement",
                confidence=0.95,
                action_items=[
                    "Maintain your current task management approach",
                    "Consider taking on more challenging tasks",
                    "Share your strategies with others"
                ]
            ))
        elif task_metrics["overdue_tasks"] > 0:
            insights.append(AnalyticsInsight(
                title="Overdue Task Alert",
                description=f"You have {task_metrics['overdue_tasks']} overdue tasks that need attention",
                insight_type="alert",
                confidence=1.0,
                action_items=[
                    "Prioritize overdue tasks immediately",
                    "Break large tasks into smaller chunks",
                    "Set realistic deadlines for future tasks"
                ]
            ))
        
        # Analyze habit patterns
        habit_metrics = overview["habits"]
        if habit_metrics["consistency_rate"] > 80:
            insights.append(AnalyticsInsight(
                title="Strong Habit Consistency",
                description=f"You maintain habits {habit_metrics['consistency_rate']:.1f}% of days - great consistency!",
                insight_type="achievement",
                confidence=0.92,
                action_items=[
                    "Consider adding one new habit",
                    "Focus on extending your longest streaks",
                    "Celebrate your consistency wins"
                ]
            ))
        elif habit_metrics["active_habits"] == 0:
            insights.append(AnalyticsInsight(
                title="No Active Habits",
                description="You don't have any active habit streaks - habits are key to long-term success",
                insight_type="opportunity",
                confidence=0.95,
                action_items=[
                    "Start with one small, easy habit",
                    "Choose something you can do in 2 minutes",
                    "Focus on consistency over perfection"
                ]
            ))
        
        # Overall productivity insight
        overall_score = overview["overall_score"]["overall_score"]
        if overall_score >= 80:
            insights.append(AnalyticsInsight(
                title="High Productivity Performance",
                description=f"Your overall productivity score is {overall_score:.1f} - you're in the top tier!",
                insight_type="achievement",
                confidence=0.98,
                action_items=[
                    "Keep up the excellent work",
                    "Consider mentoring others",
                    "Document your successful strategies"
                ]
            ))
        
        logger.info(f"Generated {len(insights)} productivity insights")
        return insights
        
    except Exception as e:
        logger.error(f"Error generating productivity insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.get("/compare")
def compare_productivity_periods(
    current_start: date = Query(..., description="Start date of current period"),
    current_end: date = Query(..., description="End date of current period"),
    previous_start: Optional[date] = Query(None, description="Start date of previous period"),
    previous_end: Optional[date] = Query(None, description="End date of previous period"),
    db: Session = Depends(get_db)
):
    """
    Compare productivity across different time periods
    
    Great for tracking progress and seeing how your productivity
    has changed over time.
    
    Args:
        current_start: Start of current period
        current_end: End of current period
        previous_start: Start of previous period (auto-calculated if not provided)
        previous_end: End of previous period (auto-calculated if not provided)
        db: Database session
        
    Returns:
        Comparison data between the two periods
        
    Example Request:
        GET /analytics/compare?current_start=2024-02-01&current_end=2024-02-29&previous_start=2024-01-01&previous_end=2024-01-31
    """
    try:
        # Auto-calculate previous period if not provided
        if not previous_start or not previous_end:
            period_length = (current_end - current_start).days + 1
            previous_end = current_start - timedelta(days=1)
            previous_start = previous_end - timedelta(days=period_length - 1)
        
        logger.info(f"Comparing periods: {previous_start}-{previous_end} vs {current_start}-{current_end}")
        
        analytics_service = AnalyticsService(db)
        
        # Get analytics for both periods
        current_overview = analytics_service.get_productivity_overview(current_start, current_end)
        previous_overview = analytics_service.get_productivity_overview(previous_start, previous_end)
        
        # Calculate changes
        changes = {
            "task_completion_rate_change": current_overview["tasks"]["completion_rate"] - previous_overview["tasks"]["completion_rate"],
            "habit_consistency_change": current_overview["habits"]["consistency_rate"] - previous_overview["habits"]["consistency_rate"],
            "overall_score_change": current_overview["overall_score"]["overall_score"] - previous_overview["overall_score"]["overall_score"],
            "tasks_completed_change": current_overview["tasks"]["completed_tasks"] - previous_overview["tasks"]["completed_tasks"],
            "habit_completions_change": current_overview["habits"]["total_completions"] - previous_overview["habits"]["total_completions"]
        }
        
        # Identify improvement and decline areas
        improvement_areas = []
        decline_areas = []
        
        if changes["task_completion_rate_change"] > 5:
            improvement_areas.append(f"Task completion rate improved by {changes['task_completion_rate_change']:.1f}%")
        elif changes["task_completion_rate_change"] < -5:
            decline_areas.append(f"Task completion rate declined by {abs(changes['task_completion_rate_change']):.1f}%")
        
        if changes["habit_consistency_change"] > 5:
            improvement_areas.append(f"Habit consistency improved by {changes['habit_consistency_change']:.1f}%")
        elif changes["habit_consistency_change"] < -5:
            decline_areas.append(f"Habit consistency declined by {abs(changes['habit_consistency_change']):.1f}%")
        
        if changes["overall_score_change"] > 5:
            improvement_areas.append(f"Overall productivity score improved by {changes['overall_score_change']:.1f} points")
        elif changes["overall_score_change"] < -5:
            decline_areas.append(f"Overall productivity score declined by {abs(changes['overall_score_change']):.1f} points")
        
        comparison = {
            "current_period": current_overview,
            "previous_period": previous_overview,
            "changes": changes,
            "improvement_areas": improvement_areas,
            "decline_areas": decline_areas
        }
        
        logger.info("Successfully generated productivity comparison")
        return comparison
        
    except Exception as e:
        logger.error(f"Error comparing productivity periods: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compare periods: {str(e)}")


@router.get("/productivity")
def get_productivity_analytics(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get productivity analytics (alias for /overview)
    """
    return get_productivity_overview(start_date, end_date, db)


@router.get("/habits")
def get_habits_analytics(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get habits-focused analytics
    """
    try:
        analytics_service = AnalyticsService(db)
        overview = analytics_service.get_productivity_overview(start_date, end_date)
        
        # Return only habits-related data
        return {
            "period": overview["period"],
            "habits": overview["habits"],
            "overall_score": overview["overall_score"],
            "recommendations": [r for r in overview["recommendations"] if "habit" in r.lower()]
        }
        
    except Exception as e:
        logger.error(f"Error getting habits analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get habits analytics: {str(e)}")


@router.get("/export")
def export_analytics_data(
    start_date: Optional[date] = Query(None, description="Start date for export"),
    end_date: Optional[date] = Query(None, description="End date for export"),
    format: str = Query("json", description="Export format (json, csv)"),
    db: Session = Depends(get_db)
):
    """
    Export analytics data for external analysis
    
    Useful for creating custom reports or importing into other tools.
    
    Args:
        start_date: Start of export period
        end_date: End of export period
        format: Export format (json or csv)
        db: Database session
        
    Returns:
        Exported analytics data
    """
    try:
        logger.info(f"Exporting analytics data for period: {start_date} to {end_date}")
        
        analytics_service = AnalyticsService(db)
        overview = analytics_service.get_productivity_overview(start_date, end_date)
        
        if format.lower() == "json":
            return {
                "export_type": "productivity_analytics",
                "exported_at": datetime.now().isoformat(),
                "data": overview
            }
        else:
            # For now, return JSON format regardless
            # CSV export could be implemented later
            return {
                "export_type": "productivity_analytics",
                "exported_at": datetime.now().isoformat(),
                "format": "json",
                "data": overview,
                "note": "CSV export coming soon!"
            }
        
    except Exception as e:
        logger.error(f"Error exporting analytics data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")


# Summary of all analytics endpoints:
"""
GET    /analytics/overview     - Get comprehensive productivity overview
GET    /analytics/charts       - Get chart data for visualizations
GET    /analytics/insights     - Get AI-powered insights and patterns
GET    /analytics/compare      - Compare productivity across periods
GET    /analytics/export       - Export analytics data

These endpoints provide complete productivity analytics and insights!
"""