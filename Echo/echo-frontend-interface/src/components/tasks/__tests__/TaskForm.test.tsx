import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../TaskForm';

// Mock the hooks
vi.mock('@/hooks/useTasks', () => ({
  useCreateTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('TaskForm', () => {
  it('renders form fields correctly', () => {
    render(<TaskForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/due date/i)).toBeInTheDocument();
  });

  it('shows validation error for empty title', async () => {
    const user = userEvent.setup();
    render(<TaskForm />);
    
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('allows filling out the form', async () => {
    const user = userEvent.setup();
    render(<TaskForm />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'New Test Task');
    await user.type(descriptionInput, 'This is a test description');
    
    expect(titleInput).toHaveValue('New Test Task');
    expect(descriptionInput).toHaveValue('This is a test description');
  });

  it('opens as dialog when trigger is provided', () => {
    const trigger = <button>Open Form</button>;
    render(<TaskForm trigger={trigger} />);
    
    expect(screen.getByText('Open Form')).toBeInTheDocument();
    
    // Form should not be visible initially
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('shows priority options correctly', async () => {
    const user = userEvent.setup();
    render(<TaskForm />);
    
    const prioritySelect = screen.getByRole('combobox');
    await user.click(prioritySelect);
    
    await waitFor(() => {
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });
  });
});