import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { HabitItem } from '../HabitItem';
import { Habit, HabitFrequency } from '@/types';

// Mock the hooks
vi.mock('@/hooks/useHabits', () => ({
  useLogHabitCompletion: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteHabit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const mockHabit: Habit = {
  id: '1',
  name: 'Drink Water',
  description: 'Drink 8 glasses of water daily',
  frequency: HabitFrequency.DAILY,
  target_count: 8,
  current_streak: 5,
  longest_streak: 12,
  created_at: '2024-01-01T00:00:00Z',
};

describe('HabitItem', () => {
  it('renders habit information correctly', () => {
    render(<HabitItem habit={mockHabit} />);
    
    expect(screen.getByText('Drink Water')).toBeInTheDocument();
    expect(screen.getByText('Drink 8 glasses of water daily')).toBeInTheDocument();
    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  it('shows completion button when not completed today', () => {
    render(<HabitItem habit={mockHabit} todayCompleted={false} />);
    
    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
  });

  it('shows completed status when completed today', () => {
    render(<HabitItem habit={mockHabit} todayCompleted={true} />);
    
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
  });

  it('displays streak information', () => {
    render(<HabitItem habit={mockHabit} />);
    
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('Best: 12')).toBeInTheDocument();
  });

  it('shows target count information', () => {
    render(<HabitItem habit={mockHabit} />);
    
    expect(screen.getByText('8x per daily')).toBeInTheDocument();
  });
});