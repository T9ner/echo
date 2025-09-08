/**
 * DayView Component - Single day calendar view
 * 
 * Features:
 * - Hourly time slots
 * - Event display with details
 * - Quick event creation
 * - Responsive design
 */
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Event, EventType } from '@/types';

interface DayViewProps {
  selectedDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onCreateEvent?: (date: Date, time?: string) => void;
  onEventClick?: (event: Event) => void;
  isLoading?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({
  selectedDate,
  events,
  onDateSelect,
  onPreviousDay,
  onNextDay,
  onCreateEvent,
  onEventClick,
  isLoading = false,
  className
}: DayViewProps) {
  
  const formatTime = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };
  
  const formatEventTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getEventsForHour = (hour: number): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.toDateString() === selectedDate.toDateString() &&
        eventDate.getHours() === hour
      );
    });
  };
  
  const getAllDayEvents = (): Event[] => {
    return events.filter(event => 
      event.all_day && 
      new Date(event.start_time).toDateString() === selectedDate.toDateString()
    );
  };
  
  const getEventTypeColor = (eventType: EventType): string => {
    switch (eventType) {
      case EventType.MEETING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case EventType.TASK:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case EventType.PERSONAL:
        return 'bg-green-100 text-green-800 border-green-200';
      case EventType.REMINDER:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case EventType.APPOINTMENT:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const currentHour = new Date().getHours();
  
  const allDayEvents = getAllDayEvents();
  
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('day-view', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <span>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric' 
              })}
            </span>
            {isToday && (
              <Badge variant="secondary" className="text-xs">
                Today
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* All Day Events */}
        {allDayEvents.length > 0 && (
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium mb-3">All Day</h4>
            <div className="space-y-2">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all',
                    getEventTypeColor(event.event_type)
                  )}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{event.title}</h5>
                      {event.description && (
                        <p className="text-sm opacity-75 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 mt-2 text-sm opacity-75">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.event_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hourly Schedule */}
        <ScrollArea className="h-96">
          <div className="relative">
            {HOURS.map(hour => {
              const hourEvents = getEventsForHour(hour);
              const isCurrentHour = isToday && hour === currentHour;
              
              return (
                <div
                  key={hour}
                  className={cn(
                    'flex border-b border-border/50 min-h-16',
                    {
                      'bg-primary/5': isCurrentHour,
                    }
                  )}
                >
                  {/* Time Label */}
                  <div className="w-20 p-3 text-sm text-muted-foreground border-r border-border/50 flex-shrink-0">
                    {formatTime(hour)}
                  </div>
                  
                  {/* Event Area */}
                  <div
                    className="flex-1 p-2 hover:bg-accent/20 cursor-pointer relative"
                    onClick={() => {
                      if (onCreateEvent) {
                        onCreateEvent(selectedDate, `${hour.toString().padStart(2, '0')}:00`);
                      }
                    }}
                  >
                    {hourEvents.length > 0 ? (
                      <div className="space-y-2">
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              'p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all',
                              getEventTypeColor(event.event_type)
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium">{event.title}</h5>
                              <Badge variant="outline" className="text-xs capitalize">
                                {event.event_type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm opacity-75">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-sm opacity-75 mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Empty Hour Slot */
                      <div className="h-12 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        {onCreateEvent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateEvent(selectedDate, `${hour.toString().padStart(2, '0')}:00`);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Current Time Indicator */}
                    {isCurrentHour && (
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary pointer-events-none">
                        <div className="absolute left-0 top-1/2 w-2 h-2 bg-primary rounded-full transform -translate-y-1/2 -translate-x-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Summary */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {events.length} event{events.length !== 1 ? 's' : ''} on this day
            </span>
            {onCreateEvent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateEvent(selectedDate)}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Event
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DayView;