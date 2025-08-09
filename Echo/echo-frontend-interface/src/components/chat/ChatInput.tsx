import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputProps {
  onSendMessage: (message: string, includeContext?: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Ask ECHO anything about your productivity...",
  suggestions = [],
  onSuggestionClick
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), includeContext);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    onSuggestionClick?.(suggestion);
    // Focus the textarea after clicking suggestion
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleVoiceInput = () => {
    // Voice input functionality would be implemented here
    setIsRecording(!isRecording);
    // For now, just toggle the recording state
  };

  const quickPrompts = [
    "What should I focus on today?",
    "Help me prioritize my tasks",
    "Show me my productivity patterns",
    "How can I improve my habits?",
    "What's my completion rate this week?",
  ];

  return (
    <div className="border-t bg-white p-4 space-y-3">
      {/* Quick Prompts */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Quick prompts:</span>
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs h-7 px-3"
              disabled={disabled}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {/* Default Quick Prompts */}
      {suggestions.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Try asking:</span>
          {quickPrompts.slice(0, 3).map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(prompt)}
              className="text-xs h-7 px-3"
              disabled={disabled}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-12 py-3"
            rows={1}
          />
          
          {/* Voice Input Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  disabled={disabled}
                  className={`absolute right-2 top-2 h-8 w-8 p-0 ${
                    isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Stop recording' : 'Voice input (coming soon)'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="h-11 px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Context Toggle and Options */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600">Include my tasks & habits data</span>
          </label>
          
          {includeContext && (
            <Badge variant="secondary" className="text-xs">
              Context enabled
            </Badge>
          )}
        </div>

        <div className="text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Character Count */}
      {message.length > 0 && (
        <div className="flex justify-end">
          <span className={`text-xs ${
            message.length > 1000 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {message.length}/1000
          </span>
        </div>
      )}
    </div>
  );
}