import { notFound } from "next/navigation"
import { TerritoryPrototype } from "../_components/territory-prototype"
import { territoryMeta, type TerritoryId } from "../_data"

export function generateStaticParams() {
  return Object.keys(territoryMeta).map((territory) => ({ territory }))
}

export default async function TerritoryPage({
  params,
}: {
  params: Promise<{ territory: string }>
}) {
  const { territory } = await params

  if (!(territory in territoryMeta)) notFound()

  return <TerritoryPrototype territory={territory as TerritoryId} />
}
