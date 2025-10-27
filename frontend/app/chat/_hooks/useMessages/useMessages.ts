import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "@/lib/api";
import { deserializeMessages } from "./_utils/formatting";
import { Message } from "../../page.types";

/**
 * Hook for managing messages and conversation history
 * @returns Object containing message state and handler functions
 */
export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Loads conversation history when conversation ID changes
   */
  const fetchConversation = useCallback(async (id: string) => {
    const conversation = await chatApi.getConversation(id);
    return conversation;
  }, []);

  const loadConversationHistory = useCallback(
    async (id: string) => {
      setHistoryLoading(true);
      try {
        const conversation = await fetchConversation(id);
        // Handle empty conversations (no messages) gracefully
        const messages = conversation.messages
          ? deserializeMessages(conversation.messages)
          : [];
        setMessages(messages);
        return conversation;
      } catch (error: any) {
        console.error(error);
        // If conversation doesn't exist (404), clear messages
        if (error?.response?.status === 404) {
          setMessages([]);
        }
        throw error;
      } finally {
        setHistoryLoading(false);
      }
    },
    [fetchConversation]
  );

  // Load conversation history when conversation ID changes
  useEffect(() => {
    if (!conversationId) {
      // Clear messages when no conversation is selected
      setMessages([]);
      return;
    }
    loadConversationHistory(conversationId).catch((error) => {
      // Error is already handled in loadConversationHistory
      // Just prevent unhandled promise rejection
      console.error("Failed to load conversation:", error);
    });
  }, [conversationId, loadConversationHistory]);

  /**
   * Auto-scroll to bottom when messages change
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Creates a user message and adds it to the messages array
   * @param content - The message content
   * @returns The created user message
   */
  const createUserMessage = useCallback((content: string) => {
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    return userMessage;
  }, []);

  /**
   * Creates an assistant message and adds it to the messages array
   * @param content - The message content
   * @param sources - Optional sources array
   * @param metrics - Optional metrics data
   * @returns The created assistant message
   */
  const createAssistantMessage = useCallback(
    (content: string, sources?: any[], metrics?: any) => {
      const assistantMessage: Message = {
        role: "assistant",
        content,
        sources,
        metrics,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    },
    []
  );

  /**
   * Creates an error message and adds it to the messages array
   * @param error - The error message
   */
  const createErrorMessage = useCallback((error: string) => {
    const errorMessage: Message = {
      role: "assistant",
      content: `Sorry, I encountered an error: ${error}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  }, []);

  /**
   * Clears all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    historyLoading,
    messagesEndRef,
    setMessages,
    loadConversationHistory,
    scrollToBottom,
    createUserMessage,
    createAssistantMessage,
    createErrorMessage,
    clearMessages,
  };
}
