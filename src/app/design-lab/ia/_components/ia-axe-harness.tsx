"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function IaAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.ia-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-ia-axe-audit"
      auditTriggerId="kiddz-run-ia-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--ia-surface"
    />
  )
}
