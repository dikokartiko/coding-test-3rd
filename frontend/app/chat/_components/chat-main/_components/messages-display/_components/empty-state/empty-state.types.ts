/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /** Function to set the input field value when a question card is clicked */
  setInput: (value: string) => void;
}

/**
 * Type representing the icon key based on QuestionCard's iconType
 */
export type IconKey = import("./empty-state.data").QuestionCard["iconType"];

/**
 * Props for the QuestionCardButton component
 */
export interface QuestionCardProps {
  /** The question card data */
  card: import("./empty-state.data").QuestionCard;
  /** The index of the card in the array */
  index: number;
  /** Function to set the input field value when a question card is clicked */
  setInput: (value: string) => void;
}
