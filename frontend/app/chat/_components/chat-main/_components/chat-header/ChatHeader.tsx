import { MessageSquare } from "lucide-react";
import { ChatHeaderProps } from "./chat-header.types";

/**
 * Chat header component displaying conversation title and fund context
 */
export function ChatHeader({ conversationTitle, fundName }: ChatHeaderProps) {
  return (
    <header className="border-b px-6 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
        Fund analysis chat
      </p>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-90">
          {conversationTitle}
        </h1>
      </div>
      <p className="text-sm text-gray-500">
        {fundName ? `Focused on ${fundName}` : "No funds available"}
      </p>
    </header>
  );
}
