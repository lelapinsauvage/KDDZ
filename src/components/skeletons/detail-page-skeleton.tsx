import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

export function DetailPageSkeleton() {
  return (
    <div>
      <PageHeaderSkeleton />

      {/* Sub-nav tab bar — matches: child-sub-nav.tsx */}
      <div className="border-b border-border bg-white px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 ${
                i === 0 ? "border-primary" : "border-transparent"
              }`}
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton
                className="h-3.5 rounded-sm"
                style={{ width: `${[60, 72, 64, 56, 68, 52][i]}px` }}
              />
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        {/* Content card with form-like fields */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="border-b border-border px-6 py-4">
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded-sm" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
