import { Skeleton } from "@/components/ui/skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

export function ProfileSkeleton() {
  return (
    <div>
      <PageHeaderSkeleton />

      <div className="space-y-4 p-4 md:p-6">
        {/* Avatar + name + badge */}
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* Account information card */}
        <div className="overflow-hidden rounded-sm border border-border/40 bg-card">
          <div className="border-b border-border px-6 py-4">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-4 px-6 py-5">
            {/* Name row */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10 rounded-sm" />
                <Skeleton className="h-3.5 w-36 rounded-sm" />
              </div>
            </div>
            {/* Email row */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10 rounded-sm" />
                <Skeleton className="h-3.5 w-48 rounded-sm" />
              </div>
            </div>
            {/* Role row */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-10 rounded-sm" />
                <Skeleton className="h-3.5 w-24 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
