import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatHistory } from './chat/ChatHistory';
import { ChatInput } from './chat/ChatInput';
import { ChatStatus } from './chat/ChatStatus';
import { useSendMessage, useClearChatHistory } from '@/hooks/useChat';
import { useApiHealth } from '@/hooks/useApiHealth';
import { toast } from '@/hooks/use-toast';

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

// Local storage key & versioning in case schema changes later
const CHAT_STORAGE_KEY = 'echo_chat_messages_v1';

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<number>();
  const hasLoadedFromStorage = useRef(false);

  const sendMessageMutation = useSendMessage();
  const clearHistoryMutation = useClearChatHistory();
  const { data: healthStatus, isError: healthError } = useApiHealth();

  // Load messages from localStorage (persistence across refreshes)
  useEffect(() => {
    if (hasLoadedFromStorage.current) return; // guard against React StrictMode double invoke
    hasLoadedFromStorage.current = true;

    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed: Message[] = JSON.parse(stored);
        // Basic validation (array & objects with required fields)
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore parse errors – fall back to welcome message
    }

    // Fallback welcome message if no history
    const welcomeMessage: Message = {
      id: 'welcome',
      content: "Hello! I'm ECHO, your personal AI productivity assistant. I can help you with tasks, habits, scheduling, and productivity insights. What would you like to work on today?",
      isUser: false,
      timestamp: new Date().toISOString(),
      suggestions: [
        'What should I focus on today?',
        'Help me prioritize my tasks',
        'How are my habits going?',
        'Show me my productivity patterns'
      ]
    };
    setMessages([welcomeMessage]);
  }, []);

  // Persist messages whenever they change (omit transient error/loading only entries?)
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return; // wait until initial load
    try {
      // Limit stored history to last 200 messages to avoid unbounded growth
      const toStore = messages.slice(-200);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Storage might be full – silently ignore
    }
  }, [messages]);

  const handleSendMessage = async (messageContent: string, includeContext = true) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const startTime = Date.now();
      const response = await sendMessageMutation.mutateAsync({
        message: messageContent,
        include_context: includeContext,
      });

      const responseTime = Date.now() - startTime;
      setLastResponseTime(responseTime);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
        response_time_ms: response.response_time_ms || responseTime,
        context_used: response.context_data ? Object.keys(response.context_data) : [],
        suggestions: [], // Backend doesn't provide suggestions yet, will be empty for now
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: '',
        isUser: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to get response from ECHO. Please try again.',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetryMessage = (messageId: string) => {
    // Find the user message that preceded the failed message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.isUser) {
        // Remove the error message and retry
        setMessages(prev => prev.filter(m => m.id !== messageId));
        handleSendMessage(previousMessage.content);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      clearHistoryMutation.mutate(undefined, {
        onSuccess: () => {
          setMessages([]);
          try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* ignore */ }
          toast({
            title: 'Chat history cleared',
            description: 'All messages have been removed.',
          });
        }
      });
    }
  };

  const handleExportHistory = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      messages: messages.map(m => ({
        content: m.content,
        isUser: m.isUser,
        timestamp: m.timestamp,
        response_time_ms: m.response_time_ms,
        context_used: m.context_used,
        suggestions: m.suggestions,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echo-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Chat history exported",
      description: "Your chat history has been downloaded as a JSON file.",
    });
  };

  const handleCopyMessage = (content: string) => {
    toast({
      title: "Message copied",
      description: "The message has been copied to your clipboard.",
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const isConnected = !healthError && !!healthStatus;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-brand-gradient-soft/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center overflow-hidden border border-white/10">
              <img src="/echo-logo.svg" alt="ECHO" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gradient-brand">Chat with ECHO</h1>
              <p className="text-gray-600 text-sm">Your local AI productivity companion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isTyping}
              className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTyping ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* API Health Warning */}
        {healthError && (
          <Alert variant="destructive">
            <AlertDescription>
              Unable to connect to ECHO. Some features may not work properly.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Status Bar */}
      <ChatStatus
        isConnected={isConnected}
        isTyping={isTyping}
        error={healthError ? 'Connection to ECHO failed' : null}
        responseTime={lastResponseTime}
      />

      {/* Chat History */}
      <ChatHistory
        messages={messages}
        isLoading={isTyping}
        onCopyMessage={handleCopyMessage}
        onRetryMessage={handleRetryMessage}
        onSuggestionClick={handleSuggestionClick}
        onClearHistory={handleClearHistory}
        onExportHistory={handleExportHistory}
      />

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected || isTyping}
        suggestions={messages.length > 0 ? messages[messages.length - 1]?.suggestions : []}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}