"use client"

import {
  AxeAuditHarness,
  type AxeAudit,
} from "@/components/design-lab/axe-audit-harness"

export type TerritoryAxeAudit = AxeAudit

export function TerritoryAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.territory-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-territory-axe-audit"
      auditTriggerId="kiddz-run-territory-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--surface"
    />
  )
}
