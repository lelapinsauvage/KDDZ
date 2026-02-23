import { Skeleton } from "@/components/ui/skeleton"

export default function MedicalLoading() {
  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
        <Skeleton className="ml-auto h-8 w-28 rounded-xl" />
      </div>
      {/* Timeline */}
      <div className="rounded-2xl border bg-card">
        <div className="px-5 py-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="border-t px-5 pb-4 pt-3 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
              <Skeleton className="size-7 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      {/* Vaccination schedule */}
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center gap-2 px-5 py-4">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="border-t px-5 pb-4 pt-3 space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
