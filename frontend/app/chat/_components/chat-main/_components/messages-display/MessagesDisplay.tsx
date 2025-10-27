import { Loader2, RefreshCcw, AlertCircle } from "lucide-react";
import { MessageBubble } from "./_components/message-bubble";
import { EmptyState } from "./_components/empty-state";
import { MessagesDisplayProps } from "./messages-display.types";
import Link from "next/link";

/**
 * Loading state component for conversation history
 */
export function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <RefreshCcw className="h-4 w-4 animate-spin" />
      Loading conversation...
    </div>
  );
}

/**
 * No funds state component
 */
export function NoFundsState() {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No funds available
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        You need to create funds before you can start chatting with AI
        assistant.
      </p>
      <Link
        href="/funds"
        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Create Funds
      </Link>
    </div>
  );
}

/**
 * Error state component
 */
export function ErrorState({ errorMessage }: { errorMessage: string | null }) {
  if (!errorMessage) return null;

  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
      {errorMessage}
    </div>
  );
}

/**
 * Message list renderer component
 */
export function MessageList({
  messages,
}: {
  messages: MessagesDisplayProps["messages"];
}) {
  return (
    <>
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
    </>
  );
}

/**
 * Loading indicator for when AI is thinking
 */
export function ThinkingLoader() {
  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Thinking...</span>
    </div>
  );
}

/**
 * Component to render the appropriate state based on loading and message status
 */
function MessageStates({
  historyLoading,
  messages,
  hasFunds,
  setInput,
}: {
  historyLoading: boolean;
  messages: MessagesDisplayProps["messages"];
  hasFunds: boolean;
  setInput: (value: string) => void;
}) {
  if (historyLoading) {
    return <LoadingState />;
  }

  if (messages.length === 0) {
    return hasFunds ? <EmptyState setInput={setInput} /> : <NoFundsState />;
  }

  return null;
}

/**
 * Main content wrapper for messages display
 */
function MessagesContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="space-y-6">{children}</div>
    </div>
  );
}

/**
 * Messages display component showing chat messages and loading states
 */
export function MessagesDisplay({
  messages,
  historyLoading,
  hasFunds,
  loading,
  errorMessage,
  setInput,
  messagesEndRef,
}: MessagesDisplayProps) {
  return (
    <MessagesContainer>
      <MessageStates
        historyLoading={historyLoading}
        messages={messages}
        hasFunds={hasFunds}
        setInput={setInput}
      />
      <MessageList messages={messages} />
      {loading && <ThinkingLoader />}
      <ErrorState errorMessage={errorMessage} />
      <div ref={messagesEndRef} />
    </MessagesContainer>
  );
}
