"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function AcademicRolloverAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.academic-rollover-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-academic-rollover-axe-audit"
      auditTriggerId="kiddz-run-academic-rollover-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--rollover-surface"
    />
  )
}
