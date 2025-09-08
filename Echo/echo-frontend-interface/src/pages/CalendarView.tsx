/**
 * CalendarView - Main calendar page component
 * 
 * This component provides a complete calendar interface with:
 * - Multiple view types (month, week, day, agenda)
 * - Event creation, editing, and deletion
 * - Real-time updates and conflict detection
 * - Integration with tasks and habits
 * - Responsive design for all screen sizes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronLeft, ChevronRight, Plus, Grid3X3, List, Clock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendar, CalendarView as ViewType } from '@/hooks/useCalendar';
import { Event, EventCreate, EventUpdate } from '@/types';
import { CalendarGrid } from '@/components/calendar/CalendarGridSimple';

const CalendarView: React.FC = () => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  
  const {
    currentView,
    currentDate,
    selectedEvent,
    isLoading,
    events,
    eventsCount,
    goToToday,
    goToPrevious,
    goToNext,
    setView,
    selectEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getViewTitle,
    refreshEvents
  } = useCalendar({
    initialView: 'month',
    autoRefresh: true
  });

  const handleCreateEvent = async (eventData: EventCreate) => {
    try {
      await createEvent(eventData);
      setShowEventForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (eventData: EventUpdate) => {
    if (!selectedEvent) return;
    
    try {
      await updateEvent(selectedEvent.id, eventData);
      setShowEventModal(false);
      selectEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteEvent(selectedEvent.id);
      setShowEventModal(false);
      selectEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleEventClick = (event: Event) => {
    selectEvent(event);
    setShowEventModal(true);
  };

  const viewButtons = [
    { type: 'month' as ViewType, label: 'Month', icon: Calendar },
    { type: 'week' as ViewType, label: 'Week', icon: CalendarDays },
    { type: 'day' as ViewType, label: 'Day', icon: Clock },
    { type: 'agenda' as ViewType, label: 'Agenda', icon: List },
  ];

  const renderCalendarContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'month':
        return (
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onDateClick={(date) => {
              // Handle date selection for event creation
              setShowEventForm(true);
            }}
            className="p-6"
          />
        );
      case 'week':
      case 'day':
        // Week and day views - simplified for now
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {currentView === 'week' ? 'Week View' : 'Day View'}
            </h3>
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found for this period</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEventClick(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(event.start_time).toLocaleDateString()} 
                              {!event.all_day && ` at ${new Date(event.start_time).toLocaleTimeString()}`}
                            </span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary">{event.event_type}</Badge>
                          <Badge variant={event.status === 'completed' ? 'default' : 'outline'}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 'agenda':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Agenda View</h3>
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found for this period</p>
                <p className="text-sm">Click the "New Event" button to create your first event</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEventClick(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(event.start_time).toLocaleDateString()} 
                              {!event.all_day && ` at ${new Date(event.start_time).toLocaleTimeString()}`}
                            </span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary">{event.event_type}</Badge>
                          <Badge variant={event.status === 'completed' ? 'default' : 'outline'}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Calendar</h1>
              <Badge variant="secondary" className="text-xs">
                {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEventForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Event</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEvents}
                disabled={isLoading}
              >
                <span className="hidden sm:inline">Refresh</span>
                <Grid3X3 className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          </div>
          
          {/* Navigation and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="px-3"
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold ml-4">
                {getViewTitle()}
              </div>
            </div>
            
            {/* View Switcher */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              {viewButtons.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant={currentView === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView(type)}
                  className={cn(
                    "text-xs px-3 py-1.5",
                    currentView === type && "shadow-sm"
                  )}
                >
                  <Icon className="h-3 w-3 mr-1.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Separator />

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-y-auto">
          {renderCalendarContent()}
        </CardContent>
      </div>

      {/* Placeholder for modals - will implement these later */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-[90vw]">
            <CardHeader>
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{selectedEvent.description || 'No description'}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowEventModal(false)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteEvent}>Delete</Button>
                <Button size="sm" variant="outline" onClick={() => setShowEventModal(false)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-[90vw]">
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Event form will be implemented in Phase 3</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setShowEventForm(false);
                  selectEvent(null);
                }}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
