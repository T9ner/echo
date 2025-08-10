import { Bot, User } from 'lucide-react';


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
  if (message.isLoading) {
    return (
      <div className="flex gap-4 items-start">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="bg-muted rounded-2xl p-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
      <div className="flex gap-4 items-start">
        <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 max-w-2xl">
            <p className="text-sm text-destructive">{message.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 items-start ${message.isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {message.isUser ? (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {/* Message Content */}
      <div className="flex-1 max-w-2xl">
        <div className={`rounded-2xl p-4 ${
          message.isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted text-foreground'
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}