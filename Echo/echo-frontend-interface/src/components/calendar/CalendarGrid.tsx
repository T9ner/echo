/**
 * CalendarGrid Component - Interactive calendar month view
 *
 * Features:
 * - Month view with proper date calculations
 * - Event indicators on dates
 * - Click handlers for date selection
 * - Today highlighting
 * - Navigation controls
 * - Responsive design
 */
import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarMonth, CalendarDay, Event, EventType } from "@/types";

interface CalendarGridProps {
  calendarMonth: CalendarMonth;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCreateEvent?: (date: Date) => void;
  isLoading?: boolean;
  className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarGrid({
  calendarMonth,
  selectedDate,
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
  onCreateEvent,
  isLoading = false,
  className,
}: CalendarGridProps) {
  const getEventTypeColor = (eventType: EventType): string => {
    switch (eventType) {
      case EventType.MEETING:
        return "bg-blue-500";
      case EventType.TASK:
        return "bg-orange-500";
      case EventType.PERSONAL:
        return "bg-green-500";
      case EventType.REMINDER:
        return "bg-purple-500";
      case EventType.APPOINTMENT:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDateClick = (day: CalendarDay) => {
    onDateSelect(day.date);
  };

  const handleDateDoubleClick = (day: CalendarDay) => {
    if (onCreateEvent) {
      onCreateEvent(day.date);
    }
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const renderEventIndicators = (events: Event[]) => {
    if (events.length === 0) return null;

    // Show up to 3 event indicators
    const visibleEvents = events.slice(0, 3);
    const hasMore = events.length > 3;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {visibleEvents.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              "w-2 h-2 rounded-full",
              getEventTypeColor(event.event_type)
            )}
            title={event.title}
          />
        ))}
        {hasMore && (
          <div className="text-xs text-muted-foreground">
            +{events.length - 3}
          </div>
        )}
      </div>
    );
  };

  const renderDay = (day: CalendarDay) => {
    const isSelected = isDateSelected(day.date);
    const hasEvents = day.events.length > 0;

    return (
      <div
        key={day.date.toISOString()}
        className={cn(
          "min-h-[80px] p-2 border border-border/50 cursor-pointer transition-all duration-200",
          "hover:bg-accent/50 hover:border-accent",
          {
            "bg-muted/30": !day.isCurrentMonth,
            "bg-primary text-primary-foreground": isSelected,
            "bg-accent/20": day.isToday && !isSelected,
            "opacity-50": !day.isCurrentMonth,
          }
        )}
        onClick={() => handleDateClick(day)}
        onDoubleClick={() => handleDateDoubleClick(day)}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn("text-sm font-medium", {
              "text-primary font-bold": day.isToday && !isSelected,
              "text-muted-foreground": !day.isCurrentMonth,
            })}
          >
            {day.date.getDate()}
          </span>
          {hasEvents && (
            <Badge
              variant="secondary"
              className="h-5 w-5 p-0 text-xs rounded-full"
            >
              {day.events.length}
            </Badge>
          )}
        </div>

        {renderEventIndicators(day.events)}

        {/* Quick add button on hover */}
        {onCreateEvent && day.isCurrentMonth && (
          <div className="opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                onCreateEvent(day.date);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-8 bg-muted rounded mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("calendar-grid", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
          </h2>
          <div className="text-sm text-muted-foreground">
            {calendarMonth.totalEvents} events
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 border border-border rounded-lg overflow-hidden">
        {calendarMonth.weeks.map((week) =>
          week.days.map((day) => renderDay(day))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Meetings</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Personal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Reminders</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Appointments</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground mt-2">
        Click to select • Double-click to create event
      </div>
    </div>
  );
}

export default CalendarGrid;
