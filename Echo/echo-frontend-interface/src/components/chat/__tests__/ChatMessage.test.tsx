import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  const mockMessage = {
    id: '1',
    content: 'Hello, this is a test message',
    isUser: false,
    timestamp: '2024-01-01T12:00:00Z',
    response_time_ms: 500,
    context_used: ['tasks', 'habits'],
    suggestions: ['Tell me more', 'What else?'],
  };

  it('renders AI message correctly', () => {
    render(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('• 500ms')).toBeInTheDocument();
  });

  it('renders user message correctly', () => {
    const userMessage = { ...mockMessage, isUser: true };
    render(<ChatMessage message={userMessage} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    // User messages should have different styling
    const messageContent = screen.getByText('Hello, this is a test message').closest('div');
    expect(messageContent).toHaveClass('bg-blue-500');
  });

  it('shows context used for AI messages', () => {
    render(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('Context used:')).toBeInTheDocument();
    expect(screen.getByText('tasks')).toBeInTheDocument();
    expect(screen.getByText('habits')).toBeInTheDocument();
  });

  it('shows suggestions for AI messages', () => {
    render(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('Suggested follow-ups:')).toBeInTheDocument();
    expect(screen.getByText('Tell me more')).toBeInTheDocument();
    expect(screen.getByText('What else?')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const loadingMessage = { ...mockMessage, isLoading: true };
    render(<ChatMessage message={loadingMessage} />);
    
    expect(screen.getByText('ECHO is thinking...')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const errorMessage = { ...mockMessage, error: 'Connection failed' };
    const onRetry = vi.fn();
    
    render(<ChatMessage message={errorMessage} onRetry={onRetry} />);
    
    expect(screen.getByText('Failed to get response')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('calls onSuggestionClick when suggestion is clicked', () => {
    const onSuggestionClick = vi.fn();
    render(<ChatMessage message={mockMessage} onSuggestionClick={onSuggestionClick} />);
    
    const suggestion = screen.getByText('Tell me more');
    fireEvent.click(suggestion);
    expect(onSuggestionClick).toHaveBeenCalledWith('Tell me more');
  });
});