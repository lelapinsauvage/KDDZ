import { IdentityWorldRoom } from "./_components/identity-world-room"
import { finalistIds, type FinalistId } from "../_finalist-data"

type IdentityWorldPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function IdentityWorldPage({ searchParams }: IdentityWorldPageProps) {
  const params = await searchParams
  const requested = Array.isArray(params.direction) ? params.direction[0] : params.direction
  const initialFinalist = finalistIds.includes(requested as FinalistId)
    ? requested as FinalistId
    : finalistIds[0]

  return (
    <IdentityWorldRoom
      axeAuditEnabled={params.audit === "axe"}
      initialFinalist={initialFinalist}
    />
  )
}
