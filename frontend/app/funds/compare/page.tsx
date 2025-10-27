"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fundApi } from "@/lib/api";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { DataState } from "@/components/DataState";
import { Loader2, Download, GitMerge } from "lucide-react";
import { useExcelExport } from "@/hooks/useExcelExport";

type FundOption = {
  id: number;
  name: string;
  fund_type?: string;
  vintage_year?: number;
  metrics?: Record<string, number>;
};

type CashFlow = {
  date: string;
  type: "distribution" | "contribution";
  amount: number;
};

type ComparisonResult = {
  fund_id: number;
  fund_name?: string;
  metrics?: {
    dpi?: number;
    irr?: number;
    pic?: number;
    total_distributions?: number;
  };
  cash_flows: CashFlow[];
};

const MAX_SELECTED = 4;

export default function FundComparisonPage() {
  const {
    data: funds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["funds"],
    queryFn: () => fundApi.list(),
  });
  const [selected, setSelected] = useState<number[]>([]);
  const {
    triggerExport,
    status: exportStatus,
    message: exportMessage,
  } = useExcelExport();

  const {
    data: comparison,
    isFetching: comparisonLoading,
    error: comparisonError,
  } = useQuery({
    queryKey: ["fund-comparison", selected],
    queryFn: () => fundApi.compare(selected),
    enabled: selected.length > 0,
  });

  const fundOptions = useMemo(() => funds || [], [funds]);

  const selectedFunds = useMemo(
    () => fundOptions.filter((fund: FundOption) => selected.includes(fund.id)),
    [fundOptions, selected]
  );

  const toggleFund = (fundId: number) => {
    setSelected((prev) => {
      if (prev.includes(fundId)) {
        return prev.filter((id) => id !== fundId);
      }
      if (prev.length >= MAX_SELECTED) {
        return prev;
      }
      return [...prev, fundId];
    });
  };

  const handleExport = () => {
    if (!selected.length) return;
    triggerExport(selected, "comparison");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <DataState
        status="error"
        title="Unable to load funds"
        description={(error as Error).message}
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Comparison
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Multi-fund comparison
            </h1>
            <p className="text-gray-600">
              Select up to {MAX_SELECTED} funds to benchmark DPI, IRR, and cash
              flows side-by-side.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleExport}
              disabled={!selected.length || exportStatus === "processing"}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {exportStatus === "processing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export to Excel
            </button>
            {exportMessage && (
              <span className="text-xs text-gray-500">{exportMessage}</span>
            )}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <GitMerge className="h-5 w-5 text-blue-600" />
          Select funds to compare
        </div>
        <p className="text-xs text-gray-500">
          You can pick up to {MAX_SELECTED} funds.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fundOptions.map((fund: FundOption) => {
            const isSelected = selected.includes(fund.id);
            const atLimit = selected.length >= MAX_SELECTED && !isSelected;
            return (
              <label
                key={fund.id}
                className={cn(
                  "flex cursor-pointer flex-col rounded-2xl border p-4 transition",
                  isSelected
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300",
                  atLimit && "cursor-not-allowed opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">
                    {fund.name}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    checked={isSelected}
                    disabled={atLimit}
                    onChange={() => toggleFund(fund.id)}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {[fund.fund_type, fund.vintage_year]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
                <div className="mt-2 text-xs text-gray-700">
                  DPI:{" "}
                  <span className="font-semibold">
                    {fund.metrics?.dpi ? fund.metrics.dpi.toFixed(2) : "—"}
                  </span>{" "}
                  | IRR:{" "}
                  <span className="font-semibold">
                    {fund.metrics?.irr
                      ? formatPercentage(fund.metrics.irr)
                      : "—"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {selected.length === 0 ? (
        <DataState
          status="empty"
          title="No funds selected"
          description="Pick at least one fund to generate a comparison."
        />
      ) : comparisonLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : comparisonError ? (
        <DataState
          status="error"
          title="Unable to compare funds"
          description={(comparisonError as Error).message}
        />
      ) : (
        <ComparisonResults results={comparison || []} />
      )}
    </div>
  );
}

function ComparisonResults({ results }: { results: ComparisonResult[] }) {
  if (!results.length) {
    return (
      <DataState
        status="empty"
        title="No metrics to display"
        description="Add more funds or verify that metrics exist."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((fund: ComparisonResult) => (
          <article
            key={fund.fund_id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Fund</p>
                <p className="text-lg font-semibold text-gray-900">
                  {fund.fund_name || `Fund ${fund.fund_id}`}
                </p>
              </div>
              <div className="text-xs text-gray-500 text-right">
                <p>DPI</p>
                <p className="text-lg font-bold text-blue-600">
                  {fund.metrics?.dpi
                    ? Number(fund.metrics.dpi).toFixed(2)
                    : "—"}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MetricRow label="IRR" value={fund.metrics?.irr} type="percent" />
              <MetricRow label="Paid-in Capital" value={fund.metrics?.pic} />
              <MetricRow
                label="Distributions"
                value={fund.metrics?.total_distributions}
              />
            </dl>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Cash flow highlights
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {fund.cash_flows
                  .slice(-3)
                  .map((flow: CashFlow, index: number) => (
                    <li
                      key={`${fund.fund_id}-${index}`}
                      className="flex items-center justify-between"
                    >
                      <span>{new Date(flow.date).toLocaleDateString()}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          flow.type === "distribution"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {flow.type === "distribution" ? "+" : "-"}
                        {formatCurrency(Math.abs(flow.amount))}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Fund</th>
              <th className="px-4 py-3">DPI</th>
              <th className="px-4 py-3">IRR</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Distributions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((fund: ComparisonResult) => (
              <tr
                key={`table-${fund.fund_id}`}
                className="border-t text-gray-700"
              >
                <td className="px-4 py-3 font-semibold">
                  {fund.fund_name || `Fund ${fund.fund_id}`}
                </td>
                <td className="px-4 py-3">
                  {fund.metrics?.dpi
                    ? Number(fund.metrics.dpi).toFixed(2)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {fund.metrics?.irr
                    ? formatPercentage(Number(fund.metrics.irr))
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {fund.metrics?.pic
                    ? formatCurrency(Number(fund.metrics.pic))
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {fund.metrics?.total_distributions
                    ? formatCurrency(Number(fund.metrics.total_distributions))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  type = "currency",
}: {
  label: string;
  value?: number | null;
  type?: "currency" | "percent";
}) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <dt>{label}</dt>
      <dd className="font-semibold text-gray-900">
        {value === undefined || value === null
          ? "—"
          : type === "currency"
          ? formatCurrency(Number(value))
          : formatPercentage(Number(value))}
      </dd>
    </div>
  );
}
