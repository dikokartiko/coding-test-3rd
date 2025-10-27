export interface FormulaListProps {
  initialFormulas?: import("@/app/formulas/page.types").Formula[] | null;
  initialError?: Error | null;
}

export interface FormulaListTypes {
  Formula: import("@/app/formulas/page.types").Formula;
  FormulaFormData: import("@/app/formulas/page.types").FormulaFormData;
}
