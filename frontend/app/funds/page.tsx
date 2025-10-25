"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fundApi } from "@/lib/api";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Filter,
  Search,
  PlusCircle,
  X,
  Loader2,
} from "lucide-react";
import { DataState } from "@/components/DataState";
import {
  FundCardSkeleton,
  MetricSummarySkeleton,
} from "@/components/Skeletons";

const DEFAULT_FUND_TYPES = [
  "Buyout",
  "Growth Equity",
  "Venture Capital",
  "Secondaries",
  "Real Estate",
  "Infrastructure",
];

const createFundSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Fund name must be at least 3 characters long"),
  fund_type: z.string().trim().min(1, "Select a fund type"),
  gp_name: z
    .string()
    .trim()
    .max(120, "Keep the GP name under 120 characters")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  vintage_year: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^\d{4}$/.test(value),
      "Enter the 4-digit vintage year"
    ),
});

type CreateFundFormValues = z.infer<typeof createFundSchema>;

type FundWithMetrics = {
  id: number;
  name: string;
  fund_type?: string;
  gp_name?: string;
  vintage_year?: number;
  metrics?: {
    dpi?: number;
    irr?: number;
    pic?: number;
    total_distributions?: number;
  };
};

export default function FundsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"dpi" | "irr" | "pic" | "name">("dpi");
  const [fundType, setFundType] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: funds,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["funds"],
    queryFn: () => fundApi.list(),
  });

  const fundTypes = useMemo(() => {
    const types = new Set(
      (funds as FundWithMetrics[] | undefined)
        ?.map((fund) => fund.fund_type)
        .filter(Boolean)
    );
    return Array.from(types) as string[];
  }, [funds]);

  const modalFundTypes = useMemo(() => {
    return Array.from(new Set([...DEFAULT_FUND_TYPES, ...fundTypes]));
  }, [fundTypes]);

  const filteredFunds = useMemo(() => {
    if (!funds) return [];

    return (funds as FundWithMetrics[])
      .filter((fund) => {
        const matchSearch =
          fund.name.toLowerCase().includes(search.toLowerCase()) ||
          (fund.gp_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchType =
          fundType === "all" || fund.fund_type === fundType || !fund.fund_type;
        return matchSearch && matchType;
      })
      .sort((a, b) => {
        if (sortKey === "name") {
          return a.name.localeCompare(b.name);
        }
        const aValue = a.metrics?.[sortKey] ?? 0;
        const bValue = b.metrics?.[sortKey] ?? 0;
        return bValue - aValue;
      });
  }, [funds, search, sortKey, fundType]);

  const summary = useMemo(() => {
    if (!funds || funds.length === 0) {
      return {
        totalPic: 0,
        totalDistributions: 0,
        avgDpi: 0,
        avgIrr: 0,
      };
    }
    const typedFunds = funds as FundWithMetrics[];
    const totalPic = typedFunds.reduce(
      (acc, fund) => acc + (fund.metrics?.pic ?? 0),
      0
    );
    const totalDistributions = typedFunds.reduce(
      (acc, fund) => acc + (fund.metrics?.total_distributions ?? 0),
      0
    );
    const avgDpi =
      typedFunds.reduce((acc, fund) => acc + (fund.metrics?.dpi ?? 0), 0) /
      typedFunds.length;
    const avgIrr =
      typedFunds.reduce((acc, fund) => acc + (fund.metrics?.irr ?? 0), 0) /
      typedFunds.length;

    return {
      totalPic,
      totalDistributions,
      avgDpi,
      avgIrr,
    };
  }, [funds]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Portfolio Overview
          </p>
          <h1 className="text-4xl font-bold text-gray-900">Funds & Metrics</h1>
          <p className="text-gray-600">
            Track DPI, IRR, and capital activity across all funds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Fund
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <MetricSummarySkeleton />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <FundCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : error ? (
        <DataState
          status="error"
          title="Unable to load funds"
          description={(error as Error).message}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : funds && funds.length === 0 ? (
        <DataState
          status="empty"
          title="No funds yet"
          description="Upload a fund document to calculate DPI and IRR in seconds."
          actionLabel="Upload document"
          onAction={() => router.push("/upload")}
        />
      ) : (
        <>
          <PortfolioSummary summary={summary} />
          <FilterBar
            search={search}
            onSearch={setSearch}
            sortKey={sortKey}
            onSortChange={setSortKey}
            fundType={fundType}
            onFundTypeChange={setFundType}
            fundTypes={fundTypes}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFunds.map((fund: FundWithMetrics) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
        </>
      )}
      <CreateFundModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          refetch();
        }}
        fundTypes={modalFundTypes}
      />
    </div>
  );
}

function PortfolioSummary({
  summary,
}: {
  summary: {
    totalPic: number;
    totalDistributions: number;
    avgDpi: number;
    avgIrr: number;
  };
}) {
  const summaryItems = [
    {
      label: "Committed Capital",
      value: formatCurrency(summary.totalPic),
      subtext: "Total paid-in across funds",
    },
    {
      label: "Distributions",
      value: formatCurrency(summary.totalDistributions),
      subtext: "Capital returned to LPs",
    },
    {
      label: "Portfolio DPI",
      value: `${summary.avgDpi.toFixed(2)}x`,
      subtext: "Average distribution to paid-in",
    },
    {
      label: "Portfolio IRR",
      value: `${summary.avgIrr.toFixed(2)}%`,
      subtext: "Average annualized return",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">{item.label}</p>
          <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          <p className="text-xs text-gray-400">{item.subtext}</p>
        </div>
      ))}
    </div>
  );
}

function FilterBar({
  search,
  onSearch,
  sortKey,
  onSortChange,
  fundType,
  onFundTypeChange,
  fundTypes,
}: {
  search: string;
  onSearch: (value: string) => void;
  sortKey: "dpi" | "irr" | "pic" | "name";
  onSortChange: (value: "dpi" | "irr" | "pic" | "name") => void;
  fundType: string;
  onFundTypeChange: (value: string) => void;
  fundTypes: string[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-1 items-center rounded-lg border border-gray-200 px-3 py-2">
        <Search className="mr-2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by fund or GP…"
          className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter className="h-4 w-4" />
          <select
            value={fundType}
            onChange={(event) => onFundTypeChange(event.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All fund types</option>
            {fundTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-600">
          Sort by
          <select
            value={sortKey}
            onChange={(event) =>
              onSortChange(event.target.value as "dpi" | "irr" | "pic" | "name")
            }
            className="ml-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="dpi">Highest DPI</option>
            <option value="irr">Highest IRR</option>
            <option value="pic">Paid-In Capital</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function FundCard({ fund }: { fund: FundWithMetrics }) {
  const metrics = fund.metrics || {};
  const dpi = metrics.dpi || 0;
  const irr = metrics.irr || 0;

  return (
    <Link
      href={`/funds/${fund.id}`}
      className="rounded-lg border border-transparent bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
    >
      <div className="mb-4">
        <p className="text-sm uppercase tracking-wide text-gray-400">
          {fund.fund_type || "Fund"}
        </p>
        <h3 className="text-xl font-semibold text-gray-900">{fund.name}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
          {fund.gp_name && <span>GP: {fund.gp_name}</span>}
          {fund.vintage_year && <span>Vintage {fund.vintage_year}</span>}
        </div>
      </div>

      <div className="space-y-3 border-y border-gray-100 py-4">
        <MetricRow
          label="DPI"
          value={`${dpi.toFixed(2)}x`}
          positive={dpi >= 1}
        />
        <MetricRow
          label="IRR"
          value={Number.isFinite(irr) ? formatPercentage(irr) : "N/A"}
          positive={irr >= 0}
        />
        {metrics.pic && metrics.pic > 0 && (
          <MetricRow
            label="Paid-In Capital"
            value={formatCurrency(metrics.pic)}
          />
        )}
      </div>

      <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
        View details
        <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </Link>
  );
}

function MetricRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-1 font-semibold text-gray-900">
        {value}
        {positive !== undefined &&
          (positive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ))}
      </div>
    </div>
  );
}

function CreateFundModal({
  open,
  onClose,
  onCreated,
  fundTypes,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  fundTypes: string[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFundFormValues>({
    resolver: zodResolver(createFundSchema),
    defaultValues: {
      name: "",
      fund_type: "",
      gp_name: "",
      vintage_year: "",
    },
  });

  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: {
      name: string;
      fund_type?: string;
      gp_name?: string;
      vintage_year?: number;
    }) => fundApi.create(payload),
  });

  const onSubmit = async (values: CreateFundFormValues) => {
    setFormMessage(null);
    try {
      await mutateAsync({
        name: values.name.trim(),
        fund_type: values.fund_type.trim(),
        gp_name: values.gp_name,
        vintage_year: values.vintage_year
          ? Number(values.vintage_year.trim())
          : undefined,
      });
      reset();
      setFormMessage({
        type: "success",
        text: "Fund created successfully.",
      });
      onCreated();
    } catch (submitError: any) {
      setFormMessage({
        type: "error",
        text:
          submitError?.response?.data?.detail ||
          "Something went wrong while creating the fund.",
      });
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Create Fund
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Add a new investment vehicle
            </h2>
            <p className="text-sm text-gray-500">
              Provide a fund name and optional context to begin tracking
              metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Fund name *
            </label>
            <input
              type="text"
              {...register("name")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. Horizon Growth Fund II"
              disabled={isPending}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Fund type *
            </label>
            <select
              {...register("fund_type")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              defaultValue=""
              disabled={isPending}
            >
              <option value="" disabled>
                Select fund type
              </option>
              {fundTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.fund_type && (
              <p className="mt-1 text-xs text-red-600">
                {errors.fund_type.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              GP / Manager
            </label>
            <input
              type="text"
              {...register("gp_name")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. Northwind Capital Partners"
              disabled={isPending}
            />
            {errors.gp_name && (
              <p className="mt-1 text-xs text-red-600">
                {errors.gp_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Vintage year
            </label>
            <input
              type="number"
              inputMode="numeric"
              {...register("vintage_year")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="YYYY"
              disabled={isPending}
            />
            {errors.vintage_year && (
              <p className="mt-1 text-xs text-red-600">
                {errors.vintage_year.message}
              </p>
            )}
          </div>

          {formMessage && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                formMessage.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {formMessage.text}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
              )}
              Create fund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
