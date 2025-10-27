/**
 * Type definitions for the formulas page
 */

/**
 * Represents a formula in the system
 */
export interface Formula {
  /** Unique identifier for the formula */
  id: number;
  /** Name of the formula */
  name: string;
  /** Expression of the formula */
  expression: string;
  /** Description of the formula */
  description?: string;
  /** Variables used in the formula */
  variables?: Array<{ name: string }>;
  /** Tags associated with the formula */
  tags?: string[];
  /** Visibility level of the formula */
  visibility: "private" | "org" | "global";
  /** Creation timestamp */
  created_at?: string;
  /** Update timestamp */
  updated_at?: string;
}

/**
 * Form data structure for formula creation/editing
 */
export interface FormulaFormData {
  name: string;
  expression: string;
  description?: string;
  variables?: string;
  tags?: string;
  visibility: "private" | "org" | "global";
}

/**
 * Props for the formulas list component
 */
export interface FormulaListProps {
  initialFormulas?: Formula[] | null;
  initialError?: Error | null;
}

/**
 * Props for the formula form component
 */
export interface FormulaFormProps {
  onFormSubmit: (formula: FormulaFormData) => Promise<void>;
  editingFormula?: Formula | null;
  onCancelEdit?: () => void;
}
