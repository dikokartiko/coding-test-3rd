import { useCallback, useState } from "react";

/**
 * Hook for managing UI state, loading states, and error handling
 * @returns Object containing UI state and handler functions
 */
export function useChatUI() {
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Individual function definitions for better separation of concerns
  const updateInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const updateLoading = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const updateError = useCallback((error: string | null) => {
    setErrorMessage(error);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const resetUI = useCallback(() => {
    setInput("");
    setLoading(false);
    setErrorMessage(null);
  }, []);

  const hasValidInput = input.trim().length > 0;

  return {
    input,
    loading,
    errorMessage,
    hasValidInput,
    setInput: updateInput,
    setLoading: updateLoading,
    setErrorMessage: updateError,
    clearError,
    resetUI,
  };
}
