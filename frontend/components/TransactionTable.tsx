'use client'

import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fundApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaginatedTable, TableColumn } from '@/components/PaginatedTable'
import { DataState } from '@/components/DataState'
import { TableSkeleton } from '@/components/Skeletons'
import { Badge } from '@/components/ui/Badge'

type TransactionType = 'capital_calls' | 'distributions' | 'adjustments'

type TransactionTableProps = {
  fundId: number
  type: TransactionType
  title: string
  pageSize?: number
}

export function TransactionTable({
  fundId,
  type,
  title,
  pageSize = 10,
}: TransactionTableProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['transactions', fundId, type, page, pageSize],
    queryFn: () => fundApi.getTransactions(fundId, type, page, pageSize),
    placeholderData: keepPreviousData,
  })

  const columns: TableColumn<any>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => {
        const rawDate =
          row.call_date || row.distribution_date || row.adjustment_date
        return rawDate ? formatDate(rawDate) : '—'
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) =>
        row.call_type || row.distribution_type || row.adjustment_type || '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right font-semibold',
      render: (row) => {
        const amount = Number(row.amount || 0)
        const { sign, color } = getAmountPresentation(type, amount)
        return (
          <span className={color}>
            {sign}
            {formatCurrency(Math.abs(amount))}
          </span>
        )
      },
    },
    ...(type === 'distributions'
      ? [
          {
            key: 'recallable',
            header: 'Recallable',
            render: (row: any) =>
              row.is_recallable ? (
                <Badge variant="amber">Recallable</Badge>
              ) : (
                <span className="text-gray-400">No</span>
              ),
          },
        ]
      : []),
    {
      key: 'description',
      header: 'Notes',
      render: (row) => (
        <span className="text-gray-500">{row.description || '—'}</span>
      ),
    },
  ]

  if (isLoading && !data) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <TableSkeleton />
      </section>
    )
  }

  if (error) {
    return (
      <DataState
        status="error"
        title={`Unable to load ${title.toLowerCase()}`}
        description={(error as Error).message}
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    )
  }

  if (!data) return null

  const items = data.items ?? []

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">
            {data.total} total records
            {isFetching && <span className="ml-2 text-blue-600">Refreshing...</span>}
          </p>
        </div>
      </div>

      <PaginatedTable
        columns={columns}
        data={items}
        page={page}
        pageSize={pageSize}
        totalItems={data.total}
        totalPages={data.pages}
        onPageChange={setPage}
        renderRowKey={(row) => row.id}
        emptyMessage={`No ${title.toLowerCase()} recorded`}
      />
    </section>
  )
}

function getAmountPresentation(type: TransactionType, amount: number) {
  if (type === 'capital_calls') {
    return { sign: '-', color: 'text-red-600' }
  }
  if (type === 'distributions') {
    return { sign: '+', color: 'text-green-600' }
  }

  if (amount >= 0) {
    return { sign: '+', color: 'text-green-600' }
  }
  return { sign: '-', color: 'text-red-600' }
}
