/**
 * useCalendar Hook - Custom hook for calendar state management
 * 
 * This hook provides comprehensive calendar functionality including:
 * - Event CRUD operations
 * - Date navigation and view management
 * - Event filtering and search
 * - Real-time updates
 * - Conflict detection
 * - Integration with tasks and habits
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { 
  Event, 
  EventCreate, 
  EventUpdate, 
  EventFilter, 
  EventReminder,
  EventConflictCheck,
  EventConflictResponse
} from '@/types';

// Types
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface UseCalendarOptions {
  initialView?: CalendarView;
  initialDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseCalendarReturn {
  // State
  currentView: CalendarView;
  currentDate: Date;
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  
  // Events data
  events: Event[];
  eventsCount: number;
  
  // Navigation
  goToToday: () => void;
  goToDate: (date: Date) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  setView: (view: CalendarView) => void;
  
  // Event operations
  createEvent: (event: EventCreate) => Promise<Event>;
  updateEvent: (id: string, event: EventUpdate) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  selectEvent: (event: Event | null) => void;
  
  // Filtering and search
  filters: EventFilter;
  setFilters: (filters: EventFilter) => void;
  clearFilters: () => void;
  
  // Utilities
  getEventsForDate: (date: Date) => Event[];
  getEventsForDateRange: (start: Date, end: Date) => Event[];
  checkConflicts: (check: EventConflictCheck) => Promise<EventConflictResponse>;
  refreshEvents: () => void;
  
  // View helpers
  getViewTitle: () => string;
  getVisibleDateRange: () => { start: Date; end: Date };
}

export const useCalendar = (options: UseCalendarOptions = {}): UseCalendarReturn => {
  const {
    initialView = 'month',
    initialDate = new Date(),
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const queryClient = useQueryClient();
  
  // State
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFiltersState] = useState<EventFilter>({});
  const [error, setError] = useState<string | null>(null);

  // Calculate date range for current view
  const visibleDateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (currentView) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(currentDate.getDate() - currentDate.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 30); // 30 days ahead
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, currentView]);

  // Fetch events query
  const {
    data: eventsData,
    isLoading,
    refetch: refreshEvents
  } = useQuery({
    queryKey: ['events', visibleDateRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (visibleDateRange.start) {
        params.append('start_date', visibleDateRange.start.toISOString());
      }
      if (visibleDateRange.end) {
        params.append('end_date', visibleDateRange.end.toISOString());
      }
      if (filters.event_type) {
        params.append('event_type', filters.event_type);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.task_id) {
        params.append('task_id', filters.task_id);
      }
      if (filters.habit_id) {
        params.append('habit_id', filters.habit_id);
      }

      const response = await api.get(`/events?${params.toString()}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const events = useMemo(() => eventsData?.events || [], [eventsData]);
  const eventsCount = eventsData?.total || 0;

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventCreate) => {
      const response = await api.post('/events', eventData);
      return response.data;
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      return newEvent;
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create event",
        variant: "destructive",
      });
      throw err;
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventUpdate }) => {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      return updatedEvent;
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update event",
        variant: "destructive",
      });
      throw err;
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete event",
        variant: "destructive",
      });
      throw err;
    }
  });

  // Navigation functions
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(new Date(date));
  }, []);

  const goToPrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() - 30);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const goToNext = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() + 30);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const setView = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  // Event operations
  const createEvent = useCallback(async (eventData: EventCreate): Promise<Event> => {
    return createEventMutation.mutateAsync(eventData);
  }, [createEventMutation]);

  const updateEvent = useCallback(async (id: string, eventData: EventUpdate): Promise<Event> => {
    return updateEventMutation.mutateAsync({ id, data: eventData });
  }, [updateEventMutation]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    return deleteEventMutation.mutateAsync(id);
  }, [deleteEventMutation]);

  const selectEvent = useCallback((event: Event | null) => {
    setSelectedEvent(event);
  }, []);

  // Filtering functions
  const setFilters = useCallback((newFilters: EventFilter) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  // Utility functions
  const getEventsForDate = useCallback((date: Date): Event[] => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      
      if (event.all_day) {
        const eventDate = new Date(eventStart);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === targetDate.getTime();
      }
      
      return eventStart < nextDate && eventEnd >= targetDate;
    });
  }, [events]);

  const getEventsForDateRange = useCallback((start: Date, end: Date): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return eventStart < end && eventEnd >= start;
    });
  }, [events]);

  const checkConflicts = useCallback(async (check: EventConflictCheck): Promise<EventConflictResponse> => {
    try {
      const response = await api.post('/events/conflicts', check);
      return response.data;
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Error",
        description: "Failed to check for conflicts",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  // View helpers
  const getViewTitle = useCallback((): string => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (currentView) {
      case 'day':
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
        } else {
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
      }
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        break;
      case 'agenda':
        return 'Agenda';
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  }, [currentDate, currentView]);

  const getVisibleDateRange = useCallback(() => visibleDateRange, [visibleDateRange]);

  // Clear error when data changes
  useEffect(() => {
    if (eventsData && error) {
      setError(null);
    }
  }, [eventsData, error]);

  return {
    // State
    currentView,
    currentDate,
    selectedEvent,
    isLoading,
    error,
    
    // Events data
    events,
    eventsCount,
    
    // Navigation
    goToToday,
    goToDate,
    goToPrevious,
    goToNext,
    setView,
    
    // Event operations
    createEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
    
    // Filtering and search
    filters,
    setFilters,
    clearFilters,
    
    // Utilities
    getEventsForDate,
    getEventsForDateRange,
    checkConflicts,
    refreshEvents,
    
    // View helpers
    getViewTitle,
    getVisibleDateRange,
  };
};

export default useCalendar;
