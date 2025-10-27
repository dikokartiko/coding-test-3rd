import { Formula, FormulaFormData } from "@/app/formulas/page.types";

export interface FormulaFormProps {
  onFormSubmit: (formula: FormulaFormData) => Promise<void>;
  editingFormula?: Formula | null;
  onCancelEdit?: () => void;
}

export type { Formula, FormulaFormData };
