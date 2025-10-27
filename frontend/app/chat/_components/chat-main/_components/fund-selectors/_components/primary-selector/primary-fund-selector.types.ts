import { FundSelectorsProps } from "../../fund-selectors.types";

export type PrimaryFundSelectorProps = Pick<
  FundSelectorsProps,
  "selectedFundId" | "fundOptions" | "hasFunds" | "setSelectedFundId"
>;

export type PrimaryFundDropdownProps = Pick<
  FundSelectorsProps,
  "selectedFundId" | "fundOptions" | "hasFunds" | "setSelectedFundId"
>;
