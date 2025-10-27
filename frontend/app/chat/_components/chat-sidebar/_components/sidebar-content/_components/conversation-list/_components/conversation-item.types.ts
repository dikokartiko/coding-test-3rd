export interface ConversationItemProps {
  conversation: {
    conversation_id: string;
    title?: string;
    last_message?: string;
    updated_at: string;
  };
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
