import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

interface FormPageSkeletonProps {
  sections?: number
  fieldsPerSection?: number
  tabs?: number
}

export function FormPageSkeleton({
  sections = 2,
  fieldsPerSection = 6,
  tabs = 5,
}: FormPageSkeletonProps) {
  return (
    <div>
      <PageHeaderSkeleton />

      <div className="p-4 md:p-6">
        {/* Tab bar — matches: line-variant tabs with icons */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
          {Array.from({ length: tabs }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 ${
                i === 0 ? "border-primary" : "border-transparent"
              }`}
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton
                className="h-3.5 rounded-sm"
                style={{ width: `${[56, 48, 68, 52, 60][i % 5]}px` }}
              />
            </div>
          ))}
        </div>

        {/* Card sections */}
        {Array.from({ length: sections }).map((_, section) => (
          <div
            key={section}
            className="mb-6 overflow-hidden rounded-sm border border-border/40 bg-card"
          >
            {/* Card header */}
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-1.5 h-3 w-64 rounded-sm" />
            </div>

            {/* Card content — field grid */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: fieldsPerSection }).map((_, field) => (
                  <div key={field} className="space-y-1.5">
                    <Skeleton className="h-3 w-20 rounded-sm" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Sticky action bar */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-white px-6 py-4">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  )
}
