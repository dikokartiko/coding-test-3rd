import { formatCurrency } from "@/lib/utils";

/**
 * Formats a numeric value according to the specified mode
 * @param value - The numeric value to format (can be undefined or null)
 * @param mode - The formatting mode to use ('currency', 'percent', or 'ratio')
 * @returns Formatted string representation of the value, or em dash if value is undefined/null
 */
export function formatNumeric(
  value?: number | null,
  mode: "currency" | "percent" | "ratio" = "currency"
) {
  if (value === undefined || value === null) return "—";
  if (mode === "percent") return `${Number(value).toFixed(2)}%`;
  if (mode === "ratio") return `${Number(value).toFixed(2)}x`;
  return formatCurrency(Number(value));
}

/**
 * Formats a metric value based on its key
 * @param value - The value to format
 * @param metricKey - The key of the metric to determine formatting
 * @returns Formatted string representation of the value
 */
export function formatMetricValue(value: any, metricKey: string): string {
  if (typeof value !== "number") return value;

  return metricKey?.toLowerCase().includes("irr")
    ? `${value.toFixed(2)}%`
    : formatCurrency(value);
}

/**
 * Formats a custom formula value
 * @param value - The value to format
 * @returns Formatted string representation of the value
 */
export function formatCustomFormulaValue(value: any): string {
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "string") return value;
  return "—";
}

/**
 * Filters base metrics from the metrics object
 * @param metrics - The complete metrics object
 * @returns Array of filtered base metrics entries
 */
export function filterBaseMetrics(
  metrics: Record<string, any>
): [string, any][] {
  return Object.entries(metrics).filter(
    ([key, value]) =>
      key !== "comparison" &&
      key !== "custom_metrics" &&
      value !== null &&
      typeof value !== "object"
  );
}
