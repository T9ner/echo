import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string, includeContext?: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(40); // Initial height

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height (min 40px, max 6 lines ≈ 144px)
      const minHeight = 40;
      const maxHeight = 144; // 6 lines * 24px line height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), true);
      setMessage('');
      // Reset textarea height
      setTextareaHeight(40);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="px-3 sm:px-4 py-3">
      <div className="max-w-4xl mx-auto w-full">
        <div 
          className="flex items-end gap-3 bg-background border border-border/50 rounded-2xl p-3 shadow-lg"
          style={{ minHeight: '56px' }}
        >
            {/* Attachment button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 mb-1"
              disabled={disabled}
              title="Attach file (coming soon)"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Auto-growing textarea container */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask ECHO anything..."
                disabled={disabled}
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 chat-input-textarea"
                style={{
                  height: `${textareaHeight}px`,
                  lineHeight: '1.5',
                  padding: '8px 0',
                  minHeight: '40px',
                  maxHeight: '144px',
                  overflowY: textareaHeight >= 144 ? 'auto' : 'hidden',
                }}
                rows={1}
              />
            </div>
            
            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              size="sm"
              className="h-10 w-10 p-0 rounded-full shrink-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 mb-1"
            >
              <Send className="h-4 w-4" />
            </Button>
        </div>
        
        {/* Helper text */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-muted-foreground">
            Enter to send • Shift+Enter for new line
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {disabled && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Thinking...
              </span>
            )}
            {message.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {message.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}