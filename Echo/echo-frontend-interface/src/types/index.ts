// Core data types for ECHO AI Assistant

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom'
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  target_count: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
}

export interface HabitCreate {
  name: string;
  description?: string;
  frequency: HabitFrequency;
  target_count?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  context_data?: Record<string, unknown>;
  created_at: string;
  response_time_ms?: number;
}

export interface ChatMessageInput {
  message: string;
  include_context?: boolean;
  stream_response?: boolean;
}

export interface ChatResponse {
  id: string;
  message: string;
  response: string;
  response_time_ms?: number;
  created_at: string;
  context_data?: Record<string, unknown>;
}

export interface ProductivityAnalytics {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  average_completion_time: number;
  productivity_score: number;
  most_productive_hours: number[];
  task_completion_by_day: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}

export interface HabitAnalytics {
  habit_id?: string;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_by_day: Array<{
    date: string;
    completed: boolean;
    streak_day: number;
  }>;
}

export interface ProductivityInsights {
  insights: string[];
  recommendations: string[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  request_id: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiError {
  validation_errors: ValidationError[];
}

// UI State types
export type ActiveTab = 'main' | 'tasks' | 'habits' | 'calendar' | 'chat' | 'analytics';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export interface HabitFilters {
  frequency?: HabitFrequency;
  search?: string;
}

// Calendar integration types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  task_id?: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  task_id?: string;
}