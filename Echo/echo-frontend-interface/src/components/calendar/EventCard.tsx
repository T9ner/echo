/**
 * EventCard Component - Display event details in a card format
 * 
 * Features:
 * - Event information display
 * - Type-based color coding
 * - Status indicators
 * - Action buttons (edit, delete)
 * - Time formatting
 * - Responsive design
 */
import React from 'react';
import { Clock, MapPin, Edit, Trash2, Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Event, EventType, EventStatus } from '@/types';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onView?: (event: Event) => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onView,
  compact = false,
  showActions = true,
  className
}: EventCardProps) {
  
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
  
  const getEventTypeIcon = (eventType: EventType) => {
    switch (eventType) {
      case EventType.MEETING:
        return <User className="h-3 w-3" />;
      case EventType.TASK:
        return <CheckCircle className="h-3 w-3" />;
      case EventType.PERSONAL:
        return <Calendar className="h-3 w-3" />;
      case EventType.REMINDER:
        return <AlertCircle className="h-3 w-3" />;
      case EventType.APPOINTMENT:
        return <Clock className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };
  
  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case EventStatus.SCHEDULED:
        return 'text-blue-600';
      case EventStatus.IN_PROGRESS:
        return 'text-yellow-600';
      case EventStatus.COMPLETED:
        return 'text-green-600';
      case EventStatus.CANCELLED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case EventStatus.SCHEDULED:
        return <Clock className="h-3 w-3" />;
      case EventStatus.IN_PROGRESS:
        return <AlertCircle className="h-3 w-3" />;
      case EventStatus.COMPLETED:
        return <CheckCircle className="h-3 w-3" />;
      case EventStatus.CANCELLED:
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  
  const handleCardClick = () => {
    if (onView) {
      onView(event);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(event);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(event.id);
    }
  };
  
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors',
          className
        )}
        onClick={handleCardClick}
      >
        <div className={cn('w-3 h-3 rounded-full', getEventTypeColor(event.event_type).split(' ')[0])} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground">
            {event.all_day ? 'All day' : `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`}
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEditClick}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-accent',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('text-xs', getEventTypeColor(event.event_type))}
            >
              {getEventTypeIcon(event.event_type)}
              <span className="ml-1 capitalize">{event.event_type}</span>
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', getStatusColor(event.status))}
            >
              {getStatusIcon(event.status)}
              <span className="ml-1 capitalize">{event.status.replace('_', ' ')}</span>
            </Badge>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {event.all_day ? (
                `All day • ${formatDate(event.start_time)}`
              ) : (
                `${formatTime(event.start_time)} - ${formatTime(event.end_time)} • ${formatDate(event.start_time)}`
              )}
            </span>
          </div>
          
          {/* Duration */}
          {!event.all_day && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4" /> {/* Spacer */}
              <span>Duration: {formatDuration(event.duration_minutes)}</span>
            </div>
          )}
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}
          
          {/* Recurrence */}
          {event.is_recurring && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Recurring • {event.recurrence_type}</span>
            </div>
          )}
        </div>
        
        {/* Footer with additional info */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Created {formatDate(event.created_at)}
          </div>
          
          {(event.task_id || event.habit_id) && (
            <div className="flex items-center gap-1">
              {event.task_id && (
                <Badge variant="outline" className="text-xs">
                  Task
                </Badge>
              )}
              {event.habit_id && (
                <Badge variant="outline" className="text-xs">
                  Habit
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EventCard;