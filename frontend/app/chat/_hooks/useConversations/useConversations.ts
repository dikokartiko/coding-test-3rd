import { useCallback, useEffect, useState } from "react";
import { chatApi } from "@/lib/api";
import { ConversationSummary } from "../../page.types";

/**
 * Hook for managing conversation list and operations
 * @returns Object containing conversation state and handler functions
 */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [sidebarLoading, setSidebarLoading] = useState<boolean>(true);

  /**
   * Loads all conversations from the API
   */
  const loadConversations = useCallback(async () => {
    setSidebarLoading(true);
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
    } catch (error) {
      console.error(error);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Set initial conversation ID if none is selected
  useEffect(() => {
    if (!conversationId && conversations.length > 0) {
      setConversationId(conversations[0].conversation_id);
    }
  }, [conversationId, conversations]);

  /**
   * Creates a new conversation and sets it as the active conversation
   * @param fundId - Optional ID of the fund to associate with the conversation
   * @returns Promise resolving to the new conversation ID
   */
  const createNewConversation = useCallback(async (fundId?: number) => {
    const conversation = await chatApi.createConversation(fundId);
    return conversation;
  }, []);

  const startConversation = useCallback(
    async (fundId?: number) => {
      const conversation = await createNewConversation(fundId);
      setConversationId(conversation.conversation_id);
      loadConversations();
      return conversation.conversation_id;
    },
    [createNewConversation, loadConversations]
  );

  /**
   * Handles selecting a conversation from the sidebar
   * @param id - The ID of the conversation to select
   */
  const selectConversation = useCallback(async (id: string) => {
    const conversation = await chatApi.getConversation(id);
    return conversation;
  }, []);

  const handleConversationSelect = useCallback(
    async (id: string) => {
      if (id === conversationId) return;
      try {
        const conversation = await selectConversation(id);
        setConversationId(id);
        return conversation;
      } catch (error: any) {
        console.error(error);
        // If conversation doesn't exist, reload conversations list
        if (error?.response?.status === 404) {
          loadConversations();
        }
        throw error;
      }
    },
    [conversationId, selectConversation, loadConversations]
  );

  /**
   * Handles deleting a conversation
   * @param id - The ID of the conversation to delete
   */
  const deleteConversation = useCallback(async (id: string) => {
    await chatApi.deleteConversation(id);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);

        // If the deleted conversation was the active one, clear the active conversation ID
        if (id === conversationId) {
          setConversationId(undefined);
        }

        // Remove the deleted conversation from the local state immediately
        setConversations((prevConversations) =>
          prevConversations.filter((conv) => conv.conversation_id !== id)
        );

        // Reload the conversations list to ensure we have the latest data
        await loadConversations();

        // If we deleted the active conversation and there are still conversations left,
        // select the first one in the updated list
        if (id === conversationId) {
          setConversations((currentConversations) => {
            const remainingConversations = currentConversations.filter(
              (conv) => conv.conversation_id !== id
            );
            if (remainingConversations.length > 0) {
              // Select the first remaining conversation
              setConversationId(remainingConversations[0].conversation_id);
            }
            return remainingConversations;
          });
        }
      } catch (error: any) {
        console.error("Failed to delete conversation:", error);
        // Reload conversations list to ensure UI is in sync with server
        loadConversations();
      }
    },
    [conversationId, deleteConversation, loadConversations]
  );

  /**
   * Gets the currently active conversation object
   */
  const activeConversation = conversations.find(
    (conv) => conv.conversation_id === conversationId
  );

  /**
   * Gets the title of the current conversation
   */
  const conversationTitle =
    activeConversation?.title || "Untitled Conversation";

  return {
    conversations,
    conversationId,
    sidebarLoading,
    setConversationId,
    loadConversations,
    startConversation,
    handleConversationSelect,
    handleDeleteConversation,
    activeConversation,
    conversationTitle,
  };
}
