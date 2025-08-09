import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, isToday } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Calendar, Flame } from "lucide-react";
import { Habit, HabitAnalytics as HabitAnalyticsType } from "@/types";

interface HabitAnalyticsProps {
  habit: Habit;
  analytics?: HabitAnalyticsType;
  isLoading?: boolean;
}

export function HabitAnalytics({
  habit,
  analytics,
  isLoading,
}: HabitAnalyticsProps) {
  // Generate mock data for demonstration (in real app, this would come from analytics prop)
  const mockAnalyticsData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 29); // Last 30 days
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day, index) => {
      // Simulate some completion pattern
      const completed = Math.random() > 0.3; // 70% completion rate
      const streakDay = completed
        ? Math.floor(Math.random() * habit.current_streak) + 1
        : 0;

      return {
        date: format(day, "yyyy-MM-dd"),
        dateLabel: format(day, "MMM d"),
        completed,
        streak_day: streakDay,
        isToday: isToday(day),
      };
    });
  }, [habit.current_streak]);

  // Calculate weekly aggregation
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < mockAnalyticsData.length; i += 7) {
      const weekData = mockAnalyticsData.slice(i, i + 7);
      const completedDays = weekData.filter((d) => d.completed).length;
      const weekStart = weekData[0]?.dateLabel || "";
      const weekEnd = weekData[weekData.length - 1]?.dateLabel || "";

      weeks.push({
        week: `${weekStart} - ${weekEnd}`,
        completed: completedDays,
        total: weekData.length,
        rate: Math.round((completedDays / weekData.length) * 100),
      });
    }
    return weeks;
  }, [mockAnalyticsData]);

  const stats = {
    completionRate:
      analytics?.completion_rate ||
      Math.round(
        (mockAnalyticsData.filter((d) => d.completed).length /
          mockAnalyticsData.length) *
          100
      ),
    currentStreak: analytics?.current_streak || habit.current_streak,
    longestStreak: analytics?.longest_streak || habit.longest_streak,
    totalCompletions:
      analytics?.total_completions ||
      mockAnalyticsData.filter((d) => d.completed).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Completion Rate
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completionRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">
                Current Streak
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.currentStreak}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">
                Best Streak
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.longestStreak}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">
                Total Completions
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalCompletions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Daily Completion Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => (value ? "Done" : "Missed")}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      value ? "Completed" : "Missed",
                      "Status",
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Weekly Completion Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Days Completed",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "completed" ? `${value} days` : `${value}%`,
                      name === "completed" ? "Completed" : "Rate",
                    ]}
                  />
                  <Bar dataKey="completed" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Calendar Heatmap (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {mockAnalyticsData.map((day, index) => (
                  <div
                    key={day.date}
                    className={`
                      aspect-square rounded-sm border text-xs flex items-center justify-center
                      ${
                        day.completed
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      }
                      ${day.isToday ? "ring-2 ring-blue-500" : ""}
                    `}
                    title={`${day.dateLabel}: ${
                      day.completed ? "Completed" : "Missed"
                    }`}
                  >
                    {format(new Date(day.date), "d")}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
                  <span>Missed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 border border-blue-600 rounded-sm"></div>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights & Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.completionRate >= 80 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Great consistency!
                </p>
                <p className="text-sm text-green-700">
                  You're maintaining an {stats.completionRate}% completion rate.
                  Keep up the excellent work!
                </p>
              </div>
            </div>
          )}

          {stats.currentStreak >= 7 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <Flame className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Streak milestone!
                </p>
                <p className="text-sm text-orange-700">
                  You've maintained this habit for {stats.currentStreak}{" "}
                  consecutive days.
                  {stats.currentStreak >= 21 &&
                    " You're building a strong routine!"}
                </p>
              </div>
            </div>
          )}

          {stats.completionRate < 50 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <Target className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Room for improvement
                </p>
                <p className="text-sm text-yellow-700">
                  Consider adjusting your habit frequency or setting reminders
                  to improve consistency.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
