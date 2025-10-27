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

// Hooks
export { useConversations, useMessages, useFunds, useChatUI } from "./_hooks";

// Components
export { ChatSidebar } from "./_components/chat-sidebar";
export { ChatMain } from "./_components/chat-main";
