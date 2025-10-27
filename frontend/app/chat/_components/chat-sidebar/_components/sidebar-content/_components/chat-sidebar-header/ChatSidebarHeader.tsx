import { Plus } from "lucide-react";
import { ChatSidebarHeaderProps } from "./chat-sidebar-header.types";

/**
 * Header component for the chat sidebar with "History" title and new conversation button
 */
export function ChatSidebarHeader({
  funds,
  onNewConversation,
}: ChatSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">History</p>
        <p className="text-xs text-gray-500">Resume past analyses</p>
      </div>
      <button
        onClick={onNewConversation}
        className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="New conversation"
        disabled={!funds.hasFunds}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
