"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function ActionCenterAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.action-center-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-action-center-axe-audit"
      auditTriggerId="kiddz-run-action-center-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--action-surface"
    />
  )
}
