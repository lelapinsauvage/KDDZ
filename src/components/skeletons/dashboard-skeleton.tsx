import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* ── Morning greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-56 rounded-sm" />
          <Skeleton className="h-3 w-44 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* ── KPI stat cards (3-col grid) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/40 bg-card"
          >
            {/* Top accent bar */}
            <Skeleton className="h-[3px] w-full rounded-none" />
            <div className="flex items-center justify-between px-5 py-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-sm" />
                <Skeleton className="h-7 w-14 rounded-sm" />
              </div>
              <Skeleton className="size-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Status board (4-col compliance grid) ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 bg-card px-4 py-5"
          >
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-sm" />
            <Skeleton className="h-6 w-10 rounded-sm" />
          </div>
        ))}
      </div>

      {/* ── Demographics charts (2-col) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/40 bg-card"
          >
            <div className="border-b border-border px-5 py-3.5">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              {/* Donut chart placeholder */}
              <Skeleton className="size-44 rounded-full" />
              {/* Legend */}
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

      {/* ── Action center (3-col grid) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-border/40 bg-card px-5 py-4"
          >
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-28 rounded-sm" />
            </div>
            <Skeleton className="h-5 w-8 rounded-sm" />
          </div>
        ))}
      </div>

      {/* ── Menu + Weekly chart side-by-side ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Today's Menu */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-10 rounded-sm" />
          </div>
          <div className="space-y-3 px-5 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-sm" />
                <Skeleton className="h-3 w-32 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Attendance Chart */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="px-5 py-4">
            {/* Bar chart placeholder */}
            <div className="flex h-[120px] items-end justify-between gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-md"
                  style={{ height: `${[65, 80, 45, 90, 70, 55, 40][i]}%` }}
                />
              ))}
            </div>
            {/* X-axis labels */}
            <div className="mt-2 flex justify-between">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-6 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Insights panel ── */}
      <div className="rounded-2xl border border-border/40 bg-card px-5 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-14 rounded-sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-full"
              style={{ width: `${[140, 160, 120, 180][i]}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
