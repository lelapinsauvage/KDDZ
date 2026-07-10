"use client"

import {
  AxeAuditHarness,
  type AxeAudit,
} from "@/components/design-lab/axe-audit-harness"

export type StateAxeAudit = AxeAudit

export function StateAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.state-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-state-axe-audit"
      auditTriggerId="kiddz-run-state-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--state-surface"
    />
  )
}
