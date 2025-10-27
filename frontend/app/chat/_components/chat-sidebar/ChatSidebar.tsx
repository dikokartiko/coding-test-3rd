import { SidebarContent } from "./_components/sidebar-content/SidebarContent";
import { ChatSidebarProps } from "./chat-sidebar.types";
import { createChatSidebarHandlers } from "./_utils/chat-sidebar-handlers";

/**
 * Chat sidebar component displaying conversation history
 *
 * This component provides a sidebar interface for managing conversations.
 * It displays a list of existing conversations and allows users to start new
 * conversations, switch between existing ones, or delete conversations.
 * The component uses the SidebarContent component to render the actual UI
 * and handles all the interaction logic through the createChatSidebarHandlers function.
 *
 * @param {ChatSidebarProps} props - The properties for configuring the sidebar
 * @returns {JSX.Element} The chat sidebar UI
 */
export function ChatSidebar({
  conversations,
  funds,
  onConversationSelect,
}: ChatSidebarProps) {
  const {
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
  } = createChatSidebarHandlers(conversations, funds, onConversationSelect);

  return (
    <aside className="rounded-2xl border-gray-10 bg-white shadow-sm">
      <SidebarContent
        conversations={conversations.conversations}
        currentConversationId={conversations.conversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={conversations.sidebarLoading}
        funds={funds}
        onNewConversation={handleNewConversation}
      />
    </aside>
  );
}
