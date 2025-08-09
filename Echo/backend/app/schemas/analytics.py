"""
Analytics Pydantic Schemas - Data Validation for Productivity Insights

These schemas define:
1. How to request analytics data with date ranges
2. How analytics responses are structured
3. Chart data formats for visualizations
4. Productivity metrics and recommendations

Think of these as the data contracts for your productivity insights!
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import date


class AnalyticsDateRange(BaseModel):
    """
    Schema for specifying analytics date ranges
    
    Used to filter analytics data to specific time periods
    """
    start_date: Optional[date] = Field(None, description="Start date for analytics (default: 30 days ago)")
    end_date: Optional[date] = Field(None, description="End date for analytics (default: today)")


class ProductivityScore(BaseModel):
    """
    Schema for productivity scoring system
    
    Provides an overall assessment of productivity performance
    """
    overall_score: float = Field(..., ge=0, le=100, description="Overall productivity score (0-100)")
    task_score: float = Field(..., ge=0, le=50, description="Task completion score (0-50)")
    habit_score: float = Field(..., ge=0, le=50, description="Habit consistency score (0-50)")
    grade: str = Field(..., description="Letter grade (A+, A, B, C, D)")
    description: str = Field(..., description="Human-readable score description")


class TaskMetrics(BaseModel):
    """
    Schema for task-related analytics
    
    Comprehensive metrics about task performance
    """
    total_tasks: int = Field(..., description="Total number of tasks")
    completed_tasks: int = Field(..., description="Number of completed tasks")
    completion_rate: float = Field(..., description="Task completion percentage")
    overdue_tasks: int = Field(..., description="Number of overdue tasks")
    by_priority: Dict[str, Dict[str, Any]] = Field(..., description="Metrics grouped by priority")
    by_status: Dict[str, int] = Field(..., description="Task counts by status")
    average_completion_time_hours: Optional[float] = Field(None, description="Average time to complete tasks")
    productivity_by_day: List[Dict[str, Any]] = Field(..., description="Daily productivity data")


class HabitMetrics(BaseModel):
    """
    Schema for habit-related analytics
    
    Comprehensive metrics about habit performance
    """
    total_habits: int = Field(..., description="Total number of habits")
    active_habits: int = Field(..., description="Number of habits with current streaks")
    total_completions: int = Field(..., description="Total habit completions in period")
    average_streak: float = Field(..., description="Average current streak length")
    best_streak: int = Field(..., description="Longest current streak")
    consistency_rate: float = Field(..., description="Percentage of days with habit completions")
    by_frequency: Dict[str, Dict[str, Any]] = Field(..., description="Metrics grouped by frequency")
    habit_details: List[Dict[str, Any]] = Field(..., description="Individual habit performance")
    completion_by_day: List[Dict[str, Any]] = Field(..., description="Daily habit completion data")


class ProductivityTrends(BaseModel):
    """
    Schema for productivity trend analysis
    
    Identifies patterns and trends in productivity data
    """
    weekly_trends: List[Dict[str, Any]] = Field(..., description="Week-by-week productivity trends")
    day_of_week_patterns: Dict[str, Any] = Field(..., description="Productivity patterns by day of week")
    momentum: Dict[str, Any] = Field(..., description="Whether productivity is improving or declining")


class ProductivityOverview(BaseModel):
    """
    Schema for comprehensive productivity overview
    
    The main analytics response with all key metrics
    """
    period: Dict[str, Any] = Field(..., description="Analysis period information")
    tasks: TaskMetrics = Field(..., description="Task-related metrics")
    habits: HabitMetrics = Field(..., description="Habit-related metrics")
    trends: ProductivityTrends = Field(..., description="Trend analysis")
    recommendations: List[str] = Field(..., description="Personalized productivity recommendations")
    overall_score: ProductivityScore = Field(..., description="Overall productivity assessment")


class ChartDataPoint(BaseModel):
    """
    Schema for individual chart data points
    
    Used for creating visualizations and graphs
    """
    label: str = Field(..., description="Data point label (e.g., date, category)")
    value: float = Field(..., description="Numeric value for the data point")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional data for the point")


class ChartData(BaseModel):
    """
    Schema for chart/visualization data
    
    Structured data ready for frontend charting libraries
    """
    title: str = Field(..., description="Chart title")
    chart_type: str = Field(..., description="Type of chart (line, bar, pie, etc.)")
    data_points: List[ChartDataPoint] = Field(..., description="Chart data points")
    x_axis_label: Optional[str] = Field(None, description="X-axis label")
    y_axis_label: Optional[str] = Field(None, description="Y-axis label")
    colors: Optional[List[str]] = Field(None, description="Color scheme for the chart")


class AnalyticsInsight(BaseModel):
    """
    Schema for individual analytics insights
    
    Represents a single insight or pattern discovered in the data
    """
    title: str = Field(..., description="Insight title")
    description: str = Field(..., description="Detailed insight description")
    insight_type: str = Field(..., description="Type of insight (trend, pattern, recommendation)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level in the insight (0-1)")
    action_items: List[str] = Field(default=[], description="Suggested actions based on this insight")


class ProductivityReport(BaseModel):
    """
    Schema for comprehensive productivity reports
    
    Detailed report with insights, charts, and recommendations
    """
    overview: ProductivityOverview = Field(..., description="Overall productivity metrics")
    charts: List[ChartData] = Field(..., description="Visualization data")
    insights: List[AnalyticsInsight] = Field(..., description="Key insights and patterns")
    generated_at: str = Field(..., description="When the report was generated")


class AnalyticsComparison(BaseModel):
    """
    Schema for comparing productivity across different periods
    
    Useful for showing progress over time
    """
    current_period: ProductivityOverview = Field(..., description="Current period metrics")
    previous_period: ProductivityOverview = Field(..., description="Previous period metrics")
    changes: Dict[str, Any] = Field(..., description="Changes between periods")
    improvement_areas: List[str] = Field(..., description="Areas showing improvement")
    decline_areas: List[str] = Field(..., description="Areas showing decline")


# Example usage of these schemas:
"""
Analytics request with date range:
GET /analytics/overview?start_date=2024-01-01&end_date=2024-01-31

Analytics response:
{
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "days": 31
    },
    "tasks": {
        "total_tasks": 25,
        "completed_tasks": 20,
        "completion_rate": 80.0,
        "overdue_tasks": 2,
        "by_priority": {
            "high": {"total": 8, "completed": 7, "completion_rate": 87.5},
            "medium": {"total": 12, "completed": 10, "completion_rate": 83.3},
            "low": {"total": 5, "completed": 3, "completion_rate": 60.0}
        }
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

Chart data for frontend:
{
    "title": "Daily Task Completions",
    "chart_type": "line",
    "data_points": [
        {"label": "2024-01-01", "value": 3},
        {"label": "2024-01-02", "value": 5},
        {"label": "2024-01-03", "value": 2}
    ],
    "x_axis_label": "Date",
    "y_axis_label": "Tasks Completed"
}
"""