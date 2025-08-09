import { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  response_time_ms?: number;
  context_used?: string[];
  suggestions?: string[];
  isLoading?: boolean;
  error?: string;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  onCopyMessage?: (content: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
}

export function ChatHistory({
  messages,
  isLoading = false,
  onCopyMessage,
  onRetryMessage,
  onSuggestionClick,
  onClearHistory,
  onExportHistory
}: ChatHistoryProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const messageDate = new Date(message.timestamp);
    let dateKey: string;

    if (isToday(messageDate)) {
      dateKey = 'Today';
    } else if (isYesterday(messageDate)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(messageDate, 'MMMM d, yyyy');
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const handleRetry = (messageId: string) => {
    onRetryMessage?.(messageId);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome to ECHO
          </h3>
          <p className="text-gray-600 mb-4">
            Your AI productivity assistant is ready to help! Ask me about your tasks, habits, 
            or anything related to your productivity.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Try asking:</p>
            <ul className="space-y-1">
              <li>"What should I focus on today?"</li>
              <li>"Help me prioritize my tasks"</li>
              <li>"How are my habits going?"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with Actions */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="text-sm text-gray-600">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportHistory}
              className="text-gray-600 hover:text-gray-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 mb-6">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                  {dateKey}
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {dateMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onCopyMessage={onCopyMessage}
                    onRetry={() => handleRetry(message.id)}
                    onSuggestionClick={onSuggestionClick}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <ChatMessage
              message={{
                id: 'loading',
                content: '',
                isUser: false,
                timestamp: new Date().toISOString(),
                isLoading: true,
              }}
            />
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}