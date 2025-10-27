import { chatApi } from "@/lib/api";
import { ConversationSummary } from "../page.types";

/**
 * Service object that provides methods for interacting with chat-related API endpoints
 */
export const chatService = {
  /**
   * Loads all conversations for the current user
   * @returns Promise resolving to an array of conversation summaries
   * @throws Error if the API call fails
   */
  async loadConversations(): Promise<ConversationSummary[]> {
    try {
      const response = await chatApi.listConversations();
      return response;
    } catch (error) {
      console.error("Error loading conversations:", error);
      throw error;
    }
  },

  /**
   * Retrieves a specific conversation by its ID
   * @param conversationId - The unique identifier of the conversation to retrieve
   * @returns Promise resolving to the conversation data
   * @throws Error if the API call fails
   */
  async getConversation(conversationId: string) {
    try {
      const response = await chatApi.getConversation(conversationId);
      return response;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  },

  /**
   * Creates a new conversation optionally associated with a specific fund
   * @param fundId - Optional ID of the fund to associate with the conversation
   * @returns Promise resolving to the created conversation data
   * @throws Error if the API call fails
   */
  async createNewConversation(fundId?: number) {
    try {
      const response = await chatApi.createConversation(fundId);
      return response;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  /**
   * Deletes a conversation by its ID
   * @param conversationId - The unique identifier of the conversation to delete
   * @returns Promise resolving to the deletion response
   * @throws Error if the API call fails
   */
  async deleteConversation(conversationId: string) {
    try {
      const response = await chatApi.deleteConversation(conversationId);
      return response;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  /**
   * Sends a query to the chat API with optional context parameters
   * @param query - The user's query/question to send to the chat
   * @param fundId - Optional ID of the primary fund for context
   * @param conversationId - Optional ID of the conversation to continue
   * @param fundIds - Optional array of fund IDs for comparison queries
   * @returns Promise resolving to the chat response with answer and metadata
   * @throws Error if the API call fails
   */
  async queryChat(
    query: string,
    fundId?: number,
    conversationId?: string,
    fundIds?: number[]
  ) {
    try {
      const response = await chatApi.query(
        query,
        fundId,
        conversationId,
        fundIds
      );
      return response;
    } catch (error) {
      console.error("Error querying chat:", error);
      throw error;
    }
  },
};
