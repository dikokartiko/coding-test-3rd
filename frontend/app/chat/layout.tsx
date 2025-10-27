"use client";

import { ReactNode } from "react";
import { ChatSidebar } from "./_components/chat-sidebar";
import { ChatMain } from "./_components/chat-main";
import {
  useConversations,
  useMessages,
  useFunds,
  useChatUI,
  useChatSubmission,
} from "./_hooks";

export default function ChatLayout({ children }: { children: ReactNode }) {
  // Initialize all hooks at layout level
  const conversations = useConversations();
  const messages = useMessages(conversations.conversationId);
  const funds = useFunds();
  const ui = useChatUI();
  const { handleSubmit, handleConversationSelect } = useChatSubmission({
    conversations,
    messages,
    funds,
    ui,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ChatSidebar
        conversations={conversations}
        funds={funds}
        onConversationSelect={handleConversationSelect}
      />
      <ChatMain
        conversations={conversations}
        messages={messages}
        funds={funds}
        ui={ui}
        onSubmit={handleSubmit}
      >
        {children}
      </ChatMain>
    </div>
  );
}
