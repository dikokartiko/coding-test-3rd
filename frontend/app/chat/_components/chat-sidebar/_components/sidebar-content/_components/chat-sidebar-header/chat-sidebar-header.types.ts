export interface ChatSidebarHeaderProps {
  funds: {
    hasFunds: boolean;
    selectedFundId?: number;
  };
  onNewConversation: () => void;
}
