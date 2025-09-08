import { useState } from 'react';
import { Plus, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HabitForm } from './habits/HabitForm';
import { HabitList } from './habits/HabitList';
import { HabitAnalytics } from './habits/HabitAnalytics';
import { useHabits } from '@/hooks/useHabits';
import { useApiHealth } from '@/hooks/useApiHealth';
import { Habit } from '@/types';

export function HabitsView() {
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [analyticsHabit, setAnalyticsHabit] = useState<Habit | null>(null);

  // Fetch all habits
  const { data: habits = [], isLoading, error, refetch } = useHabits();
  

  
  // Check API health
  const { data: healthStatus, isError: healthError } = useApiHealth();

  // Calculate habit count for display
  const totalHabits = habits.length;

  const handleRefresh = () => {
    refetch();
  };

  const handleHabitCreated = () => {
    setShowHabitForm(false);
    setEditingHabit(null);
    // Habits will automatically refresh due to React Query cache invalidation
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleViewAnalytics = (habit: Habit) => {
    setAnalyticsHabit(habit);
  };

  const handleCloseForm = () => {
    setShowHabitForm(false);
    setEditingHabit(null);
  };

  const handleCloseAnalytics = () => {
    setAnalyticsHabit(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Habits</h1>
            <p className="text-muted-foreground">Build better routines and track your progress</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button onClick={() => setShowHabitForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </div>
        </div>

        {/* API Health Warning */}
        {healthError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Unable to connect to the backend API. Some features may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Habit count display */}
        <div className="text-sm text-muted-foreground">
          Showing {totalHabits} habits
        </div>
      </div>

      {/* Habit List */}
      <div className="flex-1 overflow-auto p-6">
        <HabitList
          habits={habits}
          isLoading={isLoading}
          error={error}
          onEditHabit={handleEditHabit}
        />
      </div>

      {/* Habit Form Dialog */}
      <Dialog open={showHabitForm} onOpenChange={setShowHabitForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </DialogTitle>
          </DialogHeader>
          <HabitForm
            habit={editingHabit || undefined}
            onSuccess={handleHabitCreated}
            isOpen={showHabitForm}
            onOpenChange={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={!!analyticsHabit} onOpenChange={() => handleCloseAnalytics()}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics: {analyticsHabit?.name}
            </DialogTitle>
          </DialogHeader>
          {analyticsHabit && (
            <HabitAnalytics
              habit={analyticsHabit}
              // analytics={analyticsData} // Would be fetched from API
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}