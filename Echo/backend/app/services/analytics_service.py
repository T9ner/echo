"""
Analytics Service - Productivity Insights Engine

This is the intelligence that turns your raw data into actionable insights:
1. Calculates productivity metrics and trends
2. Recognizes patterns in your behavior
3. Generates recommendations for improvement
4. Provides data for beautiful dashboards

Think of this as your personal productivity analyst!
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, case
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, timedelta
from collections import defaultdict
import statistics

from app.models.task import Task
from app.models.habit import Habit, HabitLog
from app.models.enums import TaskStatus, TaskPriority, HabitFrequency


class AnalyticsService:
    """
    Analytics Service - Your personal productivity analyst
    
    This service analyzes your productivity data to provide:
    - Performance metrics and trends
    - Pattern recognition and insights
    - Personalized recommendations
    - Dashboard-ready data visualizations
    """
    
    def __init__(self, db: Session):
        """
        Initialize the analytics service
        
        Args:
            db: Database session for running analytics queries
        """
        self.db = db
    
    def get_productivity_overview(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get a comprehensive productivity overview
        
        This is your productivity dashboard summary with key metrics.
        
        Args:
            start_date: Start of analysis period (default: 30 days ago)
            end_date: End of analysis period (default: today)
            
        Returns:
            Dictionary with comprehensive productivity metrics
            
        Example:
            overview = analytics.get_productivity_overview()
            print(f"Completion rate: {overview['task_completion_rate']}%")
            print(f"Active habits: {overview['active_habits_count']}")
        """
        # Set default date range (last 30 days)
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get task metrics
        task_metrics = self._get_task_metrics(start_date, end_date)
        
        # Get habit metrics
        habit_metrics = self._get_habit_metrics(start_date, end_date)
        
        # Get productivity trends
        trends = self._get_productivity_trends(start_date, end_date)
        
        # Get recommendations
        recommendations = self._generate_recommendations(task_metrics, habit_metrics)
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "tasks": task_metrics,
            "habits": habit_metrics,
            "trends": trends,
            "recommendations": recommendations,
            "overall_score": self._calculate_productivity_score(task_metrics, habit_metrics)
        }
    
    def _get_task_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Calculate comprehensive task metrics
        
        Args:
            start_date: Start of analysis period
            end_date: End of analysis period
            
        Returns:
            Dictionary with task analytics
        """
        # Get all tasks in the period
        tasks_query = self.db.query(Task).filter(
            Task.created_at >= datetime.combine(start_date, datetime.min.time()),
            Task.created_at <= datetime.combine(end_date, datetime.max.time())
        )
        
        all_tasks = tasks_query.all()
        
        if not all_tasks:
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "completion_rate": 0.0,
                "overdue_tasks": 0,
                "by_priority": {},
                "by_status": {},
                "average_completion_time": None,
                "productivity_by_day": []
            }
        
        # Basic counts
        total_tasks = len(all_tasks)
        completed_tasks = len([t for t in all_tasks if t.status == TaskStatus.COMPLETED])
        overdue_tasks = len([
            t for t in all_tasks 
            if t.due_date and t.due_date.replace(tzinfo=None) < datetime.now() and t.status != TaskStatus.COMPLETED
        ])
        
        # Completion rate
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
        
        # Tasks by priority
        by_priority = {}
        for priority in TaskPriority:
            priority_tasks = [t for t in all_tasks if t.priority == priority]
            priority_completed = [t for t in priority_tasks if t.status == TaskStatus.COMPLETED]
            by_priority[priority.value] = {
                "total": len(priority_tasks),
                "completed": len(priority_completed),
                "completion_rate": (len(priority_completed) / len(priority_tasks) * 100) if priority_tasks else 0.0
            }
        
        # Tasks by status
        by_status = {}
        for status in TaskStatus:
            count = len([t for t in all_tasks if t.status == status])
            by_status[status.value] = count
        
        # Average completion time (for completed tasks)
        completed_with_times = [
            t for t in all_tasks 
            if t.status == TaskStatus.COMPLETED and t.completed_at and t.created_at
        ]
        
        average_completion_time = None
        if completed_with_times:
            completion_times = [
                (t.completed_at - t.created_at).total_seconds() / 3600  # Hours
                for t in completed_with_times
            ]
            average_completion_time = statistics.mean(completion_times)
        
        # Productivity by day (tasks completed each day)
        productivity_by_day = self._get_daily_task_productivity(start_date, end_date)
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": round(completion_rate, 2),
            "overdue_tasks": overdue_tasks,
            "by_priority": by_priority,
            "by_status": by_status,
            "average_completion_time_hours": round(average_completion_time, 2) if average_completion_time else None,
            "productivity_by_day": productivity_by_day
        }
    
    def _get_habit_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Calculate comprehensive habit metrics
        
        Args:
            start_date: Start of analysis period
            end_date: End of analysis period
            
        Returns:
            Dictionary with habit analytics
        """
        # Get all habits
        all_habits = self.db.query(Habit).all()
        
        if not all_habits:
            return {
                "total_habits": 0,
                "active_habits": 0,
                "total_completions": 0,
                "average_streak": 0.0,
                "best_streak": 0,
                "consistency_rate": 0.0,
                "by_frequency": {},
                "habit_details": [],
                "completion_by_day": []
            }
        
        # Get habit logs in the period
        habit_logs = self.db.query(HabitLog).filter(
            HabitLog.completed_date >= start_date,
            HabitLog.completed_date <= end_date
        ).all()
        
        # Basic metrics
        total_habits = len(all_habits)
        active_habits = len([h for h in all_habits if h.current_streak > 0])
        total_completions = sum(log.count for log in habit_logs)
        
        # Streak metrics
        current_streaks = [h.current_streak for h in all_habits]
        average_streak = statistics.mean(current_streaks) if current_streaks else 0.0
        best_streak = max([h.longest_streak for h in all_habits]) if all_habits else 0
        
        # Consistency rate (percentage of days with at least one habit completion)
        period_days = (end_date - start_date).days + 1
        days_with_completions = len(set(log.completed_date for log in habit_logs))
        consistency_rate = (days_with_completions / period_days * 100) if period_days > 0 else 0.0
        
        # Habits by frequency
        by_frequency = {}
        for frequency in HabitFrequency:
            freq_habits = [h for h in all_habits if h.frequency == frequency]
            by_frequency[frequency.value] = {
                "count": len(freq_habits),
                "average_streak": statistics.mean([h.current_streak for h in freq_habits]) if freq_habits else 0.0
            }
        
        # Individual habit details
        habit_details = []
        for habit in all_habits:
            habit_logs_count = len([log for log in habit_logs if log.habit_id == habit.id])
            habit_details.append({
                "id": habit.id,
                "name": habit.name,
                "frequency": habit.frequency.value,
                "current_streak": habit.current_streak,
                "longest_streak": habit.longest_streak,
                "completions_in_period": habit_logs_count
            })
        
        # Habit completions by day
        completion_by_day = self._get_daily_habit_completions(start_date, end_date)
        
        return {
            "total_habits": total_habits,
            "active_habits": active_habits,
            "total_completions": total_completions,
            "average_streak": round(average_streak, 2),
            "best_streak": best_streak,
            "consistency_rate": round(consistency_rate, 2),
            "by_frequency": by_frequency,
            "habit_details": habit_details,
            "completion_by_day": completion_by_day
        }
    
    def _get_productivity_trends(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Analyze productivity trends and patterns
        
        Args:
            start_date: Start of analysis period
            end_date: End of analysis period
            
        Returns:
            Dictionary with trend analysis
        """
        # Get weekly productivity trends
        weekly_trends = self._get_weekly_trends(start_date, end_date)
        
        # Get day-of-week patterns
        day_patterns = self._get_day_of_week_patterns(start_date, end_date)
        
        # Get productivity momentum (improving/declining)
        momentum = self._calculate_productivity_momentum(start_date, end_date)
        
        return {
            "weekly_trends": weekly_trends,
            "day_of_week_patterns": day_patterns,
            "momentum": momentum
        }
    
    def _get_daily_task_productivity(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily task completion data"""
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # Count tasks completed on this day
            completed_count = self.db.query(Task).filter(
                func.date(Task.completed_at) == current_date,
                Task.status == TaskStatus.COMPLETED
            ).count()
            
            # Count tasks created on this day
            created_count = self.db.query(Task).filter(
                func.date(Task.created_at) == current_date
            ).count()
            
            daily_data.append({
                "date": current_date.isoformat(),
                "tasks_completed": completed_count,
                "tasks_created": created_count,
                "day_of_week": current_date.strftime("%A")
            })
            
            current_date += timedelta(days=1)
        
        return daily_data
    
    def _get_daily_habit_completions(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily habit completion data"""
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # Count habit completions on this day
            completions = self.db.query(func.sum(HabitLog.count)).filter(
                HabitLog.completed_date == current_date
            ).scalar() or 0
            
            # Count unique habits completed
            unique_habits = self.db.query(func.count(func.distinct(HabitLog.habit_id))).filter(
                HabitLog.completed_date == current_date
            ).scalar() or 0
            
            daily_data.append({
                "date": current_date.isoformat(),
                "total_completions": completions,
                "unique_habits_completed": unique_habits,
                "day_of_week": current_date.strftime("%A")
            })
            
            current_date += timedelta(days=1)
        
        return daily_data
    
    def _get_weekly_trends(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Analyze weekly productivity trends"""
        weekly_data = []
        current_week_start = start_date - timedelta(days=start_date.weekday())  # Start of week (Monday)
        
        while current_week_start <= end_date:
            week_end = min(current_week_start + timedelta(days=6), end_date)
            
            # Tasks completed this week
            tasks_completed = self.db.query(Task).filter(
                func.date(Task.completed_at) >= current_week_start,
                func.date(Task.completed_at) <= week_end,
                Task.status == TaskStatus.COMPLETED
            ).count()
            
            # Habit completions this week
            habit_completions = self.db.query(func.sum(HabitLog.count)).filter(
                HabitLog.completed_date >= current_week_start,
                HabitLog.completed_date <= week_end
            ).scalar() or 0
            
            weekly_data.append({
                "week_start": current_week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "tasks_completed": tasks_completed,
                "habit_completions": habit_completions,
                "productivity_score": tasks_completed + (habit_completions * 0.5)  # Weighted score
            })
            
            current_week_start += timedelta(days=7)
        
        return weekly_data
    
    def _get_day_of_week_patterns(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Analyze productivity patterns by day of week"""
        day_patterns = {}
        
        for day_num in range(7):  # 0 = Monday, 6 = Sunday
            day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][day_num]
            
            # Tasks completed on this day of week
            tasks_completed = self.db.query(Task).filter(
                extract('dow', Task.completed_at) == (day_num + 1) % 7,  # PostgreSQL: 0=Sunday
                func.date(Task.completed_at) >= start_date,
                func.date(Task.completed_at) <= end_date,
                Task.status == TaskStatus.COMPLETED
            ).count()
            
            # Habit completions on this day of week
            habit_completions = self.db.query(func.sum(HabitLog.count)).filter(
                extract('dow', HabitLog.completed_date) == (day_num + 1) % 7,
                HabitLog.completed_date >= start_date,
                HabitLog.completed_date <= end_date
            ).scalar() or 0
            
            day_patterns[day_name.lower()] = {
                "tasks_completed": tasks_completed,
                "habit_completions": habit_completions,
                "productivity_score": tasks_completed + (habit_completions * 0.5)
            }
        
        return day_patterns
    
    def _calculate_productivity_momentum(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate if productivity is improving or declining"""
        period_days = (end_date - start_date).days + 1
        mid_point = start_date + timedelta(days=period_days // 2)
        
        # First half productivity
        first_half_tasks = self.db.query(Task).filter(
            func.date(Task.completed_at) >= start_date,
            func.date(Task.completed_at) < mid_point,
            Task.status == TaskStatus.COMPLETED
        ).count()
        
        first_half_habits = self.db.query(func.sum(HabitLog.count)).filter(
            HabitLog.completed_date >= start_date,
            HabitLog.completed_date < mid_point
        ).scalar() or 0
        
        # Second half productivity
        second_half_tasks = self.db.query(Task).filter(
            func.date(Task.completed_at) >= mid_point,
            func.date(Task.completed_at) <= end_date,
            Task.status == TaskStatus.COMPLETED
        ).count()
        
        second_half_habits = self.db.query(func.sum(HabitLog.count)).filter(
            HabitLog.completed_date >= mid_point,
            HabitLog.completed_date <= end_date
        ).scalar() or 0
        
        # Calculate momentum
        first_half_score = first_half_tasks + (first_half_habits * 0.5)
        second_half_score = second_half_tasks + (second_half_habits * 0.5)
        
        if first_half_score == 0:
            momentum_direction = "improving" if second_half_score > 0 else "stable"
            momentum_percentage = 0.0
        else:
            momentum_percentage = ((second_half_score - first_half_score) / first_half_score) * 100
            momentum_direction = "improving" if momentum_percentage > 5 else "declining" if momentum_percentage < -5 else "stable"
        
        return {
            "direction": momentum_direction,
            "percentage_change": round(momentum_percentage, 2),
            "first_half_score": first_half_score,
            "second_half_score": second_half_score
        }
    
    def _calculate_productivity_score(self, task_metrics: Dict, habit_metrics: Dict) -> Dict[str, Any]:
        """Calculate an overall productivity score"""
        # Task score (0-50 points)
        task_score = min(task_metrics["completion_rate"] * 0.5, 50)
        
        # Habit score (0-50 points)
        habit_score = min(habit_metrics["consistency_rate"] * 0.5, 50)
        
        # Overall score (0-100)
        overall_score = task_score + habit_score
        
        # Determine grade
        if overall_score >= 90:
            grade = "A+"
        elif overall_score >= 80:
            grade = "A"
        elif overall_score >= 70:
            grade = "B"
        elif overall_score >= 60:
            grade = "C"
        else:
            grade = "D"
        
        return {
            "overall_score": round(overall_score, 1),
            "task_score": round(task_score, 1),
            "habit_score": round(habit_score, 1),
            "grade": grade,
            "description": self._get_score_description(overall_score)
        }
    
    def _get_score_description(self, score: float) -> str:
        """Get a description for the productivity score"""
        if score >= 90:
            return "Outstanding productivity! You're crushing your goals! 🌟"
        elif score >= 80:
            return "Excellent productivity! Keep up the great work! 🔥"
        elif score >= 70:
            return "Good productivity! You're on the right track! 👍"
        elif score >= 60:
            return "Fair productivity. There's room for improvement! 💪"
        else:
            return "Let's work on building better productivity habits! 🚀"
    
    def _generate_recommendations(self, task_metrics: Dict, habit_metrics: Dict) -> List[str]:
        """Generate personalized productivity recommendations"""
        recommendations = []
        
        # Task-based recommendations
        if task_metrics["completion_rate"] < 70:
            recommendations.append("Focus on completing existing tasks before creating new ones")
        
        if task_metrics["overdue_tasks"] > 0:
            recommendations.append(f"You have {task_metrics['overdue_tasks']} overdue tasks - prioritize these first")
        
        # Check priority completion rates
        high_priority_rate = task_metrics["by_priority"].get("high", {}).get("completion_rate", 0)
        if high_priority_rate < 80:
            recommendations.append("Focus more on high-priority tasks for better productivity")
        
        # Habit-based recommendations
        if habit_metrics["active_habits"] == 0:
            recommendations.append("Start building habits! Even one small daily habit can make a big difference")
        elif habit_metrics["consistency_rate"] < 50:
            recommendations.append("Try to be more consistent with your habits - small daily actions compound over time")
        
        if habit_metrics["average_streak"] < 7:
            recommendations.append("Focus on building longer habit streaks - aim for at least 7 days in a row")
        
        # General recommendations
        if not recommendations:
            recommendations.append("You're doing great! Keep maintaining your excellent productivity habits")
        
        return recommendations[:5]  # Limit to top 5 recommendations


# Example usage:
"""
# Create analytics service
analytics = AnalyticsService(db)

# Get productivity overview
overview = analytics.get_productivity_overview()
print(f"Overall score: {overview['overall_score']['overall_score']}")
print(f"Recommendations: {overview['recommendations']}")

# Get specific date range
start = date(2024, 1, 1)
end = date(2024, 1, 31)
january_analytics = analytics.get_productivity_overview(start, end)
"""