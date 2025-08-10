import { Bot, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
    isLoading?: boolean;
    error?: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (message.isLoading) {
    return (
      <div className="flex gap-3 items-start animate-fade-in">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="message-bubble inline-block bg-muted/50 rounded-2xl rounded-tl-md p-3 sm:p-4 border border-border/50 max-w-[85%] sm:max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">ECHO is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex gap-3 items-start animate-fade-in">
        <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1">
          <div className="message-bubble inline-block bg-destructive/5 border border-destructive/20 rounded-2xl rounded-tl-md p-3 sm:p-4 max-w-[85%] sm:max-w-md lg:max-w-lg">
            <p className="text-sm text-destructive leading-relaxed break-words">{message.error}</p>
            <p className="text-xs text-destructive/70 mt-2 opacity-70">
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 items-start animate-fade-in ${
      message.isUser ? 'flex-row-reverse' : ''
    }`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-primary/10 text-primary border border-primary/20'
      }`}>
        {message.isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 ${message.isUser ? 'flex justify-end' : ''}`}>
        <div className={`message-bubble inline-block rounded-2xl p-3 sm:p-4 shadow-sm ${
          message.isUser
            ? 'bg-primary text-primary-foreground rounded-tr-md max-w-[85%] sm:max-w-md lg:max-w-lg'
            : 'bg-muted/50 text-foreground rounded-tl-md border border-border/50 max-w-[85%] sm:max-w-md lg:max-w-2xl'
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed text-sm break-words hyphens-auto">
            {message.content}
          </p>
          
          {/* Timestamp */}
          <p className={`text-xs mt-2 opacity-70 ${
            message.isUser 
              ? 'text-primary-foreground/70 text-right' 
              : 'text-muted-foreground'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}