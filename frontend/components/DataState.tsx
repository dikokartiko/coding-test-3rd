'use client'

import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type DataStateProps = {
  status: 'loading' | 'error' | 'empty'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function DataState({
  status,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: DataStateProps) {
  const icon = {
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    empty: <Inbox className="w-6 h-6 text-gray-400" />,
    loading: (
      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" aria-hidden />
    ),
  }[status]

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm',
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
