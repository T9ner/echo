import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductivityAnalytics, HabitAnalytics } from '@/types';

interface AnalyticsChartsProps {
  productivityData?: ProductivityAnalytics;
  habitData?: HabitAnalytics;
  isLoading?: boolean;
}

export function AnalyticsCharts({ productivityData, habitData, isLoading }: AnalyticsChartsProps) {
  // Process task completion data for charts
  const taskCompletionData = useMemo(() => {
    if (!productivityData?.task_completion_by_day) return [];
    
    return productivityData.task_completion_by_day.map(day => ({
      date: format(parseISO(day.date), 'MMM d'),
      fullDate: day.date,
      completed: day.completed,
      created: day.created,
      completionRate: day.created > 0 ? (day.completed / day.created) * 100 : 0,
    }));
  }, [productivityData]);

  // Process habit completion data
  const habitCompletionData = useMemo(() => {
    if (!habitData?.completion_by_day) return [];
    
    return habitData.completion_by_day.slice(-14).map(day => ({
      date: format(parseISO(day.date), 'MMM d'),
      completed: day.completed ? 1 : 0,
      streak: day.streak_day,
    }));
  }, [habitData]);

  // Productivity score breakdown (mock data for pie chart)
  const productivityBreakdown = useMemo(() => {
    if (!productivityData) return [];
    
    const score = productivityData.productivity_score;
    return [
      { name: 'Completed Tasks', value: productivityData.completion_rate, color: '#10b981' },
      { name: 'Efficiency', value: Math.min(100 - productivityData.average_completion_time / 10, 100), color: '#3b82f6' },
      { name: 'Consistency', value: score * 0.8, color: '#8b5cf6' },
      { name: 'Room for Growth', value: Math.max(0, 100 - score), color: '#e5e7eb' },
    ];
  }, [productivityData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="productivity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="productivity">Productivity Trends</TabsTrigger>
          <TabsTrigger value="habits">Habit Progress</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          {/* Task Completion Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      value, 
                      name === 'completed' ? 'Completed' : 'Created'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Completion Rate Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Math.round(Number(value))}%`, 'Completion Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          {/* Habit Completion Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Habit Completion Pattern (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={habitCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 1]}
                    tickFormatter={(value) => value ? 'Done' : 'Missed'}
                  />
                  <Tooltip 
                    formatter={(value) => [value ? 'Completed' : 'Missed', 'Status']}
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Habit Streak Progress */}
          {habitData && (
            <Card>
              <CardHeader>
                <CardTitle>Habit Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(habitData.completion_rate)}%
                    </p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {habitData.current_streak}
                    </p>
                    <p className="text-sm text-gray-600">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {habitData.longest_streak}
                    </p>
                    <p className="text-sm text-gray-600">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {habitData.total_completions}
                    </p>
                    <p className="text-sm text-gray-600">Total Completions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {/* Productivity Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productivityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productivityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${Math.round(Number(value))}%`, 'Score']}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {productivityBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium">
                      {Math.round(item.value)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}