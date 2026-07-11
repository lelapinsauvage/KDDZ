"use client"

import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"

export function ChildWorkspaceAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  return (
    <AxeAuditHarness
      activeRootSelector='.child-workspace-lab[data-axe-audit="axe"]'
      auditNodeId="kiddz-child-workspace-axe-audit"
      auditTriggerId="kiddz-run-child-workspace-axe-audit"
      enabled={enabled}
      signature={signature}
      surfaceToken="--child-surface"
    />
  )
}
