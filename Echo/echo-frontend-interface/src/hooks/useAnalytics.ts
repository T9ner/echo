import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { ProductivityAnalytics, HabitAnalytics, ProductivityInsights } from '@/types';
import { subDays, format } from 'date-fns';

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  productivity: () => [...analyticsKeys.all, 'productivity'] as const,
  productivityRange: (startDate: string, endDate: string) => 
    [...analyticsKeys.productivity(), startDate, endDate] as const,
  habits: () => [...analyticsKeys.all, 'habits'] as const,
  habitAnalytics: (habitId?: string) => 
    [...analyticsKeys.habits(), habitId] as const,
  insights: () => [...analyticsKeys.all, 'insights'] as const,
  insightsTimeframe: (timeframe: string) => 
    [...analyticsKeys.insights(), timeframe] as const,
};

// Get productivity analytics for a date range
export const useProductivityAnalytics = (
  startDate?: Date, 
  endDate?: Date
) => {
  // Default to last 30 days if no dates provided
  const defaultEndDate = endDate || new Date();
  const defaultStartDate = startDate || subDays(defaultEndDate, 29);
  
  const startDateStr = format(defaultStartDate, 'yyyy-MM-dd');
  const endDateStr = format(defaultEndDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: analyticsKeys.productivityRange(startDateStr, endDateStr),
    queryFn: () => analyticsApi.getProductivityAnalytics(startDateStr, endDateStr),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get habit analytics
export const useHabitAnalytics = (habitId?: string) => {
  return useQuery({
    queryKey: analyticsKeys.habitAnalytics(habitId),
    queryFn: () => analyticsApi.getHabitAnalytics(habitId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get productivity insights
export const useProductivityInsights = (timeframe: string = 'week') => {
  return useQuery({
    queryKey: analyticsKeys.insightsTimeframe(timeframe),
    queryFn: () => analyticsApi.getProductivityInsights(timeframe),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Combined analytics hook for dashboard overview
export const useDashboardAnalytics = (dateRange?: { start: Date; end: Date }) => {
  const productivityQuery = useProductivityAnalytics(dateRange?.start, dateRange?.end);
  const habitQuery = useHabitAnalytics();
  const insightsQuery = useProductivityInsights('week');

  return {
    productivity: productivityQuery,
    habits: habitQuery,
    insights: insightsQuery,
    isLoading: productivityQuery.isLoading || habitQuery.isLoading || insightsQuery.isLoading,
    isError: productivityQuery.isError || habitQuery.isError || insightsQuery.isError,
    error: productivityQuery.error || habitQuery.error || insightsQuery.error,
  };
};