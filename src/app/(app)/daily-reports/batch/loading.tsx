import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton"

export default function BatchReportLoading() {
  return (
    <div>
      <PageHeaderSkeleton />

      <div className="space-y-4 p-4 md:p-6">
        {/* Filter + progress bar */}
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-[180px] rounded-md" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-20 rounded-sm" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>

        {/* Class group sections */}
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g}>
            {/* Class header */}
            <Skeleton className="h-10 w-full rounded-t-lg" />
            {/* Child rows */}
            <div className="rounded-b-lg border border-t-0 border-border/60 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/40" : ""}`}>
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32 rounded-sm" />
                  <div className="flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="size-4 rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
