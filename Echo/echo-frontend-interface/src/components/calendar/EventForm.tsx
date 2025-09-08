/**
 * EventForm Component - Create and edit events
 * 
 * Features:
 * - Create new events
 * - Edit existing events
 * - Form validation
 * - Date/time pickers
 * - Event type selection
 * - Recurrence settings
 * - Conflict detection
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Type, Repeat, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Event, EventCreate, EventUpdate, EventType, EventStatus, RecurrenceType } from '@/types';

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  all_day: z.boolean().default(false),
  event_type: z.nativeEnum(EventType).default(EventType.PERSONAL),
  status: z.nativeEnum(EventStatus).default(EventStatus.SCHEDULED),
  recurrence_type: z.nativeEnum(RecurrenceType).default(RecurrenceType.NONE),
  recurrence_interval: z.number().min(1).max(365).optional(),
  recurrence_end_date: z.string().optional(),
  recurrence_count: z.number().min(1).max(1000).optional(),
  task_id: z.string().optional(),
  habit_id: z.string().optional(),
}).refine((data) => {
  // Validate that end time is after start time
  if (!data.all_day) {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    return endTime > startTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  event?: Event;
  initialDate?: Date;
  onSubmit: (data: EventCreate | EventUpdate) => Promise<void>;
  onCancel: () => void;
  onCheckConflicts?: (startTime: string, endTime: string, allDay: boolean, excludeEventId?: string) => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

export function EventForm({
  event,
  initialDate,
  onSubmit,
  onCancel,
  onCheckConflicts,
  isLoading = false,
  className
}: EventFormProps) {
  const [hasConflicts, setHasConflicts] = useState(false);
  const [conflictChecking, setConflictChecking] = useState(false);
  
  const isEditing = !!event;
  
  // Initialize form with default values
  const getDefaultValues = (): Partial<EventFormData> => {
    if (event) {
      return {
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        event_type: event.event_type,
        status: event.status,
        recurrence_type: event.recurrence_type,
        recurrence_interval: event.recurrence_interval,
        recurrence_end_date: event.recurrence_end_date,
        recurrence_count: event.recurrence_count,
        task_id: event.task_id,
        habit_id: event.habit_id,
      };
    }
    
    // Default values for new event
    const now = initialDate || new Date();
    const startTime = new Date(now);
    startTime.setMinutes(0, 0, 0); // Round to nearest hour
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration
    
    return {
      title: '',
      description: '',
      location: '',
      start_time: startTime.toISOString().slice(0, 16), // Format for datetime-local input
      end_time: endTime.toISOString().slice(0, 16),
      all_day: false,
      event_type: EventType.PERSONAL,
      status: EventStatus.SCHEDULED,
      recurrence_type: RecurrenceType.NONE,
    };
  };
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultValues(),
  });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  
  // Watch form values for conflict checking
  const watchedValues = watch(['start_time', 'end_time', 'all_day']);
  
  // Check for conflicts when time changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!onCheckConflicts || !watchedValues[0] || !watchedValues[1]) return;
      
      setConflictChecking(true);
      try {
        const conflicts = await onCheckConflicts(
          watchedValues[0],
          watchedValues[1],
          watchedValues[2],
          event?.id
        );
        setHasConflicts(conflicts);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setConflictChecking(false);
      }
    };
    
    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedValues, onCheckConflicts, event?.id]);
  
  // Handle all-day toggle
  const handleAllDayChange = (checked: boolean) => {
    setValue('all_day', checked);
    
    if (checked) {
      // Set to full day
      const startDate = new Date(watchedValues[0]);
      const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59);
      
      setValue('start_time', startOfDay.toISOString().slice(0, 16));
      setValue('end_time', endOfDay.toISOString().slice(0, 16));
    }
  };
  
  const onFormSubmit = async (data: EventFormData) => {
    try {
      // Convert datetime-local format to ISO string
      const eventData = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        // Remove undefined values
        description: data.description || undefined,
        location: data.location || undefined,
        recurrence_interval: data.recurrence_type !== RecurrenceType.NONE ? data.recurrence_interval : undefined,
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date).toISOString() : undefined,
        recurrence_count: data.recurrence_type !== RecurrenceType.NONE ? data.recurrence_count : undefined,
        task_id: data.task_id || undefined,
        habit_id: data.habit_id || undefined,
      };
      
      await onSubmit(eventData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Event title"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Event description (optional)"
                rows={3}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Event location (optional)"
                  className={cn('pl-10', errors.location ? 'border-destructive' : '')}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>
          
          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="all-day"
                checked={watch('all_day')}
                onCheckedChange={handleAllDayChange}
              />
              <Label htmlFor="all-day">All day event</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start {watch('all_day') ? 'Date' : 'Date & Time'} *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_time"
                    type={watch('all_day') ? 'date' : 'datetime-local'}
                    {...register('start_time')}
                    className={cn('pl-10', errors.start_time ? 'border-destructive' : '')}
                  />
                </div>
                {errors.start_time && (
                  <p className="text-sm text-destructive mt-1">{errors.start_time.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="end_time">End {watch('all_day') ? 'Date' : 'Date & Time'} *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_time"
                    type={watch('all_day') ? 'date' : 'datetime-local'}
                    {...register('end_time')}
                    className={cn('pl-10', errors.end_time ? 'border-destructive' : '')}
                  />
                </div>
                {errors.end_time && (
                  <p className="text-sm text-destructive mt-1">{errors.end_time.message}</p>
                )}
              </div>
            </div>
            
            {/* Conflict Warning */}
            {(hasConflicts || conflictChecking) && (
              <Alert variant={hasConflicts ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {conflictChecking 
                    ? 'Checking for conflicts...' 
                    : 'This event conflicts with existing events.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Event Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={watch('event_type')}
                onValueChange={(value) => setValue('event_type', value as EventType)}
              >
                <SelectTrigger>
                  <Type className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EventType.MEETING}>Meeting</SelectItem>
                  <SelectItem value={EventType.TASK}>Task</SelectItem>
                  <SelectItem value={EventType.PERSONAL}>Personal</SelectItem>
                  <SelectItem value={EventType.REMINDER}>Reminder</SelectItem>
                  <SelectItem value={EventType.APPOINTMENT}>Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as EventStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EventStatus.SCHEDULED}>Scheduled</SelectItem>
                  <SelectItem value={EventStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={EventStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={EventStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Recurrence Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="recurrence_type">Recurrence</Label>
              <Select
                value={watch('recurrence_type')}
                onValueChange={(value) => setValue('recurrence_type', value as RecurrenceType)}
              >
                <SelectTrigger>
                  <Repeat className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecurrenceType.NONE}>No recurrence</SelectItem>
                  <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                  <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                  <SelectItem value={RecurrenceType.YEARLY}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watch('recurrence_type') !== RecurrenceType.NONE && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="recurrence_interval">Every</Label>
                  <Input
                    id="recurrence_interval"
                    type="number"
                    min="1"
                    max="365"
                    {...register('recurrence_interval', { valueAsNumber: true })}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recurrence_end_date">End Date</Label>
                  <Input
                    id="recurrence_end_date"
                    type="date"
                    {...register('recurrence_end_date')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="recurrence_count">Or after</Label>
                  <Input
                    id="recurrence_count"
                    type="number"
                    min="1"
                    max="1000"
                    {...register('recurrence_count', { valueAsNumber: true })}
                    placeholder="occurrences"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || conflictChecking}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default EventForm;