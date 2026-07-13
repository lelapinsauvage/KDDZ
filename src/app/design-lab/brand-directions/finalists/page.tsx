import { FinalistProofRoom } from "./_components/finalist-proof-room"
import { finalistIds, type FinalistId } from "../_finalist-data"

type FinalistProofPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FinalistProofPage({ searchParams }: FinalistProofPageProps) {
  const params = await searchParams
  const requested = Array.isArray(params.direction) ? params.direction[0] : params.direction
  const initialFinalist = finalistIds.includes(requested as FinalistId)
    ? requested as FinalistId
    : finalistIds[0]

  return (
    <FinalistProofRoom
      axeAuditEnabled={params.audit === "axe"}
      initialFinalist={initialFinalist}
    />
  )
}
