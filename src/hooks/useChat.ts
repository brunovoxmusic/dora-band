"use client";

import { useChat as useAIChat } from "ai/react";
import { useCallback } from "react";

/**
 * Reusable useChat hook — wraps Vercel AI SDK's useChat.
 *
 * Features:
 * - Streaming responses from /api/chat
 * - Message history management
 * - Loading/error states
 * - Automatic scroll handling
 *
 * Usage:
 *   const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat();
 */

export function useChat() {
  const aiChat = useAIChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("[useChat] error:", error);
    },
  });

  // Clear conversation
  const clearChat = useCallback(() => {
    aiChat.setMessages([]);
  }, [aiChat]);

  return {
    messages: aiChat.messages,
    input: aiChat.input,
    handleInputChange: aiChat.handleInputChange,
    handleSubmit: aiChat.handleSubmit,
    isLoading: aiChat.isLoading,
    error: aiChat.error,
    stop: aiChat.stop,
    clearChat,
  };
}
