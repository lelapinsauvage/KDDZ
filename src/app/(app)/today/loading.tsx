import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-32" />
      </div>

      {/* Quick Actions skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="py-3 border-l-4 border-l-muted">
            <CardContent className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-sm" />
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: roster skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-[180px] rounded-md" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-10" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: menu + alerts skeleton */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-7 rounded-md" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-sm border p-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
