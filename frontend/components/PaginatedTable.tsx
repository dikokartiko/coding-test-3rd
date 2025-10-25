'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TableColumn<T> = {
  key: string
  header: string
  className?: string
  render?: (row: T) => React.ReactNode
}

type PaginatedTableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  renderRowKey: (row: T) => string | number
  emptyMessage?: string
}

export function PaginatedTable<T>({
  columns,
  data,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  renderRowKey,
  emptyMessage = 'No records found',
}: PaginatedTableProps<T>) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={renderRowKey(row)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-4 py-3 text-gray-700', column.className)}
                    >
                      {column.render
                        ? column.render(row)
                        : ((row as Record<string, unknown>)[column.key] as
                            React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {totalItems === 0 ? 0 : start}-{end} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </button>
          <span className="text-gray-500">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <button
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
