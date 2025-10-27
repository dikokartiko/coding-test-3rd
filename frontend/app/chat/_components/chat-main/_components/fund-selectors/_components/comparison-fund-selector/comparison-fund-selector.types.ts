import { FundSelectorsProps } from "../../fund-selectors.types";

export type ComparisonFundSelectorProps = Pick<
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

export type ComparisonFundDropdownProps = Pick<
  FundSelectorsProps,
  | "comparisonPicker"
  | "availableComparisonFunds"
  | "hasFunds"
  | "setComparisonPicker"
>;

export type ComparisonFundControlsProps = Pick<
  FundSelectorsProps,
  | "comparisonPicker"
  | "availableComparisonFunds"
  | "hasFunds"
  | "setComparisonPicker"
  | "handleAddComparison"
>;

export type ComparisonFundTagsProps = Pick<
  FundSelectorsProps,
  "comparisonIds" | "fundName" | "handleRemoveComparison"
>;
