import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { HabitForm } from '../HabitForm';

// Mock the hooks
vi.mock('@/hooks/useHabits', () => ({
  useCreateHabit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('HabitForm', () => {
  it('renders form fields correctly', () => {
    render(<HabitForm />);
    
    expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(screen.getByText(/target count/i)).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<HabitForm />);
    
    const submitButton = screen.getByRole('button', { name: /create habit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('allows filling out the form', async () => {
    const user = userEvent.setup();
    render(<HabitForm />);
    
    const nameInput = screen.getByLabelText(/habit name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(nameInput, 'Morning Exercise');
    await user.type(descriptionInput, '30 minutes of exercise');
    
    expect(nameInput).toHaveValue('Morning Exercise');
    expect(descriptionInput).toHaveValue('30 minutes of exercise');
  });

  it('shows frequency options correctly', async () => {
    const user = userEvent.setup();
    render(<HabitForm />);
    
    const frequencySelect = screen.getByRole('combobox');
    await user.click(frequencySelect);
    
    await waitFor(() => {
      expect(screen.getByText('Daily - Every day')).toBeInTheDocument();
      expect(screen.getByText('Weekly - Once per week')).toBeInTheDocument();
      expect(screen.getByText('Custom - Flexible schedule')).toBeInTheDocument();
    });
  });

  it('shows frequency guide information', () => {
    render(<HabitForm />);
    
    expect(screen.getByText('Frequency Guide:')).toBeInTheDocument();
    expect(screen.getByText(/Daily.*Track completion every day/)).toBeInTheDocument();
    expect(screen.getByText(/Weekly.*Track completion once per week/)).toBeInTheDocument();
    expect(screen.getByText(/Custom.*Flexible tracking/)).toBeInTheDocument();
  });
});