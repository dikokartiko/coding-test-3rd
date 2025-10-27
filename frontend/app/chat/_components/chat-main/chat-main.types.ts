import { ReactNode } from "react";

/**
 * Props interface for the ChatMain component
 *
 * This interface defines all the properties that the ChatMain component expects to receive.
 * It's organized into logical sections for conversations, messages, funds, and UI state.
 * Each section contains the necessary data and functions for that specific aspect of the chat.
 */
export interface ChatMainProps {
  /**
   * Conversation-related properties
   * Contains information about the current conversation context
   */
  conversations: {
    /** The title of the current conversation */
    conversationTitle: string;
  };

  /**
   * Messages-related properties
   * Contains the message history and related functionality
   */
  messages: {
    /** Array of messages in the current conversation */
    messages: any[];
    /** Loading state for conversation history */
    historyLoading: boolean;
    /** Reference to the end of the messages container for scrolling */
    messagesEndRef: React.RefObject<HTMLDivElement>;
  };

  /**
   * Fund-related properties
   * Contains information about available funds and fund selection
   */
  funds: {
    /** Whether there are funds available for selection */
    hasFunds: boolean;
    /** ID of the currently selected primary fund */
    selectedFundId?: number;
    /** Array of available fund options for selection */
    fundOptions: Array<{
      id: number;
      name: string;
    }>;
    /** Function to get a fund name by its ID */
    fundName: (id?: number) => string | undefined;
    /** Array of fund IDs selected for comparison */
    comparisonIds: number[];
    /** Currently selected fund in the comparison picker */
    comparisonPicker: number | "";
    /** Array of available funds for comparison */
    availableComparisonFunds: Array<{
      id: number;
      name: string;
    }>;
    /** Function to set the selected primary fund ID */
    setSelectedFundId: (id?: number) => void;
    /** Function to set the comparison picker value */
    setComparisonPicker: (value: number | "") => void;
    /** Function to handle adding a fund to comparison */
    handleAddComparison: () => void;
    /** Function to handle removing a fund from comparison */
    handleRemoveComparison: (id: number) => void;
  };

  /**
   * UI-related properties
   * Contains state and functions for managing the user interface
   */
  ui: {
    /** Current input text in the message input field */
    input: string;
    /** Loading state for ongoing operations */
    loading: boolean;
    /** Error message to display to the user */
    errorMessage: string | null;
    /** Whether the current input is valid for submission */
    hasValidInput: boolean;
    /** Function to update the input text */
    setInput: (value: string) => void;
  };

  /**
   * Form submission handler
   * Function to handle form submission (typically sending a new message)
   */
  onSubmit: (e: React.FormEvent) => Promise<void>;

  /**
   * Optional children elements
   * Additional content that can be rendered within the ChatMain component
   */
  children?: ReactNode;
}
