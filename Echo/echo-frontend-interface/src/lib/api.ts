import axios, { AxiosResponse } from 'axios';
import {
  Task,
  TaskCreate,
  TaskUpdate,
  Habit,
  HabitCreate,
  HabitLog,
  ChatMessageInput,
  ChatResponse,
  ProductivityAnalytics,
  HabitAnalytics,
  ProductivityInsights,
  Event,
  EventCreate,
  EventUpdate,
  EventWithReminders,
  EventList,
  EventFilter,
  MonthEventsResponse,
  EventConflictCheck,
  EventConflictResponse,
  EventReminder,
  EventReminderCreate
} from '@/types';

// Define missing filter types
interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
}

interface HabitFilters {
  frequency?: string;
  search?: string;
}

// Simple in-memory cache for GET requests
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  clearPattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache();

// Generate cache key from request config
function getCacheKey(method: string, url: string, params?: any): string {
  return `${method}:${url}:${JSON.stringify(params || {})}`;
}

// Create axios instance with base configuration and performance optimizations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 45000, // 45 seconds timeout for local AI models
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with caching and performance monitoring
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = getCacheKey('get', config.url || '', config.params);
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        // Return cached data as a resolved promise
        return Promise.reject({
          config,
          response: {
            data: cachedData,
            status: 200,
            statusText: 'OK (cached)',
            headers: {},
            config,
          },
          cached: true,
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with caching and performance monitoring
api.interceptors.response.use(
  (response: any) => {
    // Performance monitoring
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    if (duration > 2000) {
      console.warn(`Slow API request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
    }
    
    // Cache GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = getCacheKey('get', response.config.url || '', response.config.params);
      const ttl = response.config.url?.includes('/analytics') ? 600000 : 300000; // 10min for analytics, 5min for others
      apiCache.set(cacheKey, response.data, ttl);
    }
    
    return response;
  },
  (error: any) => {
    // Handle cached responses
    if (error.cached) {
      return Promise.resolve(error.response);
    }
    
    // Performance monitoring for errors
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    console.error(`API request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url} after ${duration}ms`, error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // Clear related cache on write operations that fail
    if (error.config?.method !== 'get' && error.response?.status >= 400) {
      const url = error.config?.url || '';
      if (url.includes('/tasks')) {
        apiCache.clearPattern('get:/tasks');
      } else if (url.includes('/habits')) {
        apiCache.clearPattern('get:/habits');
      } else if (url.includes('/analytics')) {
        apiCache.clearPattern('get:/analytics');
      } else if (url.includes('/events')) {
        apiCache.clearPattern('get:/events');
      }
    }
    
    return Promise.reject(error);
  }
);

// Cache management utilities
export const cacheUtils = {
  clear: () => apiCache.clear(),
  clearTasks: () => apiCache.clearPattern('get:/tasks'),
  clearHabits: () => apiCache.clearPattern('get:/habits'),
  clearAnalytics: () => apiCache.clearPattern('get:/analytics'),
  clearEvents: () => apiCache.clearPattern('get:/events'),
};

// Task API functions
export const taskApi = {
  // Get all tasks with optional filters
  getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.due_date_from) params.append('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params.append('due_date_to', filters.due_date_to);
    
    const response: AxiosResponse<Task[]> = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get single task by ID
  getTask: async (taskId: string): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create new task
  createTask: async (task: TaskCreate): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.post('/tasks', task);
    return response.data;
  },

  // Update existing task
  updateTask: async (taskId: string, task: TaskUpdate): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.put(`/tasks/${taskId}`, task);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
};

// Habit API functions
export const habitApi = {
  // Get all habits with optional filters
  getHabits: async (filters?: HabitFilters): Promise<Habit[]> => {
    const params = new URLSearchParams();
    if (filters?.frequency) params.append('frequency', filters.frequency);
    if (filters?.search) params.append('search', filters.search);
    
    const response: AxiosResponse<Habit[]> = await api.get(`/habits?${params.toString()}`);
    return response.data;
  },

  // Get single habit by ID
  getHabit: async (habitId: string): Promise<Habit> => {
    const response: AxiosResponse<Habit> = await api.get(`/habits/${habitId}`);
    return response.data;
  },

  // Create new habit
  createHabit: async (habit: HabitCreate): Promise<Habit> => {
    const response: AxiosResponse<Habit> = await api.post('/habits', habit);
    return response.data;
  },

  // Update existing habit
  updateHabit: async (habitId: string, habit: Partial<HabitCreate>): Promise<Habit> => {
    const response: AxiosResponse<Habit> = await api.put(`/habits/${habitId}`, habit);
    return response.data;
  },

  // Delete habit
  deleteHabit: async (habitId: string): Promise<void> => {
    await api.delete(`/habits/${habitId}`);
  },

  // Log habit completion
  logHabitCompletion: async (habitId: string, notes?: string): Promise<HabitLog> => {
    const response: AxiosResponse<HabitLog> = await api.post(`/habits/${habitId}/log`, { notes });
    return response.data;
  },

  // Get habit logs
  getHabitLogs: async (habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response: AxiosResponse<HabitLog[]> = await api.get(`/habits/${habitId}/logs?${params.toString()}`);
    return response.data;
  },
};

// Chat API functions
export const chatApi = {
  // Send message to ECHO AI
  sendMessage: async (messageInput: ChatMessageInput): Promise<ChatResponse> => {
    const response: AxiosResponse<ChatResponse> = await api.post('/chat/message', messageInput);
    return response.data;
  },

  // Get chat history
  getChatHistory: async (limit?: number): Promise<ChatResponse[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response: AxiosResponse<ChatResponse[]> = await api.get(`/chat/history?${params.toString()}`);
    return response.data;
  },

  // Clear chat history
  clearChatHistory: async (): Promise<void> => {
    await api.delete('/chat/history');
  },
};

// Analytics API functions
export const analyticsApi = {
  // Get productivity analytics (overview endpoint)
  getProductivityAnalytics: async (startDate: string, endDate: string): Promise<ProductivityAnalytics> => {
    const params = new URLSearchParams();
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    
    const response: AxiosResponse<ProductivityAnalytics> = await api.get(`/analytics/overview?${params.toString()}`);
    return response.data;
  },

  // Get habit analytics (use overview endpoint for now)
  getHabitAnalytics: async (habitId?: string): Promise<HabitAnalytics> => {
    // For now, return empty data since the backend doesn't have a separate habit analytics endpoint
    // that matches the expected HabitAnalytics type
    return {
      habit_id: habitId,
      completion_rate: 0,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      completion_by_day: []
    };
  },

  // Get productivity insights
  getProductivityInsights: async (): Promise<ProductivityInsights> => {
    const response: AxiosResponse<any> = await api.get(`/analytics/insights`);
    
    // Transform the backend response to match our ProductivityInsights type
    const insights = response.data || [];
    return {
      insights: insights.map((insight: any) => insight.description || '').filter(Boolean),
      recommendations: insights.map((insight: any) => insight.action_items || []).flat(),
      patterns: insights.map((insight: any) => ({
        type: insight.insight_type || 'general',
        description: insight.description || '',
        confidence: insight.confidence || 0
      }))
    };
  },
};

// Events/Calendar API functions
export const eventsApi = {
  // Get all events with optional filters and pagination
  getEvents: async (filters?: EventFilter, page: number = 1, perPage: number = 50): Promise<EventList> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.event_type) params.append('event_type', filters.event_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.task_id) params.append('task_id', filters.task_id);
    if (filters?.habit_id) params.append('habit_id', filters.habit_id);
    
    const response: AxiosResponse<EventList> = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  // Get single event by ID with reminders
  getEvent: async (eventId: string): Promise<EventWithReminders> => {
    const response: AxiosResponse<EventWithReminders> = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Create new event
  createEvent: async (event: EventCreate): Promise<Event> => {
    const response: AxiosResponse<Event> = await api.post('/events', event);
    // Clear events cache after creation
    apiCache.clearPattern('get:/events');
    return response.data;
  },

  // Update existing event
  updateEvent: async (eventId: string, event: EventUpdate): Promise<Event> => {
    const response: AxiosResponse<Event> = await api.put(`/events/${eventId}`, event);
    // Clear events cache after update
    apiCache.clearPattern('get:/events');
    return response.data;
  },

  // Delete event
  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}`);
    // Clear events cache after deletion
    apiCache.clearPattern('get:/events');
  },

  // Get events for a specific month
  getMonthEvents: async (year: number, month: number): Promise<MonthEventsResponse> => {
    const response: AxiosResponse<MonthEventsResponse> = await api.get(`/events/month/${year}/${month}`);
    return response.data;
  },

  // Check for event conflicts
  checkConflicts: async (conflictCheck: EventConflictCheck): Promise<EventConflictResponse> => {
    const response: AxiosResponse<EventConflictResponse> = await api.post('/events/conflicts', conflictCheck);
    return response.data;
  },

  // Create multiple events in bulk
  createBulkEvents: async (events: EventCreate[]): Promise<{ created_events: Event[]; failed_events: any[]; total_created: number; total_failed: number }> => {
    const response = await api.post('/events/bulk', { events });
    // Clear events cache after bulk creation
    apiCache.clearPattern('get:/events');
    return response.data;
  },

  // Get upcoming events
  getUpcomingEvents: async (limit: number = 10): Promise<Event[]> => {
    const response: AxiosResponse<Event[]> = await api.get(`/events/upcoming/list?limit=${limit}`);
    return response.data;
  },

  // Get event statistics by type
  getEventStats: async (): Promise<{ stats_by_type: Record<string, number>; total_events: number }> => {
    const response = await api.get('/events/stats/by-type');
    return response.data;
  },

  // Event reminders
  addReminder: async (eventId: string, reminder: EventReminderCreate): Promise<EventReminder> => {
    const response: AxiosResponse<EventReminder> = await api.post(`/events/${eventId}/reminders`, reminder);
    return response.data;
  },

  // Get event reminders
  getEventReminders: async (eventId: string): Promise<EventReminder[]> => {
    const response: AxiosResponse<EventReminder[]> = await api.get(`/events/${eventId}/reminders`);
    return response.data;
  },

  // Utility functions for date-based queries
  getEventsForDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    const filters: EventFilter = { start_date: startDate, end_date: endDate };
    const result = await eventsApi.getEvents(filters, 1, 1000); // Get all events in range
    return result.events;
  },

  // Get events for today
  getTodayEvents: async (): Promise<Event[]> => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    return eventsApi.getEventsForDateRange(startOfDay, endOfDay);
  },

  // Get events for current week
  getWeekEvents: async (): Promise<Event[]> => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
    
    return eventsApi.getEventsForDateRange(startOfWeek.toISOString(), endOfWeek.toISOString());
  },
};

// Health check
export const healthApi = {
  // Check API health
  checkHealth: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Convenience functions for useCalendar hook
export const fetchEvents = (filters?: EventFilter, page?: number, perPage?: number) => 
  eventsApi.getEvents(filters, page, perPage);

export const fetchMonthEvents = (year: number, month: number) => 
  eventsApi.getMonthEvents(year, month);

export const createEvent = (eventData: EventCreate) => 
  eventsApi.createEvent(eventData);

export const updateEvent = (eventId: string, eventData: EventUpdate) => 
  eventsApi.updateEvent(eventId, eventData);

export const deleteEvent = (eventId: string) => 
  eventsApi.deleteEvent(eventId);

export const checkEventConflicts = (conflictCheck: EventConflictCheck) => 
  eventsApi.checkConflicts(conflictCheck);

// Export the configured axios instance for custom requests
export default api;