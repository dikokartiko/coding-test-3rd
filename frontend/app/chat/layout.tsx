"use client";

import { ReactNode } from "react";
import { ChatSidebar } from "./_components/chat-sidebar";
import { ChatMain } from "./_components/chat-main";
import { useConversations, useMessages, useFunds, useChatUI } from "./_hooks";
import { chatApi } from "@/lib/api";

export default function ChatLayout({ children }: { children: ReactNode }) {
  // Initialize all hooks at layout level
  const conversations = useConversations();
  const messages = useMessages(conversations.conversationId);
  const funds = useFunds();
  const ui = useChatUI();

  /**
   * Handles form submission for sending a chat message
   * @param e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.hasValidInput || ui.loading || !funds.hasFunds) return;

    ui.clearError();
    ui.setLoading(true);
    let activeConversationId = conversations.conversationId;

    try {
      if (!activeConversationId) {
        activeConversationId = await conversations.startConversation(
          funds.selectedFundId
        );
      }

      const userMessage = messages.createUserMessage(ui.input);
      ui.setInput("");

      const comparisonPayload =
        funds.comparisonIds.length > 1 ? funds.comparisonIds : undefined;
      const resolvedFundId = funds.selectedFundId ?? funds.comparisonIds[0];

      const response = await chatApi.query(
        userMessage.content,
        resolvedFundId,
        activeConversationId,
        comparisonPayload
      );

      messages.createAssistantMessage(
        response.answer,
        response.sources,
        response.metrics
      );

      conversations.setConversationId(
        response.conversation_id || activeConversationId
      );
      conversations.loadConversations();
    } catch (error: any) {
      ui.setErrorMessage(error?.response?.data?.detail || error.message);
      messages.createErrorMessage(
        error?.response?.data?.detail || error.message
      );
    } finally {
      ui.setLoading(false);
    }
  };

  /**
   * Handles selecting a conversation from the sidebar
   * @param id - The ID of the conversation to select
   */
  const handleConversationSelect = async (id: string) => {
    try {
      const conversation = await conversations.handleConversationSelect(id);
      // Handle empty conversations (no messages) gracefully
      // The conversation object might have messages in different formats
      if (conversation && conversation.messages) {
        messages.setMessages(conversation.messages);
      } else {
        messages.setMessages([]);
      }
    } catch (error: any) {
      ui.setErrorMessage(
        error?.response?.data?.detail || "Unable to load conversation"
      );
    }
  };

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
