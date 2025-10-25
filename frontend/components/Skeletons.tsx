'use client'

import { cn } from '@/lib/utils'

function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:400%_100%]',
        className
      )}
    />
  )
}

export function FundCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <SkeletonBase className="mb-4 h-6 w-2/3" />
      <SkeletonBase className="mb-6 h-4 w-1/3" />
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div className="flex items-center justify-between" key={idx}>
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, idx) => (
        <div className="rounded-lg bg-white p-4 shadow-sm" key={idx}>
          <SkeletonBase className="mb-2 h-4 w-16" />
          <SkeletonBase className="mb-1 h-6 w-24" />
          <SkeletonBase className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <SkeletonBase className="mb-4 h-5 w-32" />
      <SkeletonBase className="h-64 w-full" />
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <SkeletonBase className="mb-4 h-5 w-48" />
      {[...Array(5)].map((_, idx) => (
        <SkeletonBase className="mb-3 h-10 w-full" key={idx} />
      ))}
    </div>
  )
}
