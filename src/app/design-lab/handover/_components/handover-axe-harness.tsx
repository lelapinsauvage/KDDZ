"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function HandoverAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.handover-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-handover-axe-audit"
      auditTriggerId="kiddz-run-handover-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--handover-surface"
    />
  )
}
