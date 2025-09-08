/**
 * RecurringEventManager Component - Advanced recurring event functionality
 * 
 * Features:
 * - Manage recurring event series
 * - Edit single occurrence vs entire series
 * - Exception handling for recurring events
 * - Smart recurrence suggestions
 */
import React, { useState, useCallback } from 'react';
import { Repeat, Calendar, Edit, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Event, EventUpdate, RecurrenceType } from '@/types';
import { cn } from '@/lib/utils';

interface RecurringEventManagerProps {
  event: Event;
  onUpdateEvent: (eventId: string, eventData: EventUpdate, updateType: 'single' | 'series') => Promise<void>;
  onDeleteEvent: (eventId: string, deleteType: 'single' | 'series') => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

type ActionType = 'edit' | 'delete';
type UpdateScope = 'single' | 'series';

export function RecurringEventManager({
  event,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
  isOpen
}: RecurringEventManagerProps) {
  const [actionType, setActionType] = useState<ActionType>('edit');
  const [updateScope, setUpdateScope] = useState<UpdateScope>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isRecurring = event.is_recurring && event.recurrence_type !== RecurrenceType.NONE;
  
  const handleAction = useCallback(async () => {
    if (!isRecurring) return;
    
    setIsProcessing(true);
    try {
      if (actionType === 'edit') {
        // For editing, we'll close this dialog and let the parent handle the edit
        // The parent should open the EventForm with the appropriate scope
        onClose();
      } else if (actionType === 'delete') {
        await onDeleteEvent(event.id, updateScope);
        onClose();
      }
    } catch (error) {
      console.error(`Failed to ${actionType} recurring event:`, error);
    } finally {
      setIsProcessing(false);
    }
  }, [actionType, updateScope, event.id, onDeleteEvent, onClose, isRecurring]);
  
  const getRecurrenceDescription = (): string => {
    const { recurrence_type, recurrence_interval } = event;
    const interval = recurrence_interval || 1;
    
    switch (recurrence_type) {
      case RecurrenceType.DAILY:
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case RecurrenceType.WEEKLY:
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case RecurrenceType.MONTHLY:
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case RecurrenceType.YEARLY:
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      default:
        return 'Custom recurrence';
    }
  };
  
  const getActionDescription = (): string => {
    if (actionType === 'edit') {
      return updateScope === 'single' 
        ? 'Edit only this occurrence of the event'
        : 'Edit this and all future occurrences in the series';
    } else {
      return updateScope === 'single'
        ? 'Delete only this occurrence of the event'
        : 'Delete this and all future occurrences in the series';
    }
  };
  
  const getActionWarning = (): string | null => {
    if (actionType === 'delete' && updateScope === 'series') {
      return 'This will permanently delete the entire recurring series. This action cannot be undone.';
    }
    return null;
  };
  
  if (!isRecurring) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Event
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Event Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      {getRecurrenceDescription()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Selection */}
          <div>
            <Label className="text-sm font-medium">What would you like to do?</Label>
            <RadioGroup
              value={actionType}
              onValueChange={(value) => setActionType(value as ActionType)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit" className="flex items-center gap-2 cursor-pointer">
                  <Edit className="h-4 w-4" />
                  Edit this event
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="flex items-center gap-2 cursor-pointer text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete this event
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Scope Selection */}
          <div>
            <Label className="text-sm font-medium">Apply changes to:</Label>
            <RadioGroup
              value={updateScope}
              onValueChange={(value) => setUpdateScope(value as UpdateScope)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer">
                  <div>
                    <div className="font-medium">This event only</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.start_time).toLocaleDateString()}
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="series" id="series" />
                <Label htmlFor="series" className="cursor-pointer">
                  <div>
                    <div className="font-medium">This and future events</div>
                    <div className="text-xs text-muted-foreground">
                      All events in this recurring series
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Description */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {getActionDescription()}
            </p>
          </div>
          
          {/* Warning */}
          {getActionWarning() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {getActionWarning()}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={isProcessing}
            variant={actionType === 'delete' ? 'destructive' : 'default'}
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {actionType === 'edit' ? (
                  <Edit className="h-4 w-4 mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {actionType === 'edit' ? 'Edit Event' : 'Delete Event'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RecurringEventManager;