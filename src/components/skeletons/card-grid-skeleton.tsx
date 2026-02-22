import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

interface CardGridSkeletonProps {
  cards?: number
  cols?: number
  showSummary?: boolean
}

export function CardGridSkeleton({
  cards = 6,
  cols = 3,
  showSummary = true,
}: CardGridSkeletonProps) {
  const colsClass =
    cols === 4
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : cols === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div>
      <PageHeaderSkeleton />

      <div className="space-y-6 p-4 md:p-6">
        {/* Summary card — matches: alarm summary */}
        {showSummary && (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52 rounded-sm" />
            </div>
          </div>
        )}

        {/* Card grid */}
        <div className={`grid grid-cols-1 gap-4 ${colsClass}`}>
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded-sm" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
