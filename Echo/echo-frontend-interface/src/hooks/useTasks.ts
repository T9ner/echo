import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Task, TaskCreate, TaskUpdate, TaskFilters } from '@/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Get all tasks with filters
export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: taskKeys.list(filters || {}),
    queryFn: () => taskApi.getTasks(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get single task
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskApi.getTask(taskId),
    enabled: !!taskId,
  });
};

// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: TaskCreate) => taskApi.createTask(task),
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      toast({
        title: "Task created",
        description: `"${newTask.title}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating task",
        description: error.response?.data?.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });
};

// Update task mutation
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, task }: { taskId: string; task: TaskUpdate }) =>
      taskApi.updateTask(taskId, task),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id),
        updatedTask
      );
      
      // Invalidate tasks list to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      toast({
        title: "Task updated",
        description: `"${updatedTask.title}" has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating task",
        description: error.response?.data?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });
};

// Delete task mutation
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskApi.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
      
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting task",
        description: error.response?.data?.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });
};