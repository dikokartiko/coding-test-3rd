import { Loader2 } from "lucide-react";
import { ConversationItem } from "./_components/ConversationItem";
import { ConversationListProps } from "./conversation-list.types";

const renderLoadingState = () => (
  <div className="flex h-full items-center justify-center text-gray-500">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Loading history...
  </div>
);

const renderEmptyState = () => (
  <div className="p-4 text-sm text-gray-500">
    No conversations yet. Start a new chat to begin tracking history.
  </div>
);

const renderConversationList = (
  conversations: Array<{
    conversation_id: string;
    title?: string;
    last_message?: string;
    updated_at: string;
  }>,
  currentConversationId: string | undefined,
  onSelectConversation: (id: string) => Promise<void>,
  onDeleteConversation: (id: string) => Promise<void>
) => (
  <ul className="divide-y">
    {conversations.map((conversation) => (
      <ConversationItem
        key={conversation.conversation_id}
        conversation={conversation}
        isActive={currentConversationId === conversation.conversation_id}
        onSelect={onSelectConversation}
        onDelete={onDeleteConversation}
      />
    ))}
  </ul>
);

/**
 * Component to display the list of conversations with loading, empty, and populated states
 */
export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return renderLoadingState();
  }

  if (conversations.length === 0) {
    return renderEmptyState();
  }

  return renderConversationList(
    conversations,
    currentConversationId,
    onSelectConversation,
    onDeleteConversation
  );
}
