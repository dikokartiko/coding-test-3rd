/**
 * Chat module public API exports
 *
 * This module exports all the public types, services, hooks, components, and utilities
 * for the chat functionality. It provides a clean interface for consuming the chat module.
 */

// Types
export type {
  Message,
  ConversationSummary,
  FundOption,
  ChatState,
  MetricsData,
} from "./page.types";

// Services
export { chatService } from "./_services";

// Hooks
export { useConversations, useMessages, useFunds, useChatUI } from "./_hooks";

// Components
export { EmptyState } from "./_components/chat-main/_components/messages-display/_components/empty-state";
export { MessageBubble } from "./_components/chat-main/_components/messages-display/_components/message-bubble";
export { MetricsPanel } from "./_components/chat-main/_components/messages-display/_components/message-bubble/_components";
export { ChatSidebar } from "./_components/chat-sidebar";
export { ChatMain } from "./_components/chat-main";
export { ChatHeader } from "./_components/chat-main/_components/chat-header";
export { FundSelectors } from "./_components/chat-main/_components/fund-selectors";
export { MessagesDisplay } from "./_components/chat-main/_components/messages-display";
export { ChatInputForm } from "./_components/chat-main/_components/chat-input-form";

// Utils
export { deserializeMessages } from "./_utils";
