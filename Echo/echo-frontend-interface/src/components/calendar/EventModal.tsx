/**
 * EventModal Component - View and manage event details
 * 
 * Features:
 * - Full event details display
 * - Edit and delete actions
 * - Reminder management
 * - Responsive modal design
 * - Loading states
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  Bell,
  Repeat,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventWithReminders, EventType, EventStatus, EventReminder } from '@/types';

interface EventModalProps {
  event: EventWithReminders | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: EventWithReminders) => void;
  onDelete?: (eventId: string) => void;
  onAddReminder?: (eventId: string) => void;
  isLoading?: boolean;
}

export function EventModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddReminder,
  isLoading = false
}: EventModalProps) {
  const [showReminders, setShowReminders] = useState(false);
  
  if (!event) return null;
  
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
        return <User className="h-4 w-4" />;
      case EventType.TASK:
        return <CheckCircle className="h-4 w-4" />;
      case EventType.PERSONAL:
        return <Calendar className="h-4 w-4" />;
      case EventType.REMINDER:
        return <AlertCircle className="h-4 w-4" />;
      case EventType.APPOINTMENT:
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
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
        return <Clock className="h-4 w-4" />;
      case EventStatus.IN_PROGRESS:
        return <AlertCircle className="h-4 w-4" />;
      case EventStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case EventStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };
  
  const formatReminderTime = (minutesBefore: number): string => {
    if (minutesBefore < 60) {
      return `${minutesBefore} minutes before`;
    }
    const hours = Math.floor(minutesBefore / 60);
    const remainingMinutes = minutesBefore % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m before`
        : `${hours} hour${hours > 1 ? 's' : ''} before`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0
      ? `${days}d ${remainingHours}h before`
      : `${days} day${days > 1 ? 's' : ''} before`;
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
    }
  };
  
  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };
  
  const handleAddReminder = () => {
    if (onAddReminder) {
      onAddReminder(event.id);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={cn('text-sm', getEventTypeColor(event.event_type))}
                >
                  {getEventTypeIcon(event.event_type)}
                  <span className="ml-1 capitalize">{event.event_type}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-sm', getStatusColor(event.status))}
                >
                  {getStatusIcon(event.status)}
                  <span className="ml-1 capitalize">{event.status.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Description */}
            {event.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
            
            {/* Date and Time */}
            <div>
              <h4 className="font-medium mb-3">Date & Time</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    {event.all_day ? (
                      <div>
                        <div className="font-medium">All Day</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(event.start_time).split(' at ')[0]}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(event.start_time).split(' at ')[0]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {!event.all_day && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Duration: {formatDuration(event.duration_minutes)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Location */}
            {event.location && (
              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              </div>
            )}
            
            {/* Recurrence */}
            {event.is_recurring && (
              <div>
                <h4 className="font-medium mb-2">Recurrence</h4>
                <div className="flex items-center gap-3">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="capitalize">{event.recurrence_type}</div>
                    {event.recurrence_interval && event.recurrence_interval > 1 && (
                      <div className="text-sm text-muted-foreground">
                        Every {event.recurrence_interval} {event.recurrence_type}s
                      </div>
                    )}
                    {event.recurrence_end_date && (
                      <div className="text-sm text-muted-foreground">
                        Until {formatDateTime(event.recurrence_end_date).split(' at ')[0]}
                      </div>
                    )}
                    {event.recurrence_count && (
                      <div className="text-sm text-muted-foreground">
                        For {event.recurrence_count} occurrences
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Reminders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Reminders</h4>
                {onAddReminder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddReminder}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              
              {event.reminders && event.reminders.length > 0 ? (
                <div className="space-y-2">
                  {event.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">
                            {formatReminderTime(reminder.minutes_before)}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {reminder.method}
                          </div>
                        </div>
                      </div>
                      
                      {reminder.sent && (
                        <Badge variant="secondary" className="text-xs">
                          Sent
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No reminders set
                </div>
              )}
            </div>
            
            {/* Associations */}
            {(event.task_id || event.habit_id) && (
              <div>
                <h4 className="font-medium mb-2">Associations</h4>
                <div className="flex items-center gap-2">
                  {event.task_id && (
                    <Badge variant="outline" className="text-sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Task
                    </Badge>
                  )}
                  {event.habit_id && (
                    <Badge variant="outline" className="text-sm">
                      <Repeat className="h-3 w-3 mr-1" />
                      Habit
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Created: {formatDateTime(event.created_at)}</div>
              <div>Last updated: {formatDateTime(event.updated_at)}</div>
              <div>Event ID: {event.id}</div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Close
              </Button>
              {onEdit && (
                <Button
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EventModal;