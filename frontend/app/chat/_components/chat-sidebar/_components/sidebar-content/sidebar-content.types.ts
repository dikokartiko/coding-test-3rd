export interface SidebarContentProps {
  conversations: Array<{
    conversation_id: string;
    title?: string;
    last_message?: string;
    updated_at: string;
  }>;
  currentConversationId?: string;
  onSelectConversation: (id: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  isLoading: boolean;
  funds: {
    hasFunds: boolean;
    selectedFundId?: number;
  };
  onNewConversation: () => void;
}
