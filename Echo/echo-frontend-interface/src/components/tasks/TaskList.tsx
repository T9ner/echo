import { useMemo } from 'react';
import { TaskItem } from './TaskItem';
import { Task, TaskFilters, TaskStatus, TaskPriority } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, Circle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  filters: TaskFilters;
  isLoading?: boolean;
  error?: Error | null;
  showDetails?: boolean;
}

export function TaskList({ tasks, filters, isLoading, error, showDetails = false }: TaskListProps) {
  // Filter and sort tasks based on filters
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    if (filters.due_date_from) {
      filtered = filtered.filter(task => 
        task.due_date && new Date(task.due_date) >= new Date(filters.due_date_from!)
      );
    }

    if (filters.due_date_to) {
      filtered = filtered.filter(task => 
        task.due_date && new Date(task.due_date) <= new Date(filters.due_date_to!)
      );
    }

    // Sort tasks (default: newest first)
    filtered.sort((a, b) => {
      // Priority sorting helper
      const getPriorityValue = (priority: TaskPriority) => {
        switch (priority) {
          case TaskPriority.HIGH: return 3;
          case TaskPriority.MEDIUM: return 2;
          case TaskPriority.LOW: return 1;
          default: return 0;
        }
      };

      // Default sort by created date (newest first)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      // Secondary sort by priority (high to low)
      if (dateA === dateB) {
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      }
      
      return dateB - dateA;
    });

    return filtered;
  }, [tasks, filters]);

  // Group tasks by status for better organization
  const groupedTasks = useMemo(() => {
    const groups = {
      [TaskStatus.TODO]: filteredAndSortedTasks.filter(task => task.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: filteredAndSortedTasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.COMPLETED]: filteredAndSortedTasks.filter(task => task.status === TaskStatus.COMPLETED),
    };

    return groups;
  }, [filteredAndSortedTasks]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load tasks: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (filteredAndSortedTasks.length === 0) {
    const hasFilters = Object.keys(filters).length > 0;
    
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
        </h3>
        <p className="text-gray-500 mb-4">
          {hasFilters 
            ? 'Try adjusting your filters to see more tasks.'
            : 'Create your first task to get started with ECHO.'
          }
        </p>
      </div>
    );
  }

  // If no specific status filter is applied, show grouped view
  if (!filters.status) {
    return (
      <div className="space-y-8">
        {/* To Do Tasks */}
        {groupedTasks[TaskStatus.TODO].length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                To Do ({groupedTasks[TaskStatus.TODO].length})
              </h3>
            </div>
            <div className="grid gap-3">
              {groupedTasks[TaskStatus.TODO].map(task => (
                <TaskItem key={task.id} task={task} showDetails={showDetails} />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {groupedTasks[TaskStatus.IN_PROGRESS].length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                In Progress ({groupedTasks[TaskStatus.IN_PROGRESS].length})
              </h3>
            </div>
            <div className="grid gap-3">
              {groupedTasks[TaskStatus.IN_PROGRESS].map(task => (
                <TaskItem key={task.id} task={task} showDetails={showDetails} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {groupedTasks[TaskStatus.COMPLETED].length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Completed ({groupedTasks[TaskStatus.COMPLETED].length})
              </h3>
            </div>
            <div className="grid gap-3">
              {groupedTasks[TaskStatus.COMPLETED].map(task => (
                <TaskItem key={task.id} task={task} showDetails={showDetails} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Simple list view when status filter is applied
  return (
    <div className="grid gap-3">
      {filteredAndSortedTasks.map(task => (
        <TaskItem key={task.id} task={task} showDetails={showDetails} />
      ))}
    </div>
  );
}