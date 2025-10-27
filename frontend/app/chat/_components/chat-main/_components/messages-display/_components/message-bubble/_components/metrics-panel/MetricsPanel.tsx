import {
  filterBaseMetrics,
  formatMetricValue,
  formatCustomFormulaValue,
  formatNumeric,
} from "./_utils";
import { ComparisonEntry, MetricsPanelProps } from "./metrics-panel.types";

function MetricItem({ metricKey, value }: { metricKey: string; value: any }) {
  return (
    <div className="text-gray-800">
      <span className="text-gray-500 uppercase text-xs">{metricKey}</span>
      <div className="font-semibold">{formatMetricValue(value, metricKey)}</div>
    </div>
  );
}

function BaseMetricsSection({ baseMetrics }: { baseMetrics: [string, any][] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="font-semibold text-sm text-gray-700 mb-2">
        Calculated Metrics
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {baseMetrics.map(([key, value]) => (
          <MetricItem key={key} metricKey={key} value={value} />
        ))}
      </div>
    </div>
  );
}

function CustomFormulaItem({ name, value }: { name: string; value: any }) {
  return (
    <div>
      <p className="text-xs uppercase text-purple-700">{name}</p>
      <p className="font-semibold text-gray-900">
        {formatCustomFormulaValue(value)}
      </p>
    </div>
  );
}

function CustomFormulasSection({
  customMetrics,
}: {
  customMetrics: Record<string, any>;
}) {
  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
      <h4 className="text-sm font-semibold text-purple-900 mb-2">
        Custom Formulas
      </h4>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(customMetrics).map(([name, value]) => (
          <CustomFormulaItem key={name} name={name} value={value} />
        ))}
      </div>
    </div>
  );
}

function ComparisonRow({ entry }: { entry: ComparisonEntry }) {
  return (
    <tr key={entry.fund_id} className="border-t border-blue-100">
      <td className="py-2 pr-4 font-semibold text-blue-900">
        {entry.fund_name || `Fund ${entry.fund_id}`}
      </td>
      <td className="py-2 pr-4">
        {formatNumeric(entry.metrics?.dpi, "ratio")}
      </td>
      <td className="py-2 pr-4">
        {formatNumeric(entry.metrics?.irr, "percent")}
      </td>
      <td className="py-2 pr-4">{formatNumeric(entry.metrics?.pic)}</td>
      <td className="py-2">
        {formatNumeric(entry.metrics?.total_distributions)}
      </td>
    </tr>
  );
}

function ComparisonTableHeader() {
  return (
    <thead>
      <tr className="text-left text-xs uppercase text-blue-800">
        <th className="py-2 pr-4">Fund</th>
        <th className="py-2 pr-4">DPI</th>
        <th className="py-2 pr-4">IRR</th>
        <th className="py-2 pr-4">PIC</th>
        <th className="py-2">Distributions</th>
      </tr>
    </thead>
  );
}

function ComparisonTableBody({
  comparison,
}: {
  comparison: ComparisonEntry[];
}) {
  return (
    <tbody>
      {comparison.map((entry) => (
        <ComparisonRow key={entry.fund_id} entry={entry} />
      ))}
    </tbody>
  );
}

function ComparisonTable({ comparison }: { comparison: ComparisonEntry[] }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <h4 className="text-sm font-semibold text-blue-900 mb-2">
        Comparison Snapshot
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <ComparisonTableHeader />
          <ComparisonTableBody comparison={comparison} />
        </table>
      </div>
    </div>
  );
}

/**
 * MetricsPanel component that displays calculated metrics, custom formulas, and fund comparisons
 * Renders different sections based on the available metrics data
 */
export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const baseMetrics = filterBaseMetrics(metrics);
  const comparison = metrics?.comparison;
  const customMetrics = metrics?.custom_metrics;

  return (
    <div className="mt-3 space-y-3">
      {baseMetrics.length > 0 && (
        <BaseMetricsSection baseMetrics={baseMetrics} />
      )}
      {customMetrics && Object.keys(customMetrics).length > 0 && (
        <CustomFormulasSection customMetrics={customMetrics} />
      )}
      {Array.isArray(comparison) && comparison.length > 0 && (
        <ComparisonTable comparison={comparison} />
      )}
    </div>
  );
}
