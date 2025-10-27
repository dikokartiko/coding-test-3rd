import { cn } from "@/lib/utils";

export const getConversationItemClassNames = (isActive: boolean) =>
  cn(
    "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50/70",
    isActive && "bg-blue-50"
  );

export const handleSelectClick =
  (conversationId: string, onSelect: (id: string) => void) => () => {
    onSelect(conversationId);
  };

export const handleDeleteClick = (
  event: React.MouseEvent,
  conversationId: string,
  onDelete: (id: string) => void
) => {
  event.stopPropagation();
  onDelete(conversationId);
};

export const createConversationItemHandlers = (
  conversation: any,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void
) => {
  const selectClickHandler = handleSelectClick(
    conversation.conversation_id,
    onSelect
  );
  const deleteClickHandler = (event: React.MouseEvent) =>
    handleDeleteClick(event, conversation.conversation_id, onDelete);

  return { selectClickHandler, deleteClickHandler };
};
