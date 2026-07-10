"use client"

import type { AxeResults, Result } from "axe-core"
import { useEffect, useRef } from "react"

type TerritoryAxeFinding = {
  id: string
  impact: string | null
  description: string
  help: string
  helpUrl: string
  tags: string[]
  nodes: Array<{
    target: string[]
    html: string
    failureSummary: string | null
  }>
}

export type TerritoryAxeAudit = {
  status: "running" | "complete" | "error"
  signature: string
  version?: string
  timestamp?: string
  passes?: number
  violations?: TerritoryAxeFinding[]
  incomplete?: TerritoryAxeFinding[]
  error?: string
}

const axeRunOptions = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
  },
  resultTypes: ["violations", "incomplete"] as Array<"violations" | "incomplete">,
}

const auditNodeId = "kiddz-territory-axe-audit"
const auditTriggerId = "kiddz-run-territory-axe-audit"

function publishAudit(audit: TerritoryAxeAudit) {
  let node = document.getElementById(auditNodeId) as HTMLScriptElement | null
  if (!node) {
    node = document.createElement("script")
    node.id = auditNodeId
    node.type = "application/json"
    document.head.append(node)
  }
  node.dataset.status = audit.status
  node.textContent = JSON.stringify(audit)
}

function summarizeFinding(finding: Result): TerritoryAxeFinding {
  return {
    id: finding.id,
    impact: finding.impact ?? null,
    description: finding.description,
    help: finding.help,
    helpUrl: finding.helpUrl,
    tags: finding.tags,
    nodes: finding.nodes.map((node) => ({
      target: node.target.map(String),
      html: node.html,
      failureSummary: node.failureSummary ?? null,
    })),
  }
}

function summarizeResults(signature: string, results: AxeResults): TerritoryAxeAudit {
  return {
    status: "complete",
    signature,
    version: results.testEngine.version,
    timestamp: results.timestamp,
    passes: results.passes.length,
    violations: results.violations.map(summarizeFinding),
    incomplete: results.incomplete.map(summarizeFinding),
  }
}

export function TerritoryAxeHarness({ enabled, signature }: { enabled: boolean; signature: string }) {
  const requestIdRef = useRef(0)
  const auditQueueRef = useRef<Promise<void>>(Promise.resolve())
  const auditRunnerRef = useRef<(() => Promise<TerritoryAxeAudit>) | null>(null)

  useEffect(() => {
    if (!enabled) {
      auditRunnerRef.current = null
      document.getElementById(auditNodeId)?.remove()
      return
    }

    const runAudit = () => {
      const requestId = ++requestIdRef.current
      const runtimeSignature = `${signature}:${window.innerWidth}x${window.innerHeight}`
      const execute = async () => {
        const running: TerritoryAxeAudit = { status: "running", signature: runtimeSignature }
        publishAudit(running)

        try {
          // Measure final colors and geometry after the prototype entrance transition settles.
          await new Promise((resolve) => window.setTimeout(resolve, 300))
          if (requestId !== requestIdRef.current) return running

          const axe = (await import("axe-core")).default
          const results = await axe.run(document, axeRunOptions)
          if (requestId !== requestIdRef.current) return running

          const completed = summarizeResults(runtimeSignature, results)
          publishAudit(completed)
          return completed
        } catch (error) {
          const failed: TerritoryAxeAudit = {
            status: "error",
            signature: runtimeSignature,
            error: error instanceof Error ? error.message : String(error),
          }
          publishAudit(failed)
          return failed
        }
      }

      const queuedAudit = auditQueueRef.current.catch(() => undefined).then(execute)
      auditQueueRef.current = queuedAudit.then(() => undefined, () => undefined)
      return queuedAudit
    }

    auditRunnerRef.current = runAudit
    void runAudit()

    return () => {
      requestIdRef.current += 1
      if (auditRunnerRef.current === runAudit) auditRunnerRef.current = null
      window.queueMicrotask(() => {
        const activeHarness = document.querySelector('.territory-lab[data-axe-audit="axe"]')
        if (!activeHarness) document.getElementById(auditNodeId)?.remove()
      })
    }
  }, [enabled, signature])

  if (!enabled) return null

  return (
    <button
      aria-hidden="true"
      id={auditTriggerId}
      onClick={() => void auditRunnerRef.current?.()}
      style={{
        blockSize: 8,
        background: "var(--surface)",
        border: 0,
        color: "transparent",
        inlineSize: 8,
        insetBlockEnd: 2,
        insetInlineEnd: 2,
        padding: 0,
        position: "fixed",
        zIndex: 2147483647,
      }}
      tabIndex={-1}
      type="button"
    />
  )
}
