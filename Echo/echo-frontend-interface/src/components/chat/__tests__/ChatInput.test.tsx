import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('renders input field and send button', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);
    
    expect(screen.getByPlaceholderText(/ask echo anything/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('shows quick prompts', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);
    
    expect(screen.getByText('Try asking:')).toBeInTheDocument();
    expect(screen.getByText('What should I focus on today?')).toBeInTheDocument();
    expect(screen.getByText('Help me prioritize my tasks')).toBeInTheDocument();
  });

  it('calls onSendMessage when send button is clicked', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText(/ask echo anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Hello ECHO');
    await user.click(sendButton);
    
    expect(onSendMessage).toHaveBeenCalledWith('Hello ECHO', true);
  });

  it('calls onSendMessage when Enter is pressed', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText(/ask echo anything/i);
    
    await user.type(input, 'Hello ECHO');
    await user.keyboard('{Enter}');
    
    expect(onSendMessage).toHaveBeenCalledWith('Hello ECHO', true);
  });

  it('does not send empty messages', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('shows context toggle', () => {
    render(<ChatInput onSendMessage={vi.fn()} />);
    
    expect(screen.getByText('Include my tasks & habits data')).toBeInTheDocument();
    expect(screen.getByText('Context enabled')).toBeInTheDocument();
  });

  it('can toggle context inclusion', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInput onSendMessage={onSendMessage} />);
    
    const checkbox = screen.getByRole('checkbox');
    const input = screen.getByPlaceholderText(/ask echo anything/i);
    
    // Uncheck context
    await user.click(checkbox);
    await user.type(input, 'Hello');
    await user.keyboard('{Enter}');
    
    expect(onSendMessage).toHaveBeenCalledWith('Hello', false);
  });

  it('shows character count when typing', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/ask echo anything/i);
    await user.type(input, 'Hello');
    
    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('handles suggestion clicks', async () => {
    const onSuggestionClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInput onSendMessage={vi.fn()} onSuggestionClick={onSuggestionClick} />);
    
    const suggestion = screen.getByText('What should I focus on today?');
    await user.click(suggestion);
    
    expect(onSuggestionClick).toHaveBeenCalledWith('What should I focus on today?');
  });
});