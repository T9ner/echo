import { format } from 'date-fns';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatResponse } from '@/types';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
    response_time_ms?: number;
    context_used?: string[];
    suggestions?: string[];
    isLoading?: boolean;
    error?: string;
  };
  onCopyMessage?: (content: string) => void;
  onRetry?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessage({ 
  message, 
  onCopyMessage, 
  onRetry, 
  onSuggestionClick 
}: ChatMessageProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopyMessage?.(message.content);
  };

  if (message.isLoading) {
    return (
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg p-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">ECHO is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <Card className="border-red-200 bg-red-50 max-w-3xl">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-red-800 font-medium">Failed to get response</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="text-red-600 hover:text-red-700 h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
              <p className="text-sm text-red-700">{message.error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-6 ${message.isUser ? 'justify-end' : ''}`}>
      {!message.isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div className={`flex-1 ${message.isUser ? 'flex justify-end' : ''}`}>
        <div className={`max-w-3xl ${message.isUser ? 'order-1' : ''}`}>
          {/* Message Content */}
          <div
            className={`rounded-lg p-4 ${
              message.isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed m-0">
                {message.content}
              </p>
            </div>
          </div>

          {/* Message Metadata */}
          <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${
            message.isUser ? 'justify-end' : ''
          }`}>
            <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
            
            {message.response_time_ms && (
              <span>• {message.response_time_ms}ms</span>
            )}
            
            {!message.isUser && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-6 px-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Context Used (for AI messages) */}
          {!message.isUser && message.context_used && message.context_used.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Context used:</p>
              <div className="flex flex-wrap gap-1">
                {message.context_used.map((context, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {context}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions (for AI messages) */}
          {!message.isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="text-xs h-7 px-3 text-gray-600 hover:text-gray-900"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {message.isUser && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 order-2">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}