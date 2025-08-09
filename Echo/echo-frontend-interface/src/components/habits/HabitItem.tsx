import { useState } from 'react';
import { format, isToday, startOfDay, differenceInDays } from 'date-fns';
import { 
  Flame, 
  Target, 
  Calendar,
  Edit3, 
  Trash2, 
  CheckCircle,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Habit, HabitFrequency } from '@/types';
import { useLogHabitCompletion, useDeleteHabit } from '@/hooks/useHabits';

interface HabitItemProps {
  habit: Habit;
  todayCompleted?: boolean;
  onEdit?: (habit: Habit) => void;
}

export function HabitItem({ habit, todayCompleted = false, onEdit }: HabitItemProps) {
  const [isLogging, setIsLogging] = useState(false);
  
  const logHabitMutation = useLogHabitCompletion();
  const deleteHabitMutation = useDeleteHabit();

  const getFrequencyColor = (frequency: HabitFrequency) => {
    switch (frequency) {
      case HabitFrequency.DAILY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case HabitFrequency.WEEKLY:
        return 'bg-green-100 text-green-800 border-green-200';
      case HabitFrequency.CUSTOM:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500'; // Fire red for 30+ days
    if (streak >= 14) return 'text-orange-500'; // Orange for 2+ weeks
    if (streak >= 7) return 'text-yellow-500'; // Yellow for 1+ week
    return 'text-gray-500'; // Gray for less than a week
  };

  const handleLogCompletion = () => {
    if (todayCompleted) return; // Already completed today
    
    setIsLogging(true);
    logHabitMutation.mutate(
      { habitId: habit.id },
      {
        onSettled: () => setIsLogging(false),
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${habit.name}"? This will remove all tracking data.`)) {
      deleteHabitMutation.mutate(habit.id);
    }
  };

  const handleEdit = () => {
    onEdit?.(habit);
  };

  // Calculate completion rate (simplified - would need actual logs data)
  const completionRate = habit.current_streak > 0 ? Math.min((habit.current_streak / 30) * 100, 100) : 0;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      todayCompleted ? 'ring-2 ring-green-200 bg-green-50' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{habit.name}</h3>
              {todayCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            
            {habit.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {habit.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Habit Metadata */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className={`text-xs ${getFrequencyColor(habit.frequency)}`}>
            {habit.frequency}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Target className="h-3 w-3" />
            <span>{habit.target_count}x per {habit.frequency.toLowerCase()}</span>
          </div>
        </div>

        {/* Streak Information */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className={`h-4 w-4 ${getStreakColor(habit.current_streak)}`} />
              <span className="text-sm font-medium text-gray-900">
                {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>Best: {habit.longest_streak}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <Calendar className="h-3 w-3 inline mr-1" />
            Created {format(new Date(habit.created_at), 'MMM d, yyyy')}
          </div>
          
          <Button
            size="sm"
            onClick={handleLogCompletion}
            disabled={todayCompleted || isLogging || logHabitMutation.isPending}
            className={todayCompleted ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {isLogging || logHabitMutation.isPending ? (
              'Logging...'
            ) : todayCompleted ? (
              'Completed Today'
            ) : (
              'Mark Complete'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}