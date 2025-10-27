import {
  FundSelectorsProps,
  PrimarySelectorProps,
  ComparisonSelectorProps,
} from "./fund-selectors.types";
import { PrimaryFundSelector } from "./_components/primary-selector/PrimaryFundSelector";
import { ComparisonFundSelector } from "./_components/comparison-fund-selector/ComparisonFundSelector";

/**
 * Fund selectors component for primary fund and comparison funds
 */
export function FundSelectors(props: FundSelectorsProps) {
  const primarySelectorProps = buildPrimarySelectorProps(props);
  const comparisonSelectorProps = buildComparisonSelectorProps(props);

  return (
    <div className="grid gap-4 border-b px-6 py-4 md:grid-cols-2">
      <PrimaryFundSelector {...primarySelectorProps} />
      <ComparisonFundSelector {...comparisonSelectorProps} />
    </div>
  );
}

const buildPrimarySelectorProps = ({
  selectedFundId,
  fundOptions,
  hasFunds,
  setSelectedFundId,
}: FundSelectorsProps): PrimarySelectorProps => ({
  selectedFundId,
  fundOptions,
  hasFunds,
  setSelectedFundId,
});

const buildComparisonSelectorProps = ({
  comparisonIds,
  comparisonPicker,
  availableComparisonFunds,
  hasFunds,
  fundName,
  setComparisonPicker,
  handleAddComparison,
  handleRemoveComparison,
}: FundSelectorsProps): ComparisonSelectorProps => ({
  comparisonIds,
  comparisonPicker,
  availableComparisonFunds,
  hasFunds,
  fundName,
  setComparisonPicker,
  handleAddComparison,
  handleRemoveComparison,
});
