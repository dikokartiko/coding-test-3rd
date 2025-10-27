import { Message } from "@/app/chat/page.types";

export interface MessagesDisplayProps {
  messages: Message[];
  historyLoading: boolean;
  hasFunds: boolean;
  loading: boolean;
  errorMessage: string | null;
  setInput: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
