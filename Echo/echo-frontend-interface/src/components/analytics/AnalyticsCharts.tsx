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
    if (!productivityData?.tasks?.productivity_by_day) return [];
    
    return productivityData.tasks.productivity_by_day.map(day => ({
      date: format(parseISO(day.date), 'MMM d'),
      fullDate: day.date,
      completed: day.tasks_completed || 0,
      created: day.tasks_created || 0,
      completionRate: day.tasks_created > 0 ? (day.tasks_completed / day.tasks_created) * 100 : 0,
    }));
  }, [productivityData]);

  // Process habit completion data
  const habitCompletionData = useMemo(() => {
    if (!productivityData?.habits?.completion_by_day) return [];
    
    return productivityData.habits.completion_by_day.slice(-14).map(day => ({
      date: format(parseISO(day.date), 'MMM d'),
      completed: day.total_completions > 0 ? 1 : 0,
      completions: day.total_completions || 0,
    }));
  }, [productivityData]);

  // Productivity score breakdown
  const productivityBreakdown = useMemo(() => {
    if (!productivityData?.overall_score) return [];
    
    const taskScore = productivityData.overall_score.task_score || 0;
    const habitScore = productivityData.overall_score.habit_score || 0;
    const overallScore = productivityData.overall_score.overall_score || 0;
    
    return [
      { name: 'Completed Tasks', value: isNaN(taskScore) ? 0 : taskScore, color: '#10b981' },
      { name: 'Efficiency', value: isNaN(taskScore) ? 0 : Math.min(taskScore * 1.2, 50), color: '#3b82f6' },
      { name: 'Consistency', value: isNaN(habitScore) ? 0 : habitScore, color: '#8b5cf6' },
      { name: 'Room for Growth', value: isNaN(overallScore) ? 100 : Math.max(0, 100 - overallScore), color: '#e5e7eb' },
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
          {/* Habit Statistics Only */}
          {productivityData?.habits && (
            <Card>
              <CardHeader>
                <CardTitle>Habit Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {isNaN(productivityData.habits.consistency_rate) ? '0' : Math.round(productivityData.habits.consistency_rate)}%
                    </p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {productivityData.habits.average_streak || 0}
                    </p>
                    <p className="text-sm text-gray-600">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {productivityData.habits.best_streak || 0}
                    </p>
                    <p className="text-sm text-gray-600">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {productivityData.habits.total_completions || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Completions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Empty state when no habits */}
          {(!productivityData?.habits || productivityData.habits.total_habits === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Habits Yet</h3>
                <p className="text-gray-600 mb-4">Start building habits to see your progress and patterns here.</p>
                <p className="text-sm text-gray-500">Create your first habit in the Habits section to get started!</p>
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