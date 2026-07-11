"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function StaffingAxeHarness({
  enabled,
  signature,
}: {
  enabled: boolean
  signature: string
}) {
  return (
    <AxeAuditHarness
      activeRootSelector='.staffing-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-staffing-axe-audit"
      auditTriggerId="kiddz-run-staffing-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--staffing-surface"
    />
  )
}
