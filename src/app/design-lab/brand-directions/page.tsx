import { BrandDirectionRoom } from "./_components/brand-direction-room"
import { brandDirections, type BrandDirectionId } from "./_data"

type BrandDirectionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BrandDirectionsPage({ searchParams }: BrandDirectionsPageProps) {
  const params = await searchParams
  const requested = Array.isArray(params.direction) ? params.direction[0] : params.direction
  const initialDirection = brandDirections.some((direction) => direction.id === requested)
    ? requested as BrandDirectionId
    : null

  return (
    <BrandDirectionRoom
      axeAuditEnabled={params.audit === "axe"}
      initialDirection={initialDirection}
    />
  )
}
