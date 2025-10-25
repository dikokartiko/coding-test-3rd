'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fundApi, metricsApi } from '@/lib/api'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { TrendingUp, DollarSign, Activity, Download, Loader2 } from 'lucide-react'
import { DataState } from '@/components/DataState'
import {
  MetricSummarySkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '@/components/Skeletons'
import { CashFlowChart, CashFlowItem } from '@/components/charts/CashFlowChart'
import { TransactionTable } from '@/components/TransactionTable'
import { useExcelExport } from '@/hooks/useExcelExport'

export default function FundDetailPage() {
  const params = useParams()
  const fundId = Number(params.id)
  const invalidFundId = Number.isNaN(fundId)
  const { triggerExport, status: exportStatus, message: exportMessage } = useExcelExport()

  const {
    data: fund,
    isLoading: fundLoading,
    error: fundError,
    refetch: refetchFund,
  } = useQuery({
    queryKey: ['fund', fundId],
    queryFn: () => fundApi.get(fundId),
    enabled: !invalidFundId,
  })

  const {
    data: dpiBreakdown,
    isLoading: breakdownLoading,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = useQuery({
    queryKey: ['fund', fundId, 'dpi-breakdown'],
    queryFn: () => metricsApi.getFundMetrics(fundId, 'dpi'),
    enabled: !invalidFundId,
  })

  const breakdownErr = breakdownError ? (breakdownError as Error) : null

  const cashFlowData: CashFlowItem[] = useMemo(() => {
    const transactions =
      dpiBreakdown?.breakdown?.transactions ?? {
        capital_calls: [],
        distributions: [],
      }

    const calls = (transactions.capital_calls || []).map((call: any) => ({
      date: call.date,
      amount: -Math.abs(call.amount),
      type: 'capital_call' as const,
    }))

    const distributions = (transactions.distributions || []).map((dist: any) => ({
      date: dist.date,
      amount: Math.abs(dist.amount),
      type: 'distribution' as const,
    }))

    return [...calls, ...distributions]
  }, [dpiBreakdown])

  if (invalidFundId) {
    return (
      <DataState
        status="error"
        title="Invalid fund id"
        description="Please return to the funds list and pick a valid fund."
      />
    )
  }

  if (fundLoading) {
    return (
      <div className="space-y-8">
        <MetricSummarySkeleton />
        <ChartSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (fundError || !fund) {
    return (
      <DataState
        status="error"
        title="Unable to load fund"
        description={(fundError as Error)?.message || 'Fund not found'}
        actionLabel="Retry"
        onAction={() => refetchFund()}
      />
    )
  }

  const metrics = fund.metrics || {}

  const handleExport = () => {
    const slug = fund.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    triggerExport([fundId], slug || 'fund')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Fund overview
          </p>
          <h1 className="text-4xl font-bold text-gray-900">{fund.name}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            {fund.gp_name && <span>GP: {fund.gp_name}</span>}
            {fund.vintage_year && <span>Vintage: {fund.vintage_year}</span>}
            {fund.fund_type && <span>Type: {fund.fund_type}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleExport}
            disabled={exportStatus === 'processing'}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {exportStatus === 'processing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportStatus === 'processing' ? 'Preparing export...' : 'Export to Excel'}
          </button>
          {exportMessage && (
            <p className="text-xs text-gray-500">{exportMessage}</p>
          )}
        </div>
      </header>

      <MetricsGrid metrics={metrics} />

      <CashFlowChart
        cashFlows={cashFlowData}
        isLoading={breakdownLoading}
        error={breakdownErr}
        onRetry={() => refetchBreakdown()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionTable
          fundId={fundId}
          type="capital_calls"
          title="Capital Calls"
        />
        <TransactionTable
          fundId={fundId}
          type="distributions"
          title="Distributions"
        />
      </div>

      <TransactionTable
        fundId={fundId}
        type="adjustments"
        title="Adjustments"
      />
    </div>
  )
}

function MetricsGrid({
  metrics,
}: {
  metrics: Record<string, number | null | undefined>
}) {
  const cards = [
    {
      label: 'DPI',
      value:
        metrics?.dpi !== undefined ? `${Number(metrics.dpi).toFixed(2)}x` : 'N/A',
      description: 'Distribution to paid-in capital',
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
    },
    {
      label: 'IRR',
      value:
        metrics?.irr !== undefined
          ? formatPercentage(Number(metrics.irr))
          : 'N/A',
      description: 'Annualized performance',
      icon: <Activity className="h-6 w-6 text-green-600" />,
    },
    {
      label: 'Paid-In Capital',
      value:
        metrics?.pic !== undefined ? formatCurrency(Number(metrics.pic)) : 'N/A',
      description: 'Total contributions from LPs',
      icon: <DollarSign className="h-6 w-6 text-purple-600" />,
    },
    {
      label: 'Distributions',
      value:
        metrics?.total_distributions !== undefined
          ? formatCurrency(Number(metrics.total_distributions))
          : 'N/A',
      description: 'Capital returned to LPs',
      icon: <DollarSign className="h-6 w-6 text-amber-600" />,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            {card.icon}
          </div>
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          <p className="text-xs text-gray-400">{card.description}</p>
        </div>
      ))}
    </div>
  )
}
