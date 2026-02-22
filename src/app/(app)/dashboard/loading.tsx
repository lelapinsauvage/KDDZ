import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      {/* 5 status pillars — taller to match icon + metric layout */}
      <div className="flex gap-3 overflow-hidden md:grid md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 min-w-[120px] flex-1 rounded-2xl" />
        ))}
      </div>

      {/* Action list */}
      <Skeleton className="h-40 rounded-2xl" />

      {/* Menu + Chart side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>

      {/* Insights */}
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  )
}
