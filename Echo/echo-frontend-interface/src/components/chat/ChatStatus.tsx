import { Wifi, WifiOff, Bot, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ChatStatusProps {
  isConnected: boolean;
  isTyping?: boolean;
  error?: string | null;
  onRetryConnection?: () => void;
  responseTime?: number;
}

export function ChatStatus({ 
  isConnected, 
  isTyping = false, 
  error, 
  onRetryConnection,
  responseTime 
}: ChatStatusProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mx-4 mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRetryConnection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryConnection}
              className="ml-2"
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b text-xs">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-green-700">Connected to ECHO</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-700">Disconnected</span>
          </>
        )}
        
        {responseTime && (
          <Badge variant="secondary" className="text-xs">
            {responseTime}ms
          </Badge>
        )}
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-center gap-2 text-blue-600">
          <Bot className="h-3 w-3" />
          <span>ECHO is typing...</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {/* API Status */}
      {!isTyping && (
        <div className="flex items-center gap-2 text-gray-500">
          <span>Powered by GPT-4</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}