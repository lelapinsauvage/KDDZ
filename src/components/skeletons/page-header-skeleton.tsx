import { Skeleton } from "@/components/ui/skeleton"

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-1 border-b border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <Skeleton className="h-6 w-44" />
      <div className="hidden items-center gap-1.5 sm:flex">
        <Skeleton className="h-3 w-10 rounded-sm" />
        <Skeleton className="size-3 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-sm" />
        <Skeleton className="size-3 rounded-sm" />
        <Skeleton className="h-3 w-20 rounded-sm" />
      </div>
    </div>
  )
}
