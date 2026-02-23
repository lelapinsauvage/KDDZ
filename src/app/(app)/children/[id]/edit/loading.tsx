import { Skeleton } from "@/components/ui/skeleton"

export default function EditChildLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-7 w-48" />
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
