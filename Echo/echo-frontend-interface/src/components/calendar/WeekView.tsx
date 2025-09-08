/**
 * WeekView Component - Weekly calendar view
 * 
 * Features:
 * - 7-day week display
 * - Time slots with events
 * - Drag and drop support (future)
 * - Responsive design
 */
import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Event } from '@/types';

interface WeekViewProps {
  weekStart: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCreateEvent?: (date: Date, time?: string) => void;
  onEventClick?: (event: Event) => void;
  isLoading?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekView({
  weekStart,
  events,
  selectedDate,
  onDateSelect,
  onPreviousWeek,
  onNextWeek,
  onCreateEvent,
  onEventClick,
  isLoading = false,
  className
}: WeekViewProps) {
  
  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  const formatTime = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  const getEventsForDateAndHour = (date: Date, hour: number): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.toDateString() === date.toDateString() &&
        eventDate.getHours() === hour
      );
    });
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };
  
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 * 24 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('week-view', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <span>
              {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Week Header */}
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-2 text-xs text-muted-foreground">Time</div>
          {weekDays.map((date, index) => (
            <div
              key={date.toISOString()}
              className={cn(
                'p-2 text-center cursor-pointer hover:bg-accent/50 transition-colors',
                {
                  'bg-primary/10 text-primary font-medium': isToday(date),
                  'bg-accent': isSelected(date),
                }
              )}
              onClick={() => onDateSelect(date)}
            >
              <div className="text-xs text-muted-foreground">
                {WEEKDAYS[index]}
              </div>
              <div className="text-sm font-medium">
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time Grid */}
        <div className="max-h-96 overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-border/50">
              {/* Time Label */}
              <div className="p-2 text-xs text-muted-foreground border-r border-border/50">
                {formatTime(hour)}
              </div>
              
              {/* Day Columns */}
              {weekDays.map(date => {
                const hourEvents = getEventsForDateAndHour(date, hour);
                
                return (
                  <div
                    key={`${date.toISOString()}-${hour}`}
                    className="min-h-12 p-1 border-r border-border/50 hover:bg-accent/20 cursor-pointer relative"
                    onClick={() => {
                      if (onCreateEvent) {
                        onCreateEvent(date, `${hour.toString().padStart(2, '0')}:00`);
                      }
                    }}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 mb-1 bg-primary/20 text-primary rounded cursor-pointer hover:bg-primary/30 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick) {
                            onEventClick(event);
                          }
                        }}
                        title={event.title}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.location && (
                          <div className="text-xs opacity-75 truncate">{event.location}</div>
                        )}
                      </div>
                    ))}
                    
                    {/* Quick Add Button */}
                    {onCreateEvent && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateEvent(date, `${hour.toString().padStart(2, '0')}:00`);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default WeekView;