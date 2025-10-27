export interface FundSelectorsProps {
  hasFunds: boolean;
  selectedFundId?: number;
  fundOptions: Array<{
    id: number;
    name: string;
  }>;
  comparisonIds: number[];
  comparisonPicker: number | "";
  availableComparisonFunds: Array<{
    id: number;
    name: string;
  }>;
  fundName: (id?: number) => string | undefined;
  setSelectedFundId: (id?: number) => void;
  setComparisonPicker: (value: number | "") => void;
  handleAddComparison: () => void;
  handleRemoveComparison: (id: number) => void;
}

export type PrimarySelectorProps = Pick<
  FundSelectorsProps,
  "selectedFundId" | "fundOptions" | "hasFunds" | "setSelectedFundId"
>;

export type ComparisonSelectorProps = Pick<
  FundSelectorsProps,
  | "comparisonIds"
  | "comparisonPicker"
  | "availableComparisonFunds"
  | "hasFunds"
  | "fundName"
  | "setComparisonPicker"
  | "handleAddComparison"
  | "handleRemoveComparison"
>;
