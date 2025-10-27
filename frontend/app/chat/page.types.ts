/**
 * Represents a message in the chat conversation
 */
export interface Message {
  /** The role of the message sender - either 'user' or 'assistant' */
  role: "user" | "assistant";
  /** The content/text of the message */
  content: string;
  /** Optional array of source references used in generating the response */
  sources?: any[];
  /** Optional metrics data related to the message content */
  metrics?: any;
  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Represents a summary of a conversation in the sidebar
 */
export interface ConversationSummary {
  /** Unique identifier for the conversation */
  conversation_id: string;
  /** Optional fund ID associated with the conversation */
  fund_id?: number;
  /** Optional title for the conversation */
  title?: string;
  /** Optional preview of the last message in the conversation */
  last_message?: string;
  /** Timestamp of the last update to the conversation */
  updated_at: string;
}

/**
 * Represents a fund option for selection in the chat interface
 */
export interface FundOption {
  /** Unique identifier for the fund */
  id: number;
  /** Display name of the fund */
  name: string;
}

/**
 * Represents the complete state of the chat interface
 */
export interface ChatState {
  /** Array of messages in the current conversation */
  messages: Message[];
  /** Current input text in the message input field */
  input: string;
  /** Loading state for ongoing operations */
  loading: boolean;
  /** ID of the currently active conversation */
  conversationId?: string;
  /** Array of all conversations for the sidebar */
  conversations: ConversationSummary[];
  /** Loading state for the sidebar conversation list */
  sidebarLoading: boolean;
  /** Loading state for conversation history */
  historyLoading: boolean;
  /** Array of available fund options */
  fundOptions: FundOption[];
  /** ID of the currently selected primary fund */
  selectedFundId?: number;
  /** Array of fund IDs selected for comparison */
  comparisonIds: number[];
  /** Currently selected fund in the comparison picker */
  comparisonPicker: number | "";
  /** Error message to display to the user */
  errorMessage: string | null;
}

/**
 * Represents metrics data that can be displayed in the chat
 */
export interface MetricsData {
  /** Optional comparison data between multiple funds */
  comparison?: any[];
  /** Optional custom metrics key-value pairs */
  custom_metrics?: Record<string, any>;
  /** Additional metrics properties */
  [key: string]: any;
}

/**
 * Represents a single entry in fund comparison data
 */
export interface ComparisonEntry {
  /** ID of the fund */
  fund_id: number;
  /** Optional name of the fund */
  fund_name?: string;
  /** Metrics data for the fund */
  metrics: {
    /** Distributed to Paid-In Capital ratio */
    dpi?: number;
    /** Internal Rate of Return */
    irr?: number;
    /** Paid-In Capital */
    pic?: number;
    /** Total distributions amount */
    total_distributions?: number;
  };
}
