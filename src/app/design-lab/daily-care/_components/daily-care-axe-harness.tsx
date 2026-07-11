"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function DailyCareAxeHarness({
  enabled,
  signature,
}: {
  enabled: boolean
  signature: string
}) {
  return (
    <AxeAuditHarness
      activeRootSelector='.daily-care-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-daily-care-axe-audit"
      auditTriggerId="kiddz-run-daily-care-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--care-surface"
    />
  )
}
