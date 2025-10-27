"use client";

import { ChatHeader } from "./_components/chat-header";
import { FundSelectors } from "./_components/fund-selectors";
import { MessagesDisplay } from "./_components/messages-display";
import { ChatInputForm } from "./_components/chat-input-form";
import { ChatMainProps } from "./chat-main.types";

/**
 * Main chat interface component containing header, fund selectors, messages, and input
 *
 * This component serves as the primary container for the chat interface, organizing
 * the different sections of the chat UI into a cohesive layout. It manages the
 * presentation of the header, fund selection controls, message history display,
 * and message input form.
 *
 * The component is divided into three main sections:
 * 1. ChatHeaderSection: Displays conversation title and fund information
 * 2. MessagesSection: Shows the conversation history with loading states
 * 3. InputSection: Provides the form for sending new messages
 *
 * @param {ChatMainProps} props - The properties passed to configure the chat interface
 * @returns {JSX.Element} The complete chat interface UI
 */
export function ChatMain(props: ChatMainProps) {
  return (
    <ChatLayout>
      <ChatHeaderSection {...props} />
      <MessagesSection {...props} />
      <InputSection {...props} />
      {props.children}
    </ChatLayout>
  );
}

/**
 * Layout wrapper for the main chat interface
 *
 * This component provides the structural layout for the main chat area,
 * setting the height, styling, and positioning for all child components.
 * It uses a flex column layout to stack the header, messages, and input
 * sections vertically while maintaining a consistent appearance.
 *
 * @param {React.ReactNode} children - Child components to be rendered inside the layout
 * @returns {JSX.Element} The layout wrapper with applied styling
 */
function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="flex h-[calc(100vh-14rem)] flex-col rounded-2xl border border-gray-100 bg-white shadow-sm"
      style={{ minHeight: "-webkit-fill-available" }}
    >
      {children}
    </section>
  );
}

/**
 * Header section with conversation title and fund selectors
 *
 * This section combines the chat header (showing conversation title) with
 * the fund selection controls, providing users with context about the
 * current conversation and allowing them to manage fund selections.
 *
 * @param {ChatMainProps} props - Properties containing conversation and fund data
 * @returns {JSX.Element} The header and fund selector components
 */
function ChatHeaderSection({ conversations, funds }: ChatMainProps) {
  return (
    <>
      <ChatHeader
        conversationTitle={conversations.conversationTitle}
        fundName={funds.fundName(funds.selectedFundId)}
      />

      <FundSelectors
        hasFunds={funds.hasFunds}
        selectedFundId={funds.selectedFundId}
        fundOptions={funds.fundOptions}
        comparisonIds={funds.comparisonIds}
        comparisonPicker={funds.comparisonPicker}
        availableComparisonFunds={funds.availableComparisonFunds}
        fundName={funds.fundName}
        setSelectedFundId={funds.setSelectedFundId}
        setComparisonPicker={funds.setComparisonPicker}
        handleAddComparison={funds.handleAddComparison}
        handleRemoveComparison={funds.handleRemoveComparison}
      />
    </>
  );
}

/**
 * Messages display section
 *
 * This section renders the conversation history with proper loading states
 * and error handling. It displays messages in chronological order and
 * manages scrolling to the latest message.
 *
 * @param {ChatMainProps} props - Properties containing messages, funds, and UI state
 * @returns {JSX.Element} The messages display component
 */
function MessagesSection({ messages, funds, ui }: ChatMainProps) {
  return (
    <MessagesDisplay
      messages={messages.messages}
      historyLoading={messages.historyLoading}
      hasFunds={funds.hasFunds}
      loading={ui.loading}
      errorMessage={ui.errorMessage}
      setInput={ui.setInput}
      messagesEndRef={messages.messagesEndRef}
    />
  );
}

/**
 * Input form section
 *
 * This section provides the interface for users to compose and send new messages.
 * It includes validation, loading indicators, and proper event handling for
 * message submission.
 *
 * @param {ChatMainProps} props - Properties containing UI state and submission handler
 * @returns {JSX.Element} The input form component
 */
function InputSection({ ui, funds, onSubmit }: ChatMainProps) {
  return (
    <ChatInputForm
      input={ui.input}
      loading={ui.loading}
      hasFunds={funds.hasFunds}
      hasValidInput={ui.hasValidInput}
      setInput={ui.setInput}
      onSubmit={onSubmit}
    />
  );
}
