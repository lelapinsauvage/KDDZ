"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function OperationsAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.operations-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-operations-axe-audit"
      auditTriggerId="kiddz-run-operations-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--operations-surface"
    />
  )
}
