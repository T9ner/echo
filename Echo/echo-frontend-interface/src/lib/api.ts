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
  ApiResponse,
  ApiError,
  TaskFilters,
  HabitFilters
} from '@/types';

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
  (config) => {
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
        console.log(`Cache hit for: ${config.url}`);
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
  (response) => {
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
  (error) => {
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
  getProductivityInsights: async (timeframe: string = 'week'): Promise<ProductivityInsights> => {
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

// Health check
export const healthApi = {
  // Check API health
  checkHealth: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export the configured axios instance for custom requests
export default api;