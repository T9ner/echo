/**
 * HabitCalendarIntegration Component - Connect habits with calendar scheduling
 *
 * Features:
 * - Schedule habit reminders
 * - Show habit streaks on calendar
 * - Habit completion tracking
 * - Weekly/monthly habit views
 * - Smart scheduling suggestions
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  CheckCircle,
  Flame,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { habitApi } from "@/lib/api";
import {
  Habit,
  HabitFrequency,
  EventCreate,
  EventType,
  RecurrenceType,
} from "@/types";
import { cn } from "@/lib/utils";

interface HabitCalendarIntegrationProps {
  onCreateEvent: (eventData: EventCreate) => Promise<void>;
  selectedDate?: Date;
  className?: string;
}

export function HabitCalendarIntegration({
  onCreateEvent,
  selectedDate,
  className,
}: HabitCalendarIntegrationProps) {
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedTime, setSelectedTime] = useState("09:00");

  // Fetch habits
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: () => habitApi.getHabits(),
  });

  // Get active habits (those that should be scheduled)
  const activeHabits = useMemo(() => {
    return habits.filter((habit) => habit.current_streak >= 0); // Active habits
  }, [habits]);

  // Get habits with good streaks (7+ days)
  const streakHabits = useMemo(() => {
    return activeHabits.filter((habit) => habit.current_streak >= 7);
  }, [activeHabits]);

  // Get habits that need attention (streak broken or low)
  const attentionHabits = useMemo(() => {
    return activeHabits.filter(
      (habit) =>
        habit.current_streak === 0 ||
        (habit.longest_streak > habit.current_streak &&
          habit.current_streak < 3)
    );
  }, [activeHabits]);

  // Get daily habits that should be scheduled today
  const dailyHabits = useMemo(() => {
    return activeHabits.filter(
      (habit) => habit.frequency === HabitFrequency.DAILY
    );
  }, [activeHabits]);

  const handleHabitToEvent = useCallback(
    async (habit: Habit, time: string) => {
      const today = selectedDate || new Date();
      const [hours, minutes] = time.split(":").map(Number);

      const startTime = new Date(today);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // Default 30 minutes

      // Determine recurrence based on habit frequency
      let recurrenceType = RecurrenceType.NONE;
      let recurrenceInterval = 1;

      switch (habit.frequency) {
        case HabitFrequency.DAILY:
          recurrenceType = RecurrenceType.DAILY;
          break;
        case HabitFrequency.WEEKLY:
          recurrenceType = RecurrenceType.WEEKLY;
          break;
        default:
          recurrenceType = RecurrenceType.NONE;
      }

      const eventData: EventCreate = {
        title: `Habit: ${habit.name}`,
        description:
          habit.description ||
          `Time for your ${habit.name} habit! Current streak: ${habit.current_streak} days`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: EventType.REMINDER,
        habit_id: habit.id,
        recurrence_type: recurrenceType,
        recurrence_interval: recurrenceInterval,
        all_day: false,
      };

      try {
        await onCreateEvent(eventData);
        setShowHabitDialog(false);
        setSelectedHabit(null);
      } catch (error) {
        console.error("Failed to create event from habit:", error);
      }
    },
    [onCreateEvent, selectedDate]
  );

  const getStreakColor = (streak: number): string => {
    if (streak === 0) return "text-gray-500";
    if (streak < 3) return "text-yellow-600";
    if (streak < 7) return "text-orange-600";
    if (streak < 30) return "text-green-600";
    return "text-purple-600";
  };

  const getStreakIcon = (streak: number) => {
    if (streak === 0) return <RotateCcw className="h-4 w-4" />;
    if (streak < 7) return <Target className="h-4 w-4" />;
    return <Flame className="h-4 w-4" />;
  };

  const getFrequencyLabel = (frequency: HabitFrequency): string => {
    switch (frequency) {
      case HabitFrequency.DAILY:
        return "Daily";
      case HabitFrequency.WEEKLY:
        return "Weekly";
      case HabitFrequency.MONTHLY:
        return "Monthly";
      default:
        return "Custom";
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
            <Target className="h-5 w-5" />
            Habit Scheduling
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Habits Needing Attention */}
          {attentionHabits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">
                  Needs Attention ({attentionHabits.length})
                </span>
              </div>
              <div className="space-y-2">
                {attentionHabits.slice(0, 3).map((habit) => (
                  <div
                    key={habit.id}
                    className="p-2 rounded-lg border border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => {
                      setSelectedHabit(habit);
                      setShowHabitDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-orange-800">
                          {habit.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              getStreakColor(habit.current_streak)
                            )}
                          >
                            {getStreakIcon(habit.current_streak)}
                            {habit.current_streak} day streak
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyLabel(habit.frequency)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Streak Habits */}
          {streakHabits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  Strong Streaks ({streakHabits.length})
                </span>
              </div>
              <div className="space-y-2">
                {streakHabits.slice(0, 3).map((habit) => (
                  <div
                    key={habit.id}
                    className="p-2 rounded-lg border border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => {
                      setSelectedHabit(habit);
                      setShowHabitDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-800">
                          {habit.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              getStreakColor(habit.current_streak)
                            )}
                          >
                            <Flame className="h-3 w-3" />
                            {habit.current_streak} day streak
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyLabel(habit.frequency)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Habits */}
          {dailyHabits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">
                  Daily Habits ({dailyHabits.length})
                </span>
              </div>
              <div className="space-y-2">
                {dailyHabits.slice(0, 5).map((habit) => (
                  <div
                    key={habit.id}
                    className="p-2 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedHabit(habit);
                      setShowHabitDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">
                          {habit.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              getStreakColor(habit.current_streak)
                            )}
                          >
                            {getStreakIcon(habit.current_streak)}
                            {habit.current_streak} day streak
                          </div>
                          <div className="text-xs text-blue-600">
                            Best: {habit.longest_streak} days
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habit Stats */}
          {activeHabits.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {activeHabits.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active Habits
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(
                      activeHabits.reduce(
                        (sum, habit) => sum + habit.current_streak,
                        0
                      ) / activeHabits.length
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Streak
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeHabits.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active habits to schedule</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habit Scheduling Dialog */}
      <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Habit Reminder</DialogTitle>
          </DialogHeader>

          {selectedHabit && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedHabit.name}</h3>
                {selectedHabit.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedHabit.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {getFrequencyLabel(selectedHabit.frequency)}
                  </Badge>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm",
                      getStreakColor(selectedHabit.current_streak)
                    )}
                  >
                    {getStreakIcon(selectedHabit.current_streak)}
                    {selectedHabit.current_streak} day streak
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Preferred Time
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">
                      6:00 AM - Early Morning
                    </SelectItem>
                    <SelectItem value="07:00">7:00 AM - Morning</SelectItem>
                    <SelectItem value="08:00">8:00 AM - Morning</SelectItem>
                    <SelectItem value="09:00">9:00 AM - Mid Morning</SelectItem>
                    <SelectItem value="12:00">12:00 PM - Lunch</SelectItem>
                    <SelectItem value="17:00">5:00 PM - Evening</SelectItem>
                    <SelectItem value="18:00">6:00 PM - Evening</SelectItem>
                    <SelectItem value="19:00">7:00 PM - Evening</SelectItem>
                    <SelectItem value="20:00">8:00 PM - Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                This will create a{" "}
                {selectedHabit.frequency === HabitFrequency.DAILY
                  ? "daily recurring"
                  : "recurring"}{" "}
                calendar reminder for your habit. You can modify the details
                after creation.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHabitDialog(false);
                setSelectedHabit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedHabit && handleHabitToEvent(selectedHabit, selectedTime)
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Schedule Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HabitCalendarIntegration;
