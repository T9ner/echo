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

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 45000, // 45 seconds timeout for local AI models
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  // Get productivity analytics
  getProductivityAnalytics: async (startDate: string, endDate: string): Promise<ProductivityAnalytics> => {
    const params = new URLSearchParams();
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    
    const response: AxiosResponse<ProductivityAnalytics> = await api.get(`/analytics/productivity?${params.toString()}`);
    return response.data;
  },

  // Get habit analytics
  getHabitAnalytics: async (habitId?: string): Promise<HabitAnalytics> => {
    const params = new URLSearchParams();
    if (habitId) params.append('habit_id', habitId);
    
    const response: AxiosResponse<HabitAnalytics> = await api.get(`/analytics/habits?${params.toString()}`);
    return response.data;
  },

  // Get productivity insights
  getProductivityInsights: async (timeframe: string = 'week'): Promise<ProductivityInsights> => {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    
    const response: AxiosResponse<ProductivityInsights> = await api.get(`/analytics/insights?${params.toString()}`);
    return response.data;
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