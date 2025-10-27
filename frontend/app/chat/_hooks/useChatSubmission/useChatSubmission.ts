import { useCallback } from "react";
import { chatApi } from "@/lib/api";

// Import the hook functions to get their return types
import { useConversations } from "../useConversations/useConversations";
import { useMessages } from "../useMessages/useMessages";
import { useFunds } from "../useFunds/useFunds";
import { useChatUI } from "../useChatUI/useChatUI";

// Define types based on the actual return types of the hooks
type UseConversationsReturn = ReturnType<typeof useConversations>;
type UseMessagesReturn = ReturnType<typeof useMessages>;
type UseFundsReturn = ReturnType<typeof useFunds>;
type UseChatUIReturn = ReturnType<typeof useChatUI>;

interface UseChatSubmissionParams {
  conversations: UseConversationsReturn;
  messages: UseMessagesReturn;
  funds: UseFundsReturn;
  ui: UseChatUIReturn;
}

/**
 * Hook for managing chat submission logic
 * @param conversations - Conversations hook return value
 * @param messages - Messages hook return value
 * @param funds - Funds hook return value
 * @param ui - UI hook return value
 * @returns Object containing submission handler function
 */
export function useChatSubmission({
  conversations,
  messages,
  funds,
  ui,
}: UseChatSubmissionParams) {
  /**
   * Handles form submission for sending a chat message
   * @param e - The form event
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ui.hasValidInput || ui.loading || !funds.hasFunds) return;

      ui.clearError();
      ui.setLoading(true);
      let activeConversationId = conversations.conversationId;

      try {
        if (!activeConversationId) {
          activeConversationId = await conversations.startConversation(
            funds.selectedFundId
          );
        }

        const userMessage = messages.createUserMessage(ui.input);
        ui.setInput("");

        const comparisonPayload =
          funds.comparisonIds.length > 1 ? funds.comparisonIds : undefined;
        const resolvedFundId = funds.selectedFundId ?? funds.comparisonIds[0];

        const response = await chatApi.query(
          userMessage.content,
          resolvedFundId,
          activeConversationId,
          comparisonPayload
        );

        messages.createAssistantMessage(
          response.answer,
          response.sources,
          response.metrics
        );

        conversations.setConversationId(
          response.conversation_id || activeConversationId
        );
        conversations.loadConversations();
      } catch (error: any) {
        ui.setErrorMessage(error?.response?.data?.detail || error.message);
        messages.createErrorMessage(
          error?.response?.data?.detail || error.message
        );
      } finally {
        ui.setLoading(false);
      }
    },
    [conversations, messages, funds, ui]
  );

  /**
   * Handles selecting a conversation from the sidebar
   * @param id - The ID of the conversation to select
   */
  const handleConversationSelect = useCallback(
    async (id: string) => {
      try {
        await conversations.handleConversationSelectWithMessages(
          id,
          messages.setMessages
        );
      } catch (error: any) {
        ui.setErrorMessage(
          error?.response?.data?.detail || "Unable to load conversation"
        );
      }
    },
    [conversations, messages, ui]
  );

  return {
    handleSubmit,
    handleConversationSelect,
  };
}
