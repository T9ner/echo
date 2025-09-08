/**
 * TaskCalendarIntegration Component - Connect tasks with calendar events
 * 
 * Features:
 * - Show task deadlines on calendar
 * - Convert tasks to calendar events
 * - Task completion from calendar
 * - Due date visualization
 */
import React, { useState, useCallback } from 'react';
import { CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Task, TaskStatus, EventCreate, EventType } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCalendarIntegrationProps {
  onCreateEvent: (eventData: EventCreate) => Promise<void>;
  selectedDate?: Date;
  className?: string;
}

export function TaskCalendarIntegration({
  onCreateEvent,
  selectedDate,
  className
}: TaskCalendarIntegrationProps) {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Fetch tasks with due dates
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskApi.getTasks,
  });
  
  // Filter tasks with due dates
  const tasksWithDueDates = tasks.filter(task => 
    task.due_date && task.status !== TaskStatus.COMPLETED
  );
  
  // Get overdue tasks
  const overdueTasks = tasksWithDueDates.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  
  // Get tasks due today
  const tasksDueToday = tasksWithDueDates.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });
  
  // Get tasks due this week
  const tasksDueThisWeek = tasksWithDueDates.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return dueDate >= today && dueDate <= weekFromNow;
  });
  
  const handleTaskToEvent = useCallback(async (task: Task) => {
    if (!task.due_date) return;
    
    const dueDate = new Date(task.due_date);
    const startTime = new Date(dueDate);
    startTime.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0); // 1 hour duration
    
    const eventData: EventCreate = {
      title: `Task: ${task.title}`,
      description: task.description || `Complete task: ${task.title}`,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: EventType.TASK,
      task_id: task.id,
      all_day: false,
    };
    
    try {
      await onCreateEvent(eventData);
      setShowTaskDialog(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to create event from task:', error);
    }
  }, [onCreateEvent]);
  
  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Task Deadlines
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  Overdue ({overdueTasks.length})
                </span>
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800">
                          {task.title}
                        </h4>
                        <p className="text-xs text-red-600">
                          {formatDueDate(task.due_date!)}
                        </p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                {overdueTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{overdueTasks.length - 3} more overdue tasks
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Due Today */}
          {tasksDueToday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">
                  Due Today ({tasksDueToday.length})
                </span>
              </div>
              <div className="space-y-2">
                {tasksDueToday.map(task => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg border border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-orange-800">
                          {task.title}
                        </h4>
                        <p className="text-xs text-orange-600">Due today</p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Due This Week */}
          {tasksDueThisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">
                  This Week ({tasksDueThisWeek.length})
                </span>
              </div>
              <div className="space-y-2">
                {tasksDueThisWeek.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">
                          {task.title}
                        </h4>
                        <p className="text-xs text-blue-600">
                          {formatDueDate(task.due_date!)}
                        </p>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                {tasksDueThisWeek.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{tasksDueThisWeek.length - 5} more tasks this week
                  </p>
                )}
              </div>
            </div>
          )}
          
          {tasksWithDueDates.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks with due dates</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Task to Event Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTask.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDueDate(selectedTask.due_date!)}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This will create a calendar event for this task on its due date.
                You can modify the time and details after creation.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTaskDialog(false);
                setSelectedTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedTask && handleTaskToEvent(selectedTask)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TaskCalendarIntegration;