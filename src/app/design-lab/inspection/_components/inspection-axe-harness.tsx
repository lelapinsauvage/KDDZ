"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function InspectionAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.inspection-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-inspection-axe-audit"
      auditTriggerId="kiddz-run-inspection-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--inspection-surface"
    />
  )
}
