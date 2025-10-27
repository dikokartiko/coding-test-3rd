/**
 * Export the ChatSidebar component for use in chat layouts
 * The sidebar contains conversation history and controls for managing conversations
 */
export { ChatSidebar } from "./ChatSidebar";

/**
 * Export the ConversationItem component for use in conversation lists
 * This component represents a single conversation in the sidebar list
 */
import { ConversationItem } from "./_components/sidebar-content/_components/conversation-list/_components/ConversationItem";
export { ConversationItem };

/**
 * Export the type definitions for the chat sidebar components
 * These types define the interfaces for the props used by sidebar components
 */
export type {
  ChatSidebarProps,
  ConversationItemProps,
} from "./chat-sidebar.types";
