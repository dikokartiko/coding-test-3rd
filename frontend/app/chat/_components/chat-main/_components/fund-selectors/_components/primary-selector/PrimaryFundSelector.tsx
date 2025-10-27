import {
  PrimaryFundSelectorProps,
  PrimaryFundDropdownProps,
} from "./primary-fund-selector.types";

/**
 * Primary fund selector label component
 */
const PrimaryFundLabel = () => (
  <label className="text-xs font-medium text-gray-600">
    Primary fund context
  </label>
);

/**
 * Primary fund dropdown selector component
 */
const PrimaryFundDropdown = ({
  selectedFundId,
  fundOptions,
  hasFunds,
  setSelectedFundId,
}: PrimaryFundDropdownProps) => (
  <select
    value={selectedFundId ?? ""}
    onChange={(event) =>
      setSelectedFundId(
        event.target.value ? Number(event.target.value) : undefined
      )
    }
    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed"
    disabled={!hasFunds}
  >
    {fundOptions.map((fund) => (
      <option key={fund.id} value={fund.id}>
        {fund.name}
      </option>
    ))}
  </select>
);

/**
 * Primary fund selector description component
 */
const PrimaryFundDescription = () => (
  <p className="mt-1 text-xs text-gray-500">
    Used for fund-specific calculations like DPI or IRR.
  </p>
);

/**
 * Primary fund selector component
 */
export const PrimaryFundSelector = ({
  selectedFundId,
  fundOptions,
  hasFunds,
  setSelectedFundId,
}: PrimaryFundSelectorProps) => (
  <div>
    <PrimaryFundLabel />
    <PrimaryFundDropdown
      selectedFundId={selectedFundId}
      fundOptions={fundOptions}
      hasFunds={hasFunds}
      setSelectedFundId={setSelectedFundId}
    />
    <PrimaryFundDescription />
  </div>
);
