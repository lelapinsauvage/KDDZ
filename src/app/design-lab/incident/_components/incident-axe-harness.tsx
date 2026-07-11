"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function IncidentAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.incident-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-incident-axe-audit"
      auditTriggerId="kiddz-run-incident-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--incident-surface"
    />
  )
}
