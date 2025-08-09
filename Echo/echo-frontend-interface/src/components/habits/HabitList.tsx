import { useMemo } from 'react';
import { HabitItem } from './HabitItem';
import { Habit, HabitFilters } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flame, Target, Calendar } from 'lucide-react';

interface HabitListProps {
  habits: Habit[];
  filters: HabitFilters;
  isLoading?: boolean;
  error?: Error | null;
  onEditHabit?: (habit: Habit) => void;
}

export function HabitList({ habits, filters, isLoading, error, onEditHabit }: HabitListProps) {
  // Filter habits based on filters
  const filteredHabits = useMemo(() => {
    let filtered = [...habits];

    if (filters.frequency) {
      filtered = filtered.filter(habit => habit.frequency === filters.frequency);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(habit => 
        habit.name.toLowerCase().includes(searchLower) ||
        (habit.description && habit.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort by current streak (highest first), then by creation date
    filtered.sort((a, b) => {
      if (a.current_streak !== b.current_streak) {
        return b.current_streak - a.current_streak;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [habits, filters]);

  // Group habits by performance for better organization
  const groupedHabits = useMemo(() => {
    const groups = {
      active: filteredHabits.filter(habit => habit.current_streak > 0),
      inactive: filteredHabits.filter(habit => habit.current_streak === 0),
    };

    return groups;
  }, [filteredHabits]);

  // Mock today's completion status (in real app, this would come from API)
  const getTodayCompletionStatus = (habitId: string) => {
    // Simulate some habits being completed today
    return Math.random() > 0.5;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24" />
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
          Failed to load habits: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (filteredHabits.length === 0) {
    const hasFilters = Object.keys(filters).length > 0;
    
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Target className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {hasFilters ? 'No habits match your filters' : 'No habits yet'}
        </h3>
        <p className="text-gray-500 mb-4">
          {hasFilters 
            ? 'Try adjusting your filters to see more habits.'
            : 'Create your first habit to start building better routines.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Habits (with current streaks) */}
      {groupedHabits.active.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Active Streaks ({groupedHabits.active.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedHabits.active.map(habit => (
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                todayCompleted={getTodayCompletionStatus(habit.id)}
                onEdit={onEditHabit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Habits (no current streak) */}
      {groupedHabits.inactive.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to Restart ({groupedHabits.inactive.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedHabits.inactive.map(habit => (
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                todayCompleted={getTodayCompletionStatus(habit.id)}
                onEdit={onEditHabit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredHabits.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Habits:</span>
              <span className="ml-2 font-medium">{filteredHabits.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Active Streaks:</span>
              <span className="ml-2 font-medium">{groupedHabits.active.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Longest Streak:</span>
              <span className="ml-2 font-medium">
                {Math.max(...filteredHabits.map(h => h.longest_streak), 0)} days
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Streaks:</span>
              <span className="ml-2 font-medium">
                {filteredHabits.reduce((sum, h) => sum + h.current_streak, 0)} days
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}