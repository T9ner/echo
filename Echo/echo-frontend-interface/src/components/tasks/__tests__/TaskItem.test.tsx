import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { TaskItem } from '../TaskItem';
import { Task, TaskStatus, TaskPriority } from '@/types';

// Mock the hooks
vi.mock('@/hooks/useTasks', () => ({
  useUpdateTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  due_date: '2024-12-31T23:59:59Z',
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TaskItem', () => {
  it('renders task information correctly', () => {
    render(<TaskItem task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
  });

  it('shows due date when present', () => {
    render(<TaskItem task={mockTask} />);
    
    expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
  });

  it('shows completed task with strikethrough', () => {
    const completedTask = {
      ...mockTask,
      status: TaskStatus.COMPLETED,
      completed_at: '2024-01-15T10:00:00Z',
    };
    
    render(<TaskItem task={completedTask} />);
    
    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      due_date: '2020-01-01T00:00:00Z', // Past date
    };
    
    render(<TaskItem task={overdueTask} />);
    
    // Should show alert triangle for overdue
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
  });

  it('opens edit mode when edit button is clicked', async () => {
    render(<TaskItem task={mockTask} />);
    
    // Click the more options button
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);
    
    // Click edit option
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    // Should show edit form
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test task')).toBeInTheDocument();
  });

  it('shows task details when showDetails is true', () => {
    const taskWithLongDescription = {
      ...mockTask,
      description: 'This is a very long description that would normally be truncated but should be shown in full when showDetails is true',
    };
    
    render(<TaskItem task={taskWithLongDescription} showDetails={true} />);
    
    expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
  });
});