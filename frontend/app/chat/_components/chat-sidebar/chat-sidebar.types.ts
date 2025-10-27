import { ReactNode } from "react";

/**
 * Props interface for the ChatSidebar component
 *
 * This interface defines all the properties that the ChatSidebar component expects to receive.
 * It includes information about conversations, funds, and the callback for conversation selection.
 */
export interface ChatSidebarProps {
  /**
   * Conversation-related properties
   * Contains information about all conversations and conversation management functions
   */
  conversations: {
    /** Array of conversation summaries for display in the sidebar */
    conversations: Array<{
      /** Unique identifier for the conversation */
      conversation_id: string;
      /** Title of the conversation (optional) */
      title?: string;
      /** Preview of the last message in the conversation (optional) */
      last_message?: string;
      /** Timestamp of the last update to the conversation */
      updated_at: string;
    }>;
    /** ID of the currently active conversation */
    conversationId?: string;
    /** Loading state for the sidebar conversation list */
    sidebarLoading: boolean;
    /** Function to start a new conversation with an optional fund ID */
    startConversation: (fundId?: number) => Promise<string>;
    /** Function to handle selecting a conversation by its ID */
    handleConversationSelect: (id: string) => Promise<any>;
    /** Function to handle deleting a conversation by its ID */
    handleDeleteConversation: (id: string) => Promise<void>;
  };

  /**
   * Fund-related properties
   * Contains information about available funds for conversation context
   */
  funds: {
    /** Whether there are funds available */
    hasFunds: boolean;
    /** ID of the currently selected fund */
    selectedFundId?: number;
  };

  /**
   * Callback function for when a conversation is selected
   * This function is called when the user selects a conversation from the sidebar
   */
  onConversationSelect: (id: string) => Promise<void>;
}

/**
 * Props interface for the ConversationItem component
 *
 * This interface defines the properties for individual conversation items in the list
 */
export interface ConversationItemProps {
  /**
   * The conversation object containing its details
   */
  conversation: {
    /** Unique identifier for the conversation */
    conversation_id: string;
    /** Title of the conversation (optional) */
    title?: string;
    /** Preview of the last message in the conversation (optional) */
    last_message?: string;
    /** Timestamp of the last update to the conversation */
    updated_at: string;
  };

  /**
   * Whether this conversation is currently active/selected
   */
  isActive: boolean;

  /**
   * Callback function for when the conversation is selected
   */
  onSelect: (id: string) => void;

  /**
   * Callback function for when the conversation is deleted
   */
  onDelete: (id: string) => void;
}
