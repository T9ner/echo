import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitApi } from '@/lib/api';
import { Habit, HabitCreate, HabitFilters } from '@/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (filters: HabitFilters) => [...habitKeys.lists(), filters] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
  logs: (id: string) => [...habitKeys.detail(id), 'logs'] as const,
};

// Get all habits with filters
export const useHabits = (filters?: HabitFilters) => {
  return useQuery({
    queryKey: habitKeys.list(filters || {}),
    queryFn: () => habitApi.getHabits(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get single habit
export const useHabit = (habitId: string) => {
  return useQuery({
    queryKey: habitKeys.detail(habitId),
    queryFn: () => habitApi.getHabit(habitId),
    enabled: !!habitId,
  });
};

// Get habit logs
export const useHabitLogs = (habitId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...habitKeys.logs(habitId), startDate, endDate],
    queryFn: () => habitApi.getHabitLogs(habitId, startDate, endDate),
    enabled: !!habitId,
  });
};

// Create habit mutation
export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habit: HabitCreate) => habitApi.createHabit(habit),
    onSuccess: (newHabit) => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      
      toast({
        title: "Habit created",
        description: `"${newHabit.name}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating habit",
        description: error.response?.data?.message || "Failed to create habit",
        variant: "destructive",
      });
    },
  });
};

// Update habit mutation
export const useUpdateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, habit }: { habitId: string; habit: Partial<HabitCreate> }) =>
      habitApi.updateHabit(habitId, habit),
    onSuccess: (updatedHabit) => {
      // Update the specific habit in cache
      queryClient.setQueryData(
        habitKeys.detail(updatedHabit.id),
        updatedHabit
      );
      
      // Invalidate habits list to ensure consistency
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      
      toast({
        title: "Habit updated",
        description: `"${updatedHabit.name}" has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating habit",
        description: error.response?.data?.message || "Failed to update habit",
        variant: "destructive",
      });
    },
  });
};

// Delete habit mutation
export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitId: string) => habitApi.deleteHabit(habitId),
    onSuccess: (_, habitId) => {
      // Remove habit from cache
      queryClient.removeQueries({ queryKey: habitKeys.detail(habitId) });
      
      // Invalidate habits list
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      
      toast({
        title: "Habit deleted",
        description: "Habit has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting habit",
        description: error.response?.data?.message || "Failed to delete habit",
        variant: "destructive",
      });
    },
  });
};

// Log habit completion mutation
export const useLogHabitCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, notes }: { habitId: string; notes?: string }) =>
      habitApi.logHabitCompletion(habitId, notes),
    onSuccess: (_, { habitId }) => {
      // Invalidate habit details to update streak
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(habitId) });
      
      // Invalidate habit logs
      queryClient.invalidateQueries({ queryKey: habitKeys.logs(habitId) });
      
      // Invalidate habits list to update streak display
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      
      toast({
        title: "Habit logged",
        description: "Habit completion has been logged successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error logging habit",
        description: error.response?.data?.message || "Failed to log habit completion",
        variant: "destructive",
      });
    },
  });
};