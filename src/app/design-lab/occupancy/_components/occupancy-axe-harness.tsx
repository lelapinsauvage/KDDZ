"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function OccupancyAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.occupancy-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-occupancy-axe-audit"
      auditTriggerId="kiddz-run-occupancy-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--occupancy-surface"
    />
  )
}
