import { useState, useEffect, useRef } from "react";
import { ChatHistory } from "./chat/ChatHistory";
import { ChatInput } from "./chat/ChatInput";

import { useSendMessage } from "@/hooks/useChat";
import { useApiHealth } from "@/hooks/useApiHealth";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  error?: string;
}

// Local storage key & versioning in case schema changes later
const CHAT_STORAGE_KEY = "echo_chat_messages_v1";

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasLoadedFromStorage = useRef(false);

  const sendMessageMutation = useSendMessage();
  const { isError: healthError } = useApiHealth();

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
      id: "welcome",
      content:
        "Hello! I'm ECHO, your AI productivity assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toISOString(),
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

  const handleSendMessage = async (
    messageContent: string,
    includeContext = true
  ) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        message: messageContent,
        include_context: includeContext,
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "",
        isUser: false,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Failed to get response from ECHO. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const isConnected = !healthError;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden relative">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Chat with ECHO
            </h1>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Online' : 'Offline'} • AI productivity assistant
            </p>
          </div>
        </div>
      </div>

      {/* Chat History - Scrollable area with bottom padding for fixed input */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-32">
        <ChatHistory messages={messages} isLoading={isTyping} />
      </div>
        
      {/* Chat Input - Fixed at bottom of viewport */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isTyping}
        />
      </div>
    </div>
  );
}
