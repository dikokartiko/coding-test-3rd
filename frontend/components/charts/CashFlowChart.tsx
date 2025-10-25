'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { ChartSkeleton } from '@/components/Skeletons'
import { DataState } from '@/components/DataState'

export type CashFlowItem = {
  date: string
  amount: number
  type: 'capital_call' | 'distribution'
}

type CashFlowChartProps = {
  cashFlows: CashFlowItem[]
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function CashFlowChart({
  cashFlows,
  isLoading,
  error,
  onRetry,
}: CashFlowChartProps) {
  if (isLoading) {
    return <ChartSkeleton />
  }

  if (error) {
    return (
      <DataState
        status="error"
        title="Unable to load cash flow chart"
        description={error.message}
        actionLabel="Retry"
        onAction={onRetry}
      />
    )
  }

  if (!cashFlows || cashFlows.length === 0) {
    return (
      <DataState
        status="empty"
        title="No cash flow data"
        description="Upload documents or add transactions to visualize capital activity."
      />
    )
  }

  const cumulativeData = cashFlows
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce(
      (acc: any[], item) => {
        const last = acc[acc.length - 1] || {
          date: item.date,
          contributions: 0,
          distributions: 0,
        }
        const next = {
          date: item.date,
          contributions:
            last.contributions +
            (item.type === 'capital_call' ? Math.abs(item.amount) : 0),
          distributions:
            last.distributions +
            (item.type === 'distribution' ? Math.abs(item.amount) : 0),
        }
        acc.push(next)
        return acc
      },
      [] as Array<{ date: string; contributions: number; distributions: number }>
    )

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Cumulative Cash Flows
        </h2>
        <p className="text-sm text-gray-500">
          Track capital calls (negative) and distributions (positive) over time
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorDistributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
            <YAxis tickFormatter={(value) => `${value / 1_000_000}M`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toDateString()}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="contributions"
              name="Capital Calls"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorContributions)"
            />
            <Area
              type="monotone"
              dataKey="distributions"
              name="Distributions"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorDistributions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
