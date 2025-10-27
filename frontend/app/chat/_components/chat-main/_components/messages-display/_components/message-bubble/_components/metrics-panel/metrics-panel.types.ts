/**
 * Props for MetricsPanel component
 */
export interface MetricsPanelProps {
  /** Object containing metrics data to display, including comparison and custom metrics */
  metrics: Record<string, any>;
}

/**
 * Represents a single entry in fund comparison data
 */
export interface ComparisonEntry {
  /** Unique identifier for the fund */
  fund_id: number;
  /** Optional display name for the fund */
  fund_name?: string;
  /** Metrics data for the fund */
  metrics: {
    /** Distributed to Paid-In Capital ratio */
    dpi?: number;
    /** Internal Rate of Return */
    irr?: number;
    /** Paid-In Capital */
    pic?: number;
    /** Total distributions amount */
    total_distributions?: number;
  };
}
