import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton"

export default function ExportLoading() {
  return <CardGridSkeleton cards={5} cols={3} showSummary={false} />
}
