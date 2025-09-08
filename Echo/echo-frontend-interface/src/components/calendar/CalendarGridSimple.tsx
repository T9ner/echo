/**
 * CalendarGrid - Enhanced calendar grid component
 * Designed to work seamlessly with existing codebase
 */

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Event } from '@/types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateClick: (date: Date) => void;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  className
}) => {
  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the calendar
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();
      
      // Get events for this date
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        events: dayEvents
      });
    }
    
    return days;
  }, [currentDate, events]);

  const renderDay = (day: CalendarDay) => {
    const { date, isCurrentMonth, isToday, events: dayEvents } = day;
    
    return (
      <Card
        key={date.toISOString()}
        className={cn(
          'min-h-[100px] cursor-pointer hover:shadow-md transition-all',
          {
            'opacity-40': !isCurrentMonth,
            'ring-2 ring-primary': isToday,
            'bg-accent/20': isToday,
          }
        )}
        onClick={() => onDateClick(date)}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                'text-sm font-medium',
                {
                  'text-primary font-bold': isToday,
                  'text-muted-foreground': !isCurrentMonth,
                }
              )}
            >
              {date.getDate()}
            </span>
            {dayEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dayEvents.length}
              </Badge>
            )}
          </div>
          
          {/* Event indicators */}
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('calendar-grid', className)}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => renderDay(day))}
      </div>
    </div>
  );
};

export default CalendarGrid;
