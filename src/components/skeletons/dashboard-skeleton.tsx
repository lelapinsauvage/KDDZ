import { Skeleton } from "@/components/ui/skeleton"

function StatCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
      <Skeleton className="h-[3px] w-full rounded-none" />
      <div className="flex items-center justify-between px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-7 w-14 rounded-sm" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 p-4 md:p-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-3 w-44 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* ── Row 1: Overview (3 cards) ── */}
      <div>
        <Skeleton className="mb-3 h-3 w-16 rounded-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Row 2: Compliance (4 cards) ── */}
      <div>
        <Skeleton className="mb-3 h-3 w-24 rounded-sm" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Row 3: Operations (3 cards) ── */}
      <div>
        <Skeleton className="mb-3 h-3 w-20 rounded-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Row 4: Medical (3 cards) ── */}
      <div>
        <Skeleton className="mb-3 h-3 w-24 rounded-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Row 5: Assessments (3 cards) ── */}
      <div>
        <Skeleton className="mb-3 h-3 w-20 rounded-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Charts (3-col) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/40 bg-card"
          >
            <div className="border-b border-border px-5 py-3.5">
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              <Skeleton className="size-44 rounded-full" />
              <div className="flex flex-wrap justify-center gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
