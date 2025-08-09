import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { ChatMessageInput, ChatResponse } from '@/types';
import { toast } from '@/hooks/use-toast';

// Query keys
export const chatKeys = {
  all: ['chat'] as const,
  history: () => [...chatKeys.all, 'history'] as const,
};

// Get chat history
export const useChatHistory = (limit?: number) => {
  return useQuery({
    queryKey: [...chatKeys.history(), limit],
    queryFn: () => chatApi.getChatHistory(limit),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageInput: ChatMessageInput) => chatApi.sendMessage(messageInput),
    onSuccess: (response) => {
      // Invalidate chat history to include new message
      queryClient.invalidateQueries({ queryKey: chatKeys.history() });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.response?.data?.message || "Failed to send message to ECHO",
        variant: "destructive",
      });
    },
  });
};

// Clear chat history mutation
export const useClearChatHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatApi.clearChatHistory(),
    onSuccess: () => {
      // Clear chat history from cache
      queryClient.setQueryData(chatKeys.history(), []);
      
      toast({
        title: "Chat history cleared",
        description: "All chat messages have been cleared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error clearing chat history",
        description: error.response?.data?.message || "Failed to clear chat history",
        variant: "destructive",
      });
    },
  });
};