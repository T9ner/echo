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
    <div className="h-full flex flex-col bg-background">
      {/* Simple Header */}
      <div className="flex-shrink-0 p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Chat with ECHO
            </h1>
            <p className="text-muted-foreground text-sm">
              Your AI productivity assistant
            </p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <ChatHistory messages={messages} isLoading={isTyping} />

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected || isTyping}
      />
    </div>
  );
}
