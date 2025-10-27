import { useCallback, useEffect, useState } from "react";
import { fundApi } from "@/lib/api";
import { FundOption } from "../../page.types";

/**
 * Hook for managing fund selection and comparison functionality
 * @returns Object containing fund state and handler functions
 */
export function useFunds() {
  const [fundOptions, setFundOptions] = useState<FundOption[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<number | undefined>();
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [comparisonPicker, setComparisonPicker] = useState<number | "">("");

  /** Maximum number of funds that can be compared at once */
  const MAX_COMPARISON_FUNDS = 4;

  /**
   * Loads fund options from API
   */
  const loadFundOptions = useCallback(async () => {
    try {
      const data = await fundApi.list();
      const options = data.map((fund: any) => ({
        id: fund.id,
        name: fund.name,
      }));
      setFundOptions(options);
      return options;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  // Load fund options on component mount
  useEffect(() => {
    loadFundOptions();
  }, [loadFundOptions]);

  // Auto-select first fund if funds exist and no fund is selected
  useEffect(() => {
    if (fundOptions.length && !selectedFundId) {
      setSelectedFundId(fundOptions[0].id);
    }
  }, [fundOptions, selectedFundId]);

  // Clear comparison IDs when selected fund changes to prevent conflicts
  useEffect(() => {
    if (selectedFundId && comparisonIds.includes(selectedFundId)) {
      setComparisonIds((prev) => prev.filter((id) => id !== selectedFundId));
    }
  }, [selectedFundId, comparisonIds]);

  /**
   * Handles adding a fund to the comparison list
   */
  const canAddComparison = useCallback(() => {
    if (!comparisonPicker) return false;
    if (comparisonIds.includes(Number(comparisonPicker))) return false;
    if (comparisonIds.length >= MAX_COMPARISON_FUNDS) return false;
    return true;
  }, [comparisonPicker, comparisonIds, MAX_COMPARISON_FUNDS]);

  const handleAddComparison = useCallback(() => {
    if (!canAddComparison()) return;
    setComparisonIds((prev) => [...prev, Number(comparisonPicker)]);
    setComparisonPicker("");
  }, [canAddComparison, comparisonPicker]);

  /**
   * Handles removing a fund from the comparison list
   * @param fundId - The ID of the fund to remove from comparison
   */
  const handleRemoveComparison = useCallback((fundId: number) => {
    setComparisonIds((prev) => prev.filter((id) => id !== fundId));
  }, []);

  /**
   * Gets the name of a fund by its ID
   * @param fundId - The ID of the fund to look up
   * @returns The fund name or undefined if not found
   */
  const fundName = useCallback(
    (fundId?: number) => fundOptions.find((fund) => fund.id === fundId)?.name,
    [fundOptions]
  );

  /** Computed property to check if funds exist */
  const hasFunds = fundOptions.length > 0;

  /**
   * Gets available comparison funds (excluding selected primary fund)
   */
  const availableComparisonFunds = fundOptions.filter(
    (fund) => fund.id !== selectedFundId && !comparisonIds.includes(fund.id)
  );

  return {
    fundOptions,
    selectedFundId,
    comparisonIds,
    comparisonPicker,
    hasFunds,
    availableComparisonFunds,
    setSelectedFundId,
    setComparisonIds,
    setComparisonPicker,
    loadFundOptions,
    handleAddComparison,
    handleRemoveComparison,
    fundName,
  };
}
