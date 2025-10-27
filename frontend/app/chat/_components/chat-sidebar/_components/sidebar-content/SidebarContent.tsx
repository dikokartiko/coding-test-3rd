import { ChatSidebarHeader } from "./_components/chat-sidebar-header/ChatSidebarHeader";
import { ConversationList } from "./_components/conversation-list/ConversationList";
import type { SidebarContentProps } from "./sidebar-content.types";

/**
 * Main content component for the chat sidebar that orchestrates header and conversation list
 */
export function SidebarContent({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading,
  funds,
  onNewConversation,
}: SidebarContentProps) {
  return (
    <>
      <ChatSidebarHeader funds={funds} onNewConversation={onNewConversation} />
      <div className="h-[calc(100vh-14rem)] overflow-y-auto">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
