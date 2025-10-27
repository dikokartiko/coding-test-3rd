import { ChatSidebarProps } from "../chat-sidebar.types";

/**
 * Creates handler functions for the chat sidebar component
 *
 * This utility function encapsulates the logic for handling various sidebar events
 * such as creating new conversations, selecting existing conversations, and deleting
 * conversations. It takes the necessary dependencies and returns the appropriate
 * handler functions.
 *
 * @param {any} conversations - The conversations state and management functions
 * @param {any} funds - The funds state and selection functions
 * @param {(id: string) => Promise<void>} onConversationSelect - Callback for when a conversation is selected
 * @returns {Object} An object containing the handler functions for sidebar events
 */
export const createChatSidebarHandlers = (
  conversations: any,
  funds: any,
  onConversationSelect: (id: string) => Promise<void>
) => {
  /**
   * Handles the creation of a new conversation
   *
   * This function initiates a new conversation using the currently selected fund.
   * It calls the startConversation function from the conversations object with
   * the selected fund ID.
   */
  const handleNewConversation = () => {
    conversations.startConversation(funds.selectedFundId);
  };

  /**
   * Handles the selection of an existing conversation
   *
   * This function is called when a user selects a conversation from the list.
   * It calls the onConversationSelect callback to update the main chat interface
   * with the selected conversation's content.
   *
   * @param {string} id - The ID of the conversation to select
   */
  const handleSelectConversation = async (id: string) => {
    await onConversationSelect(id);
  };

  /**
   * Handles the deletion of a conversation
   *
   * This function removes a conversation from the list of available conversations.
   * It calls the handleDeleteConversation function from the conversations object
   * with the ID of the conversation to delete.
   *
   * @param {string} id - The ID of the conversation to delete
   */
  const handleDeleteConversation = async (id: string) => {
    await conversations.handleDeleteConversation(id);
  };

  return {
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
  };
};
