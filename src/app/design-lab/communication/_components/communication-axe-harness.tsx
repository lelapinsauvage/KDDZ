"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function CommunicationAxeHarness({
  enabled,
  signature,
}: {
  enabled: boolean
  signature: string
}) {
  return (
    <AxeAuditHarness
      activeRootSelector='.communication-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-communication-axe-audit"
      auditTriggerId="kiddz-run-communication-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--communication-surface"
    />
  )
}
