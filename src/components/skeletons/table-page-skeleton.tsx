import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

interface TablePageSkeletonProps {
  filters?: number
  columns?: number
  rows?: number
  showHeader?: boolean
}

export function TablePageSkeleton({
  filters = 3,
  columns = 5,
  rows = 8,
  showHeader = true,
}: TablePageSkeletonProps) {
  return (
    <div>
      {showHeader && <PageHeaderSkeleton />}

      <div className="space-y-4 p-4 md:p-6">
        {/* Toolbar — matches: search + selects + spacer + buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search input */}
          <Skeleton className="h-9 w-56 rounded-md" />
          {/* Filter selects */}
          {Array.from({ length: filters }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-[120px] rounded-md" />
          ))}
          <div className="flex-1" />
          {/* Action buttons */}
          <Skeleton className="h-9 w-[90px] rounded-md" />
          <Skeleton className="h-9 w-[110px] rounded-md" />
        </div>

        {/* Table — matches: rounded-md border bg-card */}
        <div className="overflow-hidden rounded-md border border-border bg-card">
          {/* Header row */}
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-2.5">
            <Skeleton className="h-3 w-[5%] rounded-sm" />
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-3 rounded-sm"
                style={{
                  width: `${[18, 14, 12, 10, 8, 10][i % 6]}%`,
                }}
              />
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 border-t border-border px-4 py-3"
            >
              {/* Checkbox placeholder */}
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              {/* Avatar circle */}
              <Skeleton className="size-8 shrink-0 rounded-full" />
              {/* Cell values with varied widths */}
              {Array.from({ length: columns }).map((_, col) => (
                <Skeleton
                  key={col}
                  className="h-3.5 rounded-sm"
                  style={{
                    width: `${[16, 12, 10, 8, 6, 9][col % 6]}%`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination — matches: text left + controls right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-3.5 w-32 rounded-sm" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-[70px] rounded-md" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
