export interface ChatInputFormProps {
  input: string;
  loading: boolean;
  hasFunds: boolean;
  hasValidInput: boolean;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}
