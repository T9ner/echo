/**
 * CalendarTest Component - Test the calendar components
 * 
 * This is a temporary component to test our calendar implementation
 * before integrating it into the main CalendarView
 */
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalendar } from '@/hooks/useCalendar';
import { CalendarGrid, EventList, EventForm, EventModal } from './index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventCreate, EventUpdate, EventWithReminders } from '@/types';

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function CalendarTestInner() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithReminders | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventWithReminders | null>(null);
  
  const calendar = useCalendar({
    initialView: 'month',
    autoRefresh: false, // Disable for testing
  });
  
  const handleCreateEvent = async (eventData: EventCreate) => {
    try {
      await calendar.createEvent(eventData);
      setShowEventForm(false);
      // Event created successfully
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };
  
  const handleUpdateEvent = async (eventData: EventUpdate) => {
    if (!editingEvent) return;
    
    try {
      await calendar.updateEvent(editingEvent.id, eventData);
      setEditingEvent(null);
      setShowEventForm(false);
      // Event updated successfully
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendar.deleteEvent(eventId);
      setShowEventModal(false);
      setSelectedEvent(null);
      // Event deleted successfully
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };
  
  const handleEventView = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  const handleEventEdit = (event: any) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };
  
  const handleDateSelect = (date: Date) => {
    calendar.selectDate(date);
    // Date selected
  };
  
  const handleCreateEventForDate = (date: Date) => {
    calendar.selectDate(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar Test</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
          >
            Create Event
          </Button>
          <Button
            variant="outline"
            onClick={calendar.goToToday}
          >
            Today
          </Button>
        </div>
      </div>
      
      {/* Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Current Date</div>
              <div className="text-muted-foreground">
                {calendar.currentDate.toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="font-medium">Selected Date</div>
              <div className="text-muted-foreground">
                {calendar.selectedDate?.toLocaleDateString() || 'None'}
              </div>
            </div>
            <div>
              <div className="font-medium">Total Events</div>
              <div className="text-muted-foreground">
                {calendar.events.length}
              </div>
            </div>
            <div>
              <div className="font-medium">Loading</div>
              <div className="text-muted-foreground">
                {calendar.isLoading ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {calendar.calendarMonth && (
            <CalendarGrid
              calendarMonth={calendar.calendarMonth}
              selectedDate={calendar.selectedDate}
              onDateSelect={handleDateSelect}
              onPreviousMonth={calendar.goToPreviousMonth}
              onNextMonth={calendar.goToNextMonth}
              onCreateEvent={handleCreateEventForDate}
              isLoading={calendar.isLoading}
            />
          )}
        </div>
        
        {/* Event List */}
        <div>
          <EventList
            events={calendar.events}
            onEventEdit={handleEventEdit}
            onEventDelete={handleDeleteEvent}
            onEventView={handleEventView}
            compact={true}
            title="Events"
          />
        </div>
      </div>
      
      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <EventForm
            event={editingEvent || undefined}
            initialDate={calendar.selectedDate || undefined}
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onCheckConflicts={calendar.checkConflicts}
            isLoading={calendar.isCreating || calendar.isUpdating}
          />
        </div>
      )}
      
      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEventEdit}
        onDelete={handleDeleteEvent}
        isLoading={calendar.isDeleting}
      />
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify({
                currentDate: calendar.currentDate,
                selectedDate: calendar.selectedDate,
                eventsCount: calendar.events.length,
                isLoading: calendar.isLoading,
                error: calendar.error?.message,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CalendarTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarTestInner />
    </QueryClientProvider>
  );
}

export default CalendarTest;