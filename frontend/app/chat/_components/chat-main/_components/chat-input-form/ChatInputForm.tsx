"use client";

import { Send } from "lucide-react";
import { ChatInputFormProps } from "./chat-input-form.types";

/**
 * Chat input field component
 */
const ChatInput = ({
  input,
  hasFunds,
  loading,
  setInput,
}: {
  input: string;
  hasFunds: boolean;
  loading: boolean;
  setInput: (value: string) => void;
}) => (
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder={
      hasFunds
        ? "Ask a question about fund performance..."
        : "Create funds first to start chatting..."
    }
    className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed"
    disabled={loading || !hasFunds}
  />
);

/**
 * Send button component
 */
const SendButton = ({
  loading,
  hasValidInput,
  hasFunds,
}: {
  loading: boolean;
  hasValidInput: boolean;
  hasFunds: boolean;
}) => (
  <button
    type="submit"
    disabled={loading || !hasValidInput || !hasFunds}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
  >
    <Send className="h-4 w-4" />
    Send
  </button>
);

/**
 * Form content component
 */
const FormContent = ({
  input,
  loading,
  hasFunds,
  hasValidInput,
  setInput,
  onSubmit,
}: ChatInputFormProps) => (
  <form
    onSubmit={onSubmit}
    className="flex flex-col gap-2 lg:flex-row lg:items-center"
  >
    <ChatInput
      input={input}
      hasFunds={hasFunds}
      loading={loading}
      setInput={setInput}
    />
    <SendButton
      loading={loading}
      hasValidInput={hasValidInput}
      hasFunds={hasFunds}
    />
  </form>
);

/**
 * Chat input form component for message submission
 */
export function ChatInputForm(props: ChatInputFormProps) {
  return (
    <div className="border-t p-4">
      <FormContent {...props} />
    </div>
  );
}
