import { useState, useEffect } from 'react';
import { Plus, Calendar, MessageSquare, CheckCircle, Activity, Clock, TrendingUp, Target, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { format, isToday, isPast } from 'date-fns';

export function MainDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch real data
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate real stats
  const pendingTasks = tasks.filter(task => task.status !== 'completed').length;
  const completedToday = tasks.filter(task => 
    task.status === 'completed' && 
    task.updated_at && 
    isToday(new Date(task.updated_at))
  ).length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    isPast(new Date(task.due_date)) && 
    task.status !== 'completed'
  ).length;
  const activeHabits = habits.filter(habit => habit.is_active).length;

  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Recent activities from real data
  const recentActivities = [
    ...tasks
      .filter(task => task.updated_at)
      .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
      .slice(0, 3)
      .map(task => ({
        id: `task-${task.id}`,
        action: task.status === 'completed' 
          ? `Completed task: ${task.title}`
          : `Updated task: ${task.title}`,
        time: format(new Date(task.updated_at!), 'MMM d, HH:mm'),
        type: 'task' as const,
        icon: task.status === 'completed' ? CheckCircle : Clock,
        color: task.status === 'completed' ? 'text-green-500' : 'text-blue-500'
      })),
    ...habits
      .filter(habit => habit.last_completed)
      .sort((a, b) => new Date(b.last_completed!).getTime() - new Date(a.last_completed!).getTime())
      .slice(0, 2)
      .map(habit => ({
        id: `habit-${habit.id}`,
        action: `Completed habit: ${habit.name}`,
        time: format(new Date(habit.last_completed!), 'MMM d, HH:mm'),
        type: 'habit' as const,
        icon: Target,
        color: 'text-purple-500'
      }))
  ].slice(0, 5);

  const quickStats = [
    { 
      label: 'Pending Tasks', 
      value: pendingTasks.toString(), 
      icon: Clock, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      change: overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'
    },
    { 
      label: 'Completed Today', 
      value: completedToday.toString(), 
      icon: CheckCircle, 
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      change: completedToday > 0 ? '+' + completedToday : 'No progress'
    },
    { 
      label: 'Active Habits', 
      value: activeHabits.toString(), 
      icon: Target, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      change: `${habits.length} total`
    },
    { 
      label: 'Completion Rate', 
      value: `${completionRate}%`, 
      icon: TrendingUp, 
      color: completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-yellow-500' : 'text-red-500',
      bgColor: completionRate >= 70 ? 'bg-green-50 dark:bg-green-950/20' : completionRate >= 40 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20',
      change: `${completedTasks}/${totalTasks} tasks`
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  return (
    <div className="h-full overflow-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{getGreeting()}</h1>
                <p className="text-muted-foreground">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'HH:mm')}
                </p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
              Here's your productivity overview for today. Stay focused and make progress on what matters most.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <div className={`absolute inset-0 ${stat.bgColor}`}></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Overview */}
        {totalTasks > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Progress Overview
              </CardTitle>
              <CardDescription>Your task completion progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Completion</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{pendingTasks}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{overdueTasks}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump into your most common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                size="lg" 
                className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Task
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 border-2 hover:bg-accent/50 transition-all duration-300"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Chat
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 border-2 hover:bg-accent/50 transition-all duration-300"
              >
                <Calendar className="h-5 w-5 mr-2" />
                View Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {tasks.length === 0 && habits.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to ECHO!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first task or habit. ECHO will help you stay organized and productive.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
                <Button variant="outline" size="lg">
                  <Target className="h-4 w-4 mr-2" />
                  Add a Habit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}