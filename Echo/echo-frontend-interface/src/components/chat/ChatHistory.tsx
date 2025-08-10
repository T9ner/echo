import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  isLoading?: boolean;
  error?: string;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatHistory({ messages, isLoading = false }: ChatHistoryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive with smooth animation
  useEffect(() => {
    const scrollToBottom = () => {
      if (bottomRef.current && scrollContainerRef.current) {
        const scrollContainer = scrollContainerRef.current;
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 150;
        
        // Auto-scroll if user is near the bottom or it's the first message
        if (isNearBottom || messages.length <= 1) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ 
              behavior: "smooth",
              block: "end"
            });
          }, 50); // Small delay to ensure DOM is updated
        }
      }
    };

    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden chat-scroll scroll-smooth"
    >
      <div className="px-3 sm:px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <ChatMessage
              message={{
                id: "loading",
                content: "",
                isUser: false,
                timestamp: new Date().toISOString(),
                isLoading: true,
              }}
            />
          )}

          {/* Scroll anchor - invisible element at bottom with extra space */}
          <div ref={bottomRef} className="h-8" />
        </div>
      </div>
    </div>
  );
}
