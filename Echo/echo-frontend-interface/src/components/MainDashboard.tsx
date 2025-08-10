import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  MessageSquare,
  CheckCircle,
  Activity,
  Clock,
  TrendingUp,
  Target,
  BarChart3,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { format, isToday, isPast } from "date-fns";

interface MainDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function MainDashboard({ onNavigate }: MainDashboardProps) {
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
  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed"
  ).length;
  const completedToday = tasks.filter(
    (task) =>
      task.status === "completed" &&
      task.updated_at &&
      isToday(new Date(task.updated_at))
  ).length;
  const overdueTasks = tasks.filter(
    (task) =>
      task.due_date &&
      isPast(new Date(task.due_date)) &&
      task.status !== "completed"
  ).length;
  const activeHabits = habits.filter((habit) => habit.is_active).length;

  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Recent activities from real data
  const recentActivities = [
    ...tasks
      .filter((task) => task.updated_at)
      .sort(
        (a, b) =>
          new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()
      )
      .slice(0, 3)
      .map((task) => ({
        id: `task-${task.id}`,
        action:
          task.status === "completed"
            ? `Completed task: ${task.title}`
            : `Updated task: ${task.title}`,
        time: format(new Date(task.updated_at!), "MMM d, HH:mm"),
        type: "task" as const,
        icon: task.status === "completed" ? CheckCircle : Clock,
        color: task.status === "completed" ? "text-green-500" : "text-blue-500",
      })),
    ...habits
      .filter((habit) => habit.last_completed)
      .sort(
        (a, b) =>
          new Date(b.last_completed!).getTime() -
          new Date(a.last_completed!).getTime()
      )
      .slice(0, 2)
      .map((habit) => ({
        id: `habit-${habit.id}`,
        action: `Completed habit: ${habit.name}`,
        time: format(new Date(habit.last_completed!), "MMM d, HH:mm"),
        type: "habit" as const,
        icon: Target,
        color: "text-purple-500",
      })),
  ].slice(0, 5);

  const quickStats = [
    {
      label: "Pending Tasks",
      value: pendingTasks.toString(),
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      change: overdueTasks > 0 ? `${overdueTasks} overdue` : "On track",
    },
    {
      label: "Completed Today",
      value: completedToday.toString(),
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      change: completedToday > 0 ? "+" + completedToday : "No progress",
    },
    {
      label: "Active Habits",
      value: activeHabits.toString(),
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      change: `${habits.length} total`,
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color:
        completionRate >= 70
          ? "text-green-500"
          : completionRate >= 40
          ? "text-yellow-500"
          : "text-red-500",
      bgColor:
        completionRate >= 70
          ? "bg-green-50 dark:bg-green-950/20"
          : completionRate >= 40
          ? "bg-yellow-50 dark:bg-yellow-950/20"
          : "bg-red-50 dark:bg-red-950/20",
      change: `${completedTasks}/${totalTasks} tasks`,
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  // Quick action handlers
  const handleAddTask = () => {
    onNavigate?.("tasks");
    // You could also open a task creation modal here
  };

  const handleStartChat = () => {
    onNavigate?.("chat");
  };

  const handleViewCalendar = () => {
    onNavigate?.("calendar");
  };

  const handleCreateFirstTask = () => {
    onNavigate?.("tasks");
  };

  const handleAddHabit = () => {
    onNavigate?.("habits");
  };

  return (
    <div className="h-full overflow-auto">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-mesh-gradient"></div>
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>

        {/* Content */}
        <div className="relative p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4 animate-slide-up">
                {/* Greeting and Time */}
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
                    {getGreeting()}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="text-lg font-medium">
                      {format(currentTime, "EEEE, MMMM d, yyyy")}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                    <span className="text-lg font-mono">
                      {format(currentTime, "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather/Status Widget (placeholder) */}
              <div className="hidden lg:flex items-center gap-3 glass rounded-2xl p-4 animate-slide-down">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">System Status</p>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Description */}
            <div
              className="max-w-3xl animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <p className="text-xl text-muted-foreground leading-relaxed">
                Welcome to your personal productivity command center.
                <span className="text-foreground font-medium">
                  {" "}
                  Track progress
                </span>
                ,
                <span className="text-foreground font-medium">
                  {" "}
                  build habits
                </span>
                , and
                <span className="text-foreground font-medium">
                  {" "}
                  achieve your goals
                </span>{" "}
                with AI-powered insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-0 bg-card-gradient hover-lift hover-glow transition-smooth animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-muted/20"></div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-brand-gradient-soft opacity-0 group-hover:opacity-100 transition-smooth"></div>

              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  {/* Enhanced Icon */}
                  <div
                    className={`
                    relative w-14 h-14 rounded-2xl flex items-center justify-center transition-smooth
                    group-hover:scale-110 group-hover:rotate-3
                    ${stat.bgColor}
                  `}
                  >
                    <stat.icon
                      className={`h-7 w-7 ${stat.color} transition-smooth group-hover:scale-110`}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>

                  {/* Enhanced Badge */}
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-background/50 backdrop-blur-sm border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-smooth"
                  >
                    {stat.change}
                  </Badge>
                </div>

                {/* Stats Content */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-smooth">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-foreground group-hover:text-primary transition-smooth">
                    {stat.value}
                  </p>
                </div>

                {/* Subtle Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-smooth origin-left"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Progress Overview */}
        {totalTasks > 0 && (
          <Card
            className="group border-0 bg-card-gradient hover-lift transition-smooth animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                Progress Overview
              </CardTitle>
              <CardDescription className="text-base">
                Track your productivity momentum and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Overall Completion
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {completionRate}%
                  </span>
                </div>

                {/* Custom Progress Bar with Gradient */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-brand-gradient rounded-full transition-smooth shadow-glow"
                    style={{ width: `${completionRate}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center space-y-2 p-4 rounded-xl bg-success/5 border border-success/10 hover:bg-success/10 transition-smooth">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-3xl font-bold text-success">
                    {completedTasks}
                  </p>
                  <p className="text-xs font-medium text-success/80 uppercase tracking-wide">
                    Completed
                  </p>
                </div>

                <div className="text-center space-y-2 p-4 rounded-xl bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-smooth">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-3xl font-bold text-warning">
                    {pendingTasks}
                  </p>
                  <p className="text-xs font-medium text-warning/80 uppercase tracking-wide">
                    Pending
                  </p>
                </div>

                <div className="text-center space-y-2 p-4 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-smooth">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-3xl font-bold text-destructive">
                    {overdueTasks}
                  </p>
                  <p className="text-xs font-medium text-destructive/80 uppercase tracking-wide">
                    Overdue
                  </p>
                </div>
              </div>

              {/* Progress Insights */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    {completionRate >= 80
                      ? "Excellent progress! Keep it up!"
                      : completionRate >= 60
                      ? "Good momentum, stay focused!"
                      : completionRate >= 40
                      ? "Making progress, push forward!"
                      : "Let's build some momentum together!"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Quick Actions */}
        <Card className="group border-0 bg-card-gradient hover-lift transition-smooth animate-slide-up">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-base">
              Jump into your most common tasks with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primary Action - Add Task */}
              <Button
                size="lg"
                className="group/btn relative h-16 bg-brand-gradient hover:shadow-glow-strong text-white font-medium transition-smooth hover:scale-105 overflow-hidden"
                onClick={handleAddTask}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="h-6 w-6 mr-3 transition-smooth group-hover/btn:rotate-90" />
                <div className="flex flex-col items-start">
                  <span className="text-base">Add New Task</span>
                  <span className="text-xs opacity-80">Create & organize</span>
                </div>
              </Button>

              {/* Secondary Action - Chat */}
              <Button
                variant="outline"
                size="lg"
                className="group/btn relative h-16 border-2 border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-smooth hover:scale-105"
                onClick={handleStartChat}
              >
                <MessageSquare className="h-6 w-6 mr-3 text-primary transition-smooth group-hover/btn:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium">AI Chat</span>
                  <span className="text-xs text-muted-foreground">
                    Talk with ECHO
                  </span>
                </div>
              </Button>

              {/* Tertiary Action - Calendar */}
              <Button
                variant="outline"
                size="lg"
                className="group/btn relative h-16 border-2 border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-smooth hover:scale-105"
                onClick={handleViewCalendar}
              >
                <Calendar className="h-6 w-6 mr-3 text-primary transition-smooth group-hover/btn:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium">Calendar</span>
                  <span className="text-xs text-muted-foreground">
                    View schedule
                  </span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity */}
        {recentActivities.length > 0 && (
          <Card
            className="group border-0 bg-card-gradient hover-lift transition-smooth animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription className="text-base">
                Your latest actions and productivity updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="group/item flex items-start gap-4 p-4 rounded-xl hover:bg-accent/30 transition-smooth animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Enhanced Activity Icon */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover/item:scale-110 transition-smooth`}
                      >
                        <activity.icon
                          className={`h-5 w-5 ${activity.color}`}
                        />
                      </div>
                      {/* Activity Type Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background border-2 border-background flex items-center justify-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === "task"
                              ? "bg-primary"
                              : activity.type === "habit"
                              ? "bg-success"
                              : "bg-warning"
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground group-hover/item:text-primary transition-smooth">
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                        <Badge
                          variant="outline"
                          className="text-xs h-5 px-2 bg-background/50 border-border/50 group-hover/item:border-primary/50 transition-smooth"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="opacity-0 group-hover/item:opacity-100 transition-smooth">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              <div className="pt-4 border-t border-border/50 mt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm text-muted-foreground hover:text-foreground"
                >
                  View All Activity
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Empty State */}
        {tasks.length === 0 && habits.length === 0 && (
          <Card className="border-0 bg-card-gradient animate-scale-in">
            <CardContent className="p-12 text-center">
              {/* Welcome section */}
              <div className="mb-8">
              </div>

              {/* Welcome Content */}
              <div className="space-y-4 mb-8">
                <h3 className="text-3xl font-bold text-foreground">
                  Welcome to <span className="text-gradient-brand">ECHO</span>!
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Your AI-powered productivity companion is ready to help you
                  achieve your goals. Start by creating your first task or
                  building a new habit.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <CheckSquare className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="font-medium text-foreground mb-2">
                    Smart Tasks
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Organize and prioritize with AI assistance
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                  <Target className="w-8 h-8 text-success mx-auto mb-3" />
                  <h4 className="font-medium text-foreground mb-2">
                    Build Habits
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Create lasting routines that stick
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                  <BarChart3 className="w-8 h-8 text-warning mx-auto mb-3" />
                  <h4 className="font-medium text-foreground mb-2">
                    Track Progress
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visualize your productivity journey
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleCreateFirstTask}
                  className="group"
                >
                  <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-smooth" />
                  Create Your First Task
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddHabit}
                  className="group"
                >
                  <Target className="h-5 w-5 mr-3 group-hover:scale-110 transition-smooth" />
                  Start Building Habits
                </Button>
              </div>

              {/* Subtle Call to Action */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Need help getting started?
                  <button
                    onClick={handleStartChat}
                    className="ml-2 text-primary hover:text-primary-hover font-medium transition-smooth"
                  >
                    Chat with ECHO AI →
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
