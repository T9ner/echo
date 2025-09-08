/**
 * EventReminderManager Component - Manage event reminders
 * 
 * Features:
 * - Add/remove event reminders
 * - Multiple reminder times
 * - Different reminder methods
 * - Smart reminder suggestions
 */
import React, { useState, useCallback } from 'react';
import { Bell, Plus, Trash2, Clock, Mail, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { EventReminder, EventReminderCreate } from '@/types';
import { cn } from '@/lib/utils';

interface EventReminderManagerProps {
  eventId: string;
  eventTitle: string;
  eventStartTime: string;
  isOpen: boolean;
  onClose: () => void;
}

const REMINDER_PRESETS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

const REMINDER_METHODS = [
  { value: 'notification', label: 'Browser Notification', icon: Bell },
  { value: 'email', label: 'Email (Coming Soon)', icon: Mail, disabled: true },
  { value: 'sms', label: 'SMS (Coming Soon)', icon: Smartphone, disabled: true },
];

export function EventReminderManager({
  eventId,
  eventTitle,
  eventStartTime,
  isOpen,
  onClose
}: EventReminderManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [selectedMethod, setSelectedMethod] = useState('notification');
  
  const queryClient = useQueryClient();
  
  // Fetch event reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['event-reminders', eventId],
    queryFn: () => eventsApi.getEventReminders(eventId),
    enabled: isOpen,
  });
  
  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: (reminderData: EventReminderCreate) => 
      eventsApi.addReminder(eventId, reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-reminders', eventId] });
      setShowAddDialog(false);
    },
  });
  
  // Delete reminder mutation (we'll need to add this to the API)
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      // TODO: Implement delete reminder endpoint in backend
      throw new Error('Delete reminder not implemented yet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-reminders', eventId] });
    },
  });
  
  const handleAddReminder = useCallback(async () => {
    try {
      await addReminderMutation.mutateAsync({
        minutes_before: selectedMinutes,
        method: selectedMethod,
      });
    } catch (error) {
      console.error('Failed to add reminder:', error);
    }
  }, [addReminderMutation, selectedMinutes, selectedMethod]);
  
  const handleDeleteReminder = useCallback(async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteReminderMutation.mutateAsync(reminderId);
      } catch (error) {
        console.error('Failed to delete reminder:', error);
      }
    }
  }, [deleteReminderMutation]);
  
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
  
  const getReminderMethodIcon = (method: string) => {
    const methodConfig = REMINDER_METHODS.find(m => m.value === method);
    const IconComponent = methodConfig?.icon || Bell;
    return <IconComponent className="h-3 w-3" />;
  };
  
  const getReminderMethodLabel = (method: string): string => {
    const methodConfig = REMINDER_METHODS.find(m => m.value === method);
    return methodConfig?.label || method;
  };
  
  const getSmartSuggestions = (): number[] => {
    const eventDate = new Date(eventStartTime);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Suggest reminders based on how far away the event is
    if (hoursUntilEvent < 2) {
      return [5, 15]; // Short notice
    } else if (hoursUntilEvent < 24) {
      return [15, 60]; // Same day
    } else if (hoursUntilEvent < 168) { // Within a week
      return [60, 1440]; // Hours and day before
    } else {
      return [1440, 10080]; // Days and week before
    }
  };
  
  const smartSuggestions = getSmartSuggestions();
  const existingReminderTimes = reminders.map(r => r.minutes_before);
  const availableSuggestions = smartSuggestions.filter(time => 
    !existingReminderTimes.includes(time)
  );
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Event Reminders
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Event Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm">{eventTitle}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(eventStartTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
            
            {/* Existing Reminders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Current Reminders</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : reminders.length > 0 ? (
                <div className="space-y-2">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {getReminderMethodIcon(reminder.method)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {formatReminderTime(reminder.minutes_before)}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {getReminderMethodLabel(reminder.method)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {reminder.sent && (
                          <Badge variant="secondary" className="text-xs">
                            Sent
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reminders set</p>
                </div>
              )}
            </div>
            
            {/* Smart Suggestions */}
            {availableSuggestions.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Suggested Reminders</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.map((minutes) => (
                    <Button
                      key={minutes}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMinutes(minutes);
                        setShowAddDialog(true);
                      }}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {formatReminderTime(minutes)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Remind me</Label>
              <Select
                value={selectedMinutes.toString()}
                onValueChange={(value) => setSelectedMinutes(parseInt(value))}
              >
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  {getReminderMethodIcon(selectedMethod)}
                  <SelectValue className="ml-2" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_METHODS.map((method) => (
                    <SelectItem 
                      key={method.value} 
                      value={method.value}
                      disabled={method.disabled}
                    >
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedMethod !== 'notification' && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  This reminder method is coming soon
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddReminder}
              disabled={addReminderMutation.isPending}
            >
              {addReminderMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EventReminderManager;