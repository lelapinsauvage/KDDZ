"use client"

import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  EyeOff,
  FileCheck2,
  FileWarning,
  History,
  Link2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  acceptInspectionException,
  approveInspectionRedaction,
  completeInspectionGeneration,
  createInspectionProfileFixture,
  createInspectionScenario,
  projectInspectionPackage,
  recordInspectionDownload,
  regenerateInspectionAccess,
  replaceInspectionEvidence,
  retryInspectionGeneration,
  selectInspectionProfile,
  startInspectionGeneration,
  type InspectionCapability,
  type InspectionFixtureStage,
  type InspectionPackage,
  type InspectionPackageStatus,
} from "@/lib/redesign-inspection-package-contracts"
import { InspectionAxeHarness } from "./inspection-axe-harness"

type InspectionRole = "manager" | "contributor" | "auditor"

const stages: Array<{ value: InspectionFixtureStage; label: string }> = [
  { value: "profile-required", label: "Profile required" },
  { value: "blocked", label: "Blocking evidence" },
  { value: "exception-review", label: "Exception review" },
  { value: "redaction-review", label: "Redaction review" },
  { value: "ready", label: "Ready to generate" },
  { value: "generating", label: "Generating" },
  { value: "generation-failed", label: "Generation failed" },
  { value: "retrying", label: "Retrying" },
  { value: "ready-download", label: "Ready to download" },
  { value: "link-expired", label: "Access expired" },
  { value: "historical", label: "Historical package" },
]

const roleLabels: Record<InspectionRole, string> = {
  manager: "Nursery manager",
  contributor: "Evidence contributor",
  auditor: "Audit reviewer",
}

const roleCapabilities: Record<InspectionRole, InspectionCapability[]> = {
  manager: [
    "inspection.preflight",
    "inspection.view_sensitive",
    "inspection.contribute",
    "inspection.accept_exception",
    "inspection.generate",
    "inspection.download",
    "inspection.audit",
  ],
  contributor: ["inspection.preflight", "inspection.contribute"],
  auditor: ["inspection.preflight", "inspection.download", "inspection.audit"],
}

const statusContent: Record<InspectionPackageStatus, { eyebrow: string; title: string; detail: string }> = {
  PROFILE_REQUIRED: {
    eyebrow: "Policy decision required",
    title: "Choose an approved evidence profile",
    detail: "The product will not infer inspection requirements from available files or a jurisdiction name.",
  },
  BLOCKED: {
    eyebrow: "Generation blocked",
    title: "One required source is expired",
    detail: "Replace the staff training evidence before this package can move forward.",
  },
  EXCEPTION_REVIEW: {
    eyebrow: "Authority required",
    title: "Review the finance inconsistency",
    detail: "This profile permits an exception only when the authority and reason remain in the manifest history.",
  },
  REDACTION_REVIEW: {
    eyebrow: "Recipient protection",
    title: "Approve the medical redaction plan",
    detail: "The inspector needs incident evidence, not direct child or parent identifiers.",
  },
  READY: {
    eyebrow: "Preflight passed",
    title: "The manifest is ready to generate",
    detail: "Every blocking source, current exception, and recipient redaction is bound to an exact revision.",
  },
  GENERATING: {
    eyebrow: "Server job active",
    title: "Building a checksummed package",
    detail: "The accepted manifest remains fixed while the artifact is assembled and verified.",
  },
  GENERATION_FAILED: {
    eyebrow: "Manifest preserved",
    title: "Storage failed without losing work",
    detail: "Retry the same manifest revision. The previous attempt and failure code remain in history.",
  },
  READY_TO_DOWNLOAD: {
    eyebrow: "Artifact verified",
    title: "The inspection package is ready",
    detail: "Checksums, source revisions, recipient, access expiry, and every download are traceable.",
  },
  LINK_EXPIRED: {
    eyebrow: "Access closed",
    title: "The package is intact; its link expired",
    detail: "Issue a new time-bounded grant instead of silently extending the old recipient access.",
  },
  HISTORICAL: {
    eyebrow: "Source changed",
    title: "This package is now historical",
    detail: "The original artifact remains auditable, but a fresh preflight is required for current evidence.",
  },
}

const domainLabels = {
  BRANCH: "Branch",
  CHILD: "Child",
  STAFF: "Staff",
  POLICY: "Policy",
  MEDICAL: "Medical",
  ATTENDANCE: "Attendance",
  FINANCE: "Finance",
  FACILITY: "Facility",
} as const

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): InspectionFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value) ? (value as InspectionFixtureStage) : "blocked"
}

function parseRole(search: string): InspectionRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as InspectionRole) : "manager"
}

function commandBase(inspectionPackage: InspectionPackage, id: string, role: InspectionRole) {
  const actorIds: Record<InspectionRole, string> = {
    manager: "manager-maya",
    contributor: "contributor-nadia",
    auditor: "auditor-samir",
  }
  return {
    eventId: `${id}-${inspectionPackage.revision}`,
    idempotencyKey: `${id}-${inspectionPackage.revision}-once`,
    actorId: actorIds[role],
    occurredAt: "2026-07-15T10:05:00+01:00",
    expectedRevision: inspectionPackage.revision,
    actorCapabilities: roleCapabilities[role],
  }
}

function evidenceTone(state: string) {
  if (state === "AVAILABLE") return "ready"
  if (state === "INCONSISTENT") return "review"
  return "blocked"
}

function statusIcon(status: InspectionPackageStatus) {
  if (status === "READY_TO_DOWNLOAD") return <CheckCircle2 />
  if (status === "GENERATING") return <LoaderCircle />
  if (status === "HISTORICAL") return <History />
  if (status === "LINK_EXPIRED") return <Clock3 />
  if (status === "PROFILE_REQUIRED") return <FileWarning />
  if (status === "BLOCKED" || status === "GENERATION_FAILED") return <AlertTriangle />
  return <ShieldCheck />
}

export function InspectionLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return <InspectionScenario key={`${stage}:${role}:${axeAudit}`} stage={stage} initialRole={role} axeAudit={axeAudit} />
}

function InspectionScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: InspectionFixtureStage
  initialRole: InspectionRole
  axeAudit: boolean
}) {
  const [inspectionPackage, setInspectionPackage] = useState(() => createInspectionScenario(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(
    () => projectInspectionPackage(inspectionPackage, roleCapabilities[role]),
    [inspectionPackage, role],
  )
  const content = statusContent[projection.status]

  function focusDecision() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => actionHeadingRef.current?.focus())
    })
  }

  function accept(next: InspectionPackage, message: string) {
    setInspectionPackage(next)
    setError("")
    setAnnouncement(message)
    focusDecision()
  }

  function runAction() {
    try {
      if (projection.status === "PROFILE_REQUIRED") {
        accept(
          selectInspectionProfile(inspectionPackage, {
            ...commandBase(inspectionPackage, "select-profile", role),
            profile: createInspectionProfileFixture(),
          }),
          "Approved profile selected. Evidence preflight found one blocking expiry.",
        )
        return
      }
      if (projection.status === "BLOCKED") {
        const evidence = inspectionPackage.evidence.find((item) => item.id === "evidence-staff-training")!
        accept(
          replaceInspectionEvidence(inspectionPackage, {
            ...commandBase(inspectionPackage, "replace-training", role),
            evidenceId: evidence.id,
            expectedSourceRevision: evidence.sourceRevision,
          }),
          "Current staff training evidence attached. The profile now requires exception review.",
        )
        return
      }
      if (projection.status === "EXCEPTION_REVIEW") {
        const evidence = inspectionPackage.evidence.find((item) => item.id === "evidence-finance")!
        accept(
          acceptInspectionException(inspectionPackage, {
            ...commandBase(inspectionPackage, "accept-finance", role),
            requirementId: evidence.requirementId,
            evidenceId: evidence.id,
            expectedSourceRevision: evidence.sourceRevision,
            authority: "Operations director under approved exception policy",
            reason: "The disputed imported opening balance is disclosed and excluded from the period total",
          }),
          "Finance exception accepted with authority and reason. Recipient redaction review remains.",
        )
        return
      }
      if (projection.status === "REDACTION_REVIEW") {
        const evidence = inspectionPackage.evidence.find((item) => item.id === "evidence-medical")!
        accept(
          approveInspectionRedaction(inspectionPackage, {
            ...commandBase(inspectionPackage, "redact-medical", role),
            evidenceId: evidence.id,
            expectedSourceRevision: evidence.sourceRevision,
            fields: ["childName", "parentContact"],
            reason: "Recipient needs incident evidence without direct family identifiers",
          }),
          "Medical identifiers redacted for this recipient. Preflight is ready.",
        )
        return
      }
      if (projection.status === "READY") {
        accept(
          startInspectionGeneration(inspectionPackage, {
            ...commandBase(inspectionPackage, "start-generation", role),
            jobId: `job-inspection-${inspectionPackage.revision + 1}`,
            expectedManifestRevision: inspectionPackage.revision,
          }),
          "Server generation started from the accepted manifest revision.",
        )
        return
      }
      if (projection.status === "GENERATING") {
        accept(
          completeInspectionGeneration(inspectionPackage, {
            ...commandBase(inspectionPackage, "complete-generation", role),
            jobId: inspectionPackage.job!.id,
            artifactId: `artifact-inspection-${inspectionPackage.revision + 1}`,
            manifestChecksum: `sha256:${"a".repeat(64)}`,
            artifactChecksum: `sha256:${"b".repeat(64)}`,
            grantId: `grant-inspector-${inspectionPackage.revision + 1}`,
            expiresAt: "2026-07-16T10:05:00+01:00",
          }),
          "Package completed. Checksums and expiring recipient access are recorded.",
        )
        return
      }
      if (projection.status === "GENERATION_FAILED") {
        accept(
          retryInspectionGeneration(inspectionPackage, {
            ...commandBase(inspectionPackage, "retry-generation", role),
            jobId: `job-retry-${inspectionPackage.revision + 1}`,
            expectedManifestRevision: inspectionPackage.job!.manifestRevision,
          }),
          "Generation retried against the preserved manifest revision.",
        )
        return
      }
      if (projection.status === "LINK_EXPIRED") {
        accept(
          regenerateInspectionAccess(inspectionPackage, {
            ...commandBase(inspectionPackage, "regenerate-access", role),
            grantId: `grant-refreshed-${inspectionPackage.revision + 1}`,
            expiresAt: "2026-07-17T10:05:00+01:00",
          }),
          "New time-bounded recipient access issued. The expired grant remains in audit history.",
        )
        return
      }
      if (projection.status === "READY_TO_DOWNLOAD") {
        const grant = inspectionPackage.grants.find((item) => item.artifactId === inspectionPackage.artifact?.id)!
        accept(
          recordInspectionDownload(inspectionPackage, {
            ...commandBase(inspectionPackage, "record-download", role),
            artifactId: inspectionPackage.artifact!.id,
            grantId: grant.id,
          }),
          "Download accepted and appended to the package audit trail.",
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The inspection transition could not be accepted.")
    }
  }

  function resetScenario() {
    setInspectionPackage(createInspectionScenario(stage))
    setError("")
    setAnnouncement("Inspection scenario reset to its deterministic source fixture.")
    focusDecision()
  }

  const primaryLabel = (() => {
    if (projection.status === "PROFILE_REQUIRED") return "Select approved profile"
    if (projection.status === "BLOCKED") return "Attach current training evidence"
    if (projection.status === "EXCEPTION_REVIEW") return "Accept authorized exception"
    if (projection.status === "REDACTION_REVIEW") return "Approve redaction plan"
    if (projection.status === "READY") return "Generate inspection package"
    if (projection.status === "GENERATING") return "Complete generation job"
    if (projection.status === "GENERATION_FAILED") return "Retry same manifest"
    if (projection.status === "LINK_EXPIRED") return "Regenerate recipient access"
    if (projection.status === "READY_TO_DOWNLOAD") return "Download and record audit"
    return "Historical package"
  })()

  const canRun = (() => {
    if (projection.status === "PROFILE_REQUIRED") return roleCapabilities[role].includes("inspection.preflight")
    if (projection.status === "BLOCKED") return roleCapabilities[role].includes("inspection.contribute")
    if (projection.status === "EXCEPTION_REVIEW") return projection.canAcceptException
    if (projection.status === "REDACTION_REVIEW") return roleCapabilities[role].includes("inspection.view_sensitive")
    if (["READY", "GENERATING", "GENERATION_FAILED"].includes(projection.status)) return projection.canGenerate
    if (["LINK_EXPIRED", "READY_TO_DOWNLOAD"].includes(projection.status)) return projection.canDownload
    return false
  })()

  const currentGrant = inspectionPackage.grants.find((item) => item.artifactId === inspectionPackage.artifact?.id)

  return (
    <div className="inspection-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-status={projection.status}>
      <InspectionAxeHarness enabled={axeAudit} signature={`inspection:${stage}:${role}:${projection.status}:${inspectionPackage.revision}`} />
      <header className="inspection-topbar">
        <strong>Kiddz Online</strong>
        <span>Reports / Inspection / Riverside</span>
        <div className="inspection-topbar__controls">
          <label>
            <span>Scenario</span>
            <select
              aria-label="Inspection test scenario"
              value={stage}
              onChange={(event) => {
                const url = new URL(window.location.href)
                url.searchParams.set("state", event.target.value)
                window.history.pushState({}, "", url)
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
            >
              {stages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select aria-label="Inspection viewer role" value={role} onChange={(event) => setRole(event.target.value as InspectionRole)}>
              {(Object.keys(roleLabels) as InspectionRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
            </select>
          </label>
          <button type="button" onClick={resetScenario} title="Reset inspection scenario" aria-label="Reset inspection scenario"><RefreshCw aria-hidden="true" /></button>
        </div>
      </header>

      <main className="inspection-main">
        <header className="inspection-heading">
          <div><span>Inspection evidence</span><h1>Know what is ready before the deadline.</h1></div>
          <p>Preflight exact source revisions, protect recipient access, and generate one accountable package without confusing evidence with a database backup.</p>
        </header>

        <dl className="inspection-context" aria-label="Inspection package context">
          <div><dt>Branch</dt><dd>{inspectionPackage.branch.label}</dd></div>
          <div><dt>Evidence period</dt><dd>{inspectionPackage.dateRange.from} to {inspectionPackage.dateRange.to}</dd></div>
          <div><dt>Recipient</dt><dd>{inspectionPackage.recipient}</dd></div>
          <div><dt>Package revision</dt><dd>{inspectionPackage.revision}</dd></div>
        </dl>

        <section className={`inspection-decision inspection-decision--${projection.status.toLowerCase()}`} aria-labelledby="inspection-decision-title">
          <div className="inspection-decision__icon" aria-hidden="true">{statusIcon(projection.status)}</div>
          <div className="inspection-decision__copy">
            <span>{content.eyebrow}</span>
            <h2 id="inspection-decision-title" ref={actionHeadingRef} tabIndex={-1}>{content.title}</h2>
            <p>{content.detail}</p>
          </div>
          <div className="inspection-decision__action">
            <button type="button" onClick={runAction} disabled={!canRun || projection.status === "HISTORICAL"}>
              {projection.status === "READY_TO_DOWNLOAD" ? <Download aria-hidden="true" /> : projection.status === "GENERATION_FAILED" ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
              {primaryLabel}
            </button>
            {!canRun && projection.status !== "HISTORICAL" ? <small>{roleLabels[role]} does not hold the required capability.</small> : null}
          </div>
        </section>

        <div className="inspection-grid">
          <section className="inspection-evidence" aria-labelledby="inspection-evidence-title">
            <header>
              <div><span>Evidence manifest</span><h2 id="inspection-evidence-title">{inspectionPackage.profile?.label ?? "No profile selected"}</h2></div>
              <strong>{inspectionPackage.manifest.length || "-"} requirements</strong>
            </header>
            {projection.evidence.map((evidence) => {
              const entry = inspectionPackage.manifest.find((item) => item.evidenceId === evidence.id)
              return (
                <article key={evidence.id} className={`inspection-evidence__row inspection-evidence__row--${evidenceTone(evidence.state)}`}>
                  <div className="inspection-evidence__state" aria-hidden="true">
                    {evidence.title === "Restricted evidence" ? <EyeOff /> : evidence.state === "AVAILABLE" ? <CheckCircle2 /> : evidence.state === "INCONSISTENT" ? <FileWarning /> : <AlertTriangle />}
                  </div>
                  <div className="inspection-evidence__identity">
                    <span>{domainLabels[evidence.domain]}</span>
                    <h3>{evidence.title}</h3>
                    <p>{evidence.owner} · source revision {evidence.sourceRevision}</p>
                  </div>
                  <div className="inspection-evidence__meta">
                    <span>{evidence.state.toLowerCase()}</span>
                    {entry?.consequence === "EXCEPTION_ALLOWED" ? <small>Exception allowed</small> : <small>{entry?.consequence === "WARNING" ? "Advisory" : "Required"}</small>}
                  </div>
                  {evidence.sourceRef ? <a href={evidence.sourceRef}><Link2 aria-hidden="true" />Source</a> : <span className="inspection-evidence__locked"><LockKeyhole aria-hidden="true" />Hidden</span>}
                </article>
              )
            })}
            {!inspectionPackage.profile ? <div className="inspection-empty"><Archive aria-hidden="true" /><p>Choose an approved profile to compare required evidence with current records.</p></div> : null}
          </section>

          <aside className="inspection-rail" aria-label="Package provenance and history">
            <section>
              <span>Package provenance</span>
              <h2>{inspectionPackage.artifact ? "Verified artifact" : "Preflight manifest"}</h2>
              <dl>
                <div><dt>Profile</dt><dd>{inspectionPackage.profile ? `v${inspectionPackage.profile.version}` : "Not selected"}</dd></div>
                <div><dt>Manifest</dt><dd>{inspectionPackage.artifact ? `rev ${inspectionPackage.artifact.manifestRevision}` : `rev ${inspectionPackage.revision}`}</dd></div>
                <div><dt>Job</dt><dd>{inspectionPackage.job ? `${inspectionPackage.job.status.toLowerCase()} · attempt ${inspectionPackage.job.attempt}` : "Not started"}</dd></div>
                <div><dt>Access</dt><dd>{currentGrant ? `Expires ${currentGrant.expiresAt.slice(0, 16).replace("T", " ")}` : "Not issued"}</dd></div>
              </dl>
              {inspectionPackage.artifact ? <div className="inspection-checksum"><FileCheck2 aria-hidden="true" /><span><strong>SHA-256 recorded</strong><small>{Object.keys(inspectionPackage.artifact.sourceRevisionSnapshot).length} exact source revisions</small></span></div> : null}
            </section>
            <section>
              <span>Accepted history</span>
              <h2>{inspectionPackage.events.length} events</h2>
              <ol className="inspection-history">
                {inspectionPackage.events.slice(-5).reverse().map((event) => (
                  <li key={event.eventId}><span>{event.kind.replaceAll("_", " ").toLowerCase()}</span><small>{event.detail}</small></li>
                ))}
              </ol>
              {!inspectionPackage.events.length ? <p className="inspection-history__empty">No profile or package decision has been accepted.</p> : null}
            </section>
            <section className="inspection-backup-note">
              <Archive aria-hidden="true" />
              <div><strong>Database backup is separate</strong><p>SQL restoration preserves the database. It does not prove that an inspection manifest is complete, current, redacted, or recipient-safe.</p></div>
            </section>
          </aside>
        </div>

        <div className="inspection-announcer" aria-live="polite" aria-atomic="true">{error || announcement}</div>
        {error ? <div className="inspection-error" role="alert"><AlertTriangle aria-hidden="true" />{error}</div> : null}
      </main>
    </div>
  )
}
