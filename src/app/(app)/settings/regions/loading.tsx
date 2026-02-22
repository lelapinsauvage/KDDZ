import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton"

export default function RegionsLoading() {
  return <CardGridSkeleton cards={3} cols={3} showSummary={false} />
}
