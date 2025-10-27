import {
  ComparisonFundSelectorProps,
  ComparisonFundDropdownProps,
  ComparisonFundControlsProps,
  ComparisonFundTagsProps,
} from "./comparison-fund-selector.types";

/**
 * Comparison fund selector label component
 */
const ComparisonFundLabel = () => (
  <label className="text-xs font-medium text-gray-600">
    Compare multiple funds
  </label>
);

/**
 * Comparison fund selector dropdown component
 */
const ComparisonFundDropdown = ({
  comparisonPicker,
  availableComparisonFunds,
  hasFunds,
  setComparisonPicker,
}: ComparisonFundDropdownProps) => (
  <select
    value={comparisonPicker}
    onChange={(event) =>
      setComparisonPicker(event.target.value ? Number(event.target.value) : "")
    }
    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed"
    disabled={!hasFunds}
  >
    <option value="">Select fund</option>
    {availableComparisonFunds.map((fund) => (
      <option key={fund.id} value={fund.id}>
        {fund.name}
      </option>
    ))}
  </select>
);

/**
 * Comparison fund controls component (dropdown + add button)
 */
const ComparisonFundControls = ({
  comparisonPicker,
  availableComparisonFunds,
  hasFunds,
  setComparisonPicker,
  handleAddComparison,
}: ComparisonFundControlsProps) => (
  <div className="mt-1 flex gap-2">
    <ComparisonFundDropdown
      comparisonPicker={comparisonPicker}
      availableComparisonFunds={availableComparisonFunds}
      hasFunds={hasFunds}
      setComparisonPicker={setComparisonPicker}
    />
    <button
      onClick={handleAddComparison}
      className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-70 disabled:cursor-not-allowed disabled:bg-gray-40"
      disabled={!comparisonPicker || !hasFunds}
    >
      Add
    </button>
  </div>
);

/**
 * Comparison fund tags component
 */
const ComparisonFundTags = ({
  comparisonIds,
  fundName,
  handleRemoveComparison,
}: ComparisonFundTagsProps) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {comparisonIds.map((fundId) => (
      <span
        key={fundId}
        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
      >
        {fundName(fundId)}
        <button
          onClick={() => handleRemoveComparison(fundId)}
          className="text-blue-500 hover:text-blue-700"
          aria-label={`Remove ${fundName(fundId)}`}
        >
          ×
        </button>
      </span>
    ))}
  </div>
);

/**
 * Comparison fund selector description component
 */
const ComparisonFundDescription = () => (
  <p className="mt-1 text-xs text-gray-500">
    Add up to 4 funds. The assistant will compare them when relevant.
  </p>
);

/**
 * Comparison fund selector component
 */
export const ComparisonFundSelector = (props: ComparisonFundSelectorProps) => {
  const controlProps = {
    comparisonPicker: props.comparisonPicker,
    availableComparisonFunds: props.availableComparisonFunds,
    hasFunds: props.hasFunds,
    setComparisonPicker: props.setComparisonPicker,
    handleAddComparison: props.handleAddComparison,
  };

  const tagProps = {
    comparisonIds: props.comparisonIds,
    fundName: props.fundName,
    handleRemoveComparison: props.handleRemoveComparison,
  };

  return (
    <div>
      <ComparisonFundLabel />
      <ComparisonFundControls {...controlProps} />
      <ComparisonFundTags {...tagProps} />
      <ComparisonFundDescription />
    </div>
  );
};
