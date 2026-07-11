"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function FinanceAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.finance-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-finance-axe-audit"
      auditTriggerId="kiddz-run-finance-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--finance-surface"
    />
  )
}
