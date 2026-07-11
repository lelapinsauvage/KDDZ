"use client"

import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  DatabaseBackup,
  FileCheck2,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import {
  approveAcademicRollover,
  capabilitiesForAcademicRolloverRole,
  captureAcademicRolloverBackup,
  confirmAcademicRolloverImpact,
  confirmAcademicRolloverSources,
  createAcademicRolloverFixture,
  deriveAcademicRolloverStatus,
  executeAcademicRollover,
  projectAcademicRolloverForRole,
  rollbackAcademicRollover,
  runAcademicRolloverPreflight,
  saveAcademicRolloverPlan,
  validateAcademicRollover,
  verifyAcademicRolloverBackup,
  type AcademicRolloverCommand,
  type AcademicRolloverFixtureStage,
  type AcademicRolloverRole,
  type AcademicRolloverSession,
  type AcademicRolloverStatus,
} from "@/lib/redesign-academic-rollover-contracts"
import { AcademicRolloverAxeHarness } from "./academic-rollover-axe-harness"

const stages: Array<{ value: AcademicRolloverFixtureStage; label: string }> = [
  { value: "source-gap", label: "Source gap" },
  { value: "plan-draft", label: "Plan draft" },
  { value: "preflight-blocked", label: "Preflight blocked" },
  { value: "impact-review", label: "Impact review" },
  { value: "backup-pending", label: "Backup pending" },
  { value: "backup-unverified", label: "Backup unverified" },
  { value: "approval-required", label: "Approval required" },
  { value: "ready-to-execute", label: "Ready to execute" },
  { value: "execution-accepted", label: "Execution accepted" },
  { value: "validation-failed", label: "Validation failed" },
  { value: "rollback-confirmed", label: "Rollback confirmed" },
  { value: "completed", label: "Completed" },
]

const roleLabels: Record<AcademicRolloverRole, string> = {
  administrator: "Administrator",
  coordinator: "Rollover coordinator",
  auditor: "Data auditor",
}

const content: Record<AcademicRolloverStatus, { eyebrow: string; title: string; detail: string; action: string }> = {
  SOURCE_GAP: { eyebrow: "Planning withheld", title: "The rollover source set is incomplete", detail: "The active year, rosters, classes, capacity, legacy adapter, schema, and policy must resolve together.", action: "Confirm source set" },
  PLAN_DRAFT: { eyebrow: "No production change", title: "Build a versioned carry-forward plan", detail: "Assignments, child numbers, optional domains, dates, and unselected-child policy remain a draft.", action: "Save and preflight plan" },
  PREFLIGHT_BLOCKED: { eyebrow: "Three blocking conflicts", title: "The plan cannot advance safely", detail: "A duplicate child number, unapproved branch transfer, and undecided unselected-child policy need correction.", action: "Resolve and rerun preflight" },
  IMPACT_REVIEW: { eyebrow: "Dry run passed", title: "Review the exact operational consequence", detail: "Selected and unselected records, classes, branches, and optional domains are explicit before backup work starts.", action: "Confirm impact" },
  BACKUP_PENDING: { eyebrow: "Recovery not captured", title: "Create an immutable database snapshot", detail: "The rollover remains blocked until a checksummed artifact exists outside the transaction boundary.", action: "Capture pg_dump backup" },
  BACKUP_UNVERIFIED: { eyebrow: "Snapshot captured", title: "A file is not recovery proof", detail: "Restore the exact checksum into an isolated target and verify schema, rows, foreign keys, and sampled invariants.", action: "Verify isolated restore" },
  APPROVAL_REQUIRED: { eyebrow: "Recovery verified", title: "Two distinct approvals are required", detail: "Operator and data-custodian approvals bind the current plan revision and verified backup.", action: "Record required approval" },
  READY_TO_EXECUTE: { eyebrow: "All gates current", title: "Acquire the organization lock and execute", detail: "Execution revalidates source revisions and creates one atomic transition; completion still waits for post-cutover checks.", action: "Execute rollover" },
  EXECUTION_ACCEPTED: { eyebrow: "Transaction accepted", title: "Validate the cutover before completion", detail: "Exactly one active year, assignments, child history, legacy adapter, and unrelated rows must all agree.", action: "Run post-cutover validation" },
  VALIDATION_FAILED: { eyebrow: "Legacy adapter mismatch", title: "Completion is blocked; recovery is required", detail: "The accepted execution remains auditable. Restore only from the verified checksum and prove the previous state.", action: "Restore verified backup" },
  ROLLBACK_CONFIRMED: { eyebrow: "Previous year restored", title: "Rollback evidence is complete", detail: "The failed execution, validation failure, backup, and recovery receipt remain linked for audit.", action: "No further transition" },
  COMPLETED: { eyebrow: "All invariants passed", title: "The academic rollover is complete", detail: "The new year is active only after transaction, adapter, history, assignment, and unrelated-row checks pass.", action: "Completed" },
}

function subscribe(onChange: () => void) { window.addEventListener("popstate", onChange); return () => window.removeEventListener("popstate", onChange) }
function snapshot() { return window.location.search }
function parseStage(search: string): AcademicRolloverFixtureStage { const value = new URLSearchParams(search).get("state"); return stages.some((item) => item.value === value) ? value as AcademicRolloverFixtureStage : "impact-review" }
function parseRole(search: string): AcademicRolloverRole { const value = new URLSearchParams(search).get("role"); return value && value in roleLabels ? value as AcademicRolloverRole : "administrator" }
function navigate(next: { state?: string; role?: string }) { const params = new URLSearchParams(window.location.search); if (next.state) params.set("state", next.state); if (next.role) params.set("role", next.role); window.history.pushState({}, "", `${window.location.pathname}?${params}`); window.dispatchEvent(new PopStateEvent("popstate")) }

function commandBase(session: AcademicRolloverSession, key: string, role: AcademicRolloverRole, actor?: string): AcademicRolloverCommand {
  const actorId = actor ?? (role === "administrator" ? "admin-ava" : role === "coordinator" ? "coordinator-maya" : "auditor-ines")
  const actorRole: AcademicRolloverRole = actorId.startsWith("auditor-") ? "auditor" : actorId.startsWith("coordinator-") ? "coordinator" : "administrator"
  return { eventId: `${key}-${session.revision}`, idempotencyKey: `${key}-${session.revision}-once`, actorId, occurredAt: "2027-07-18T09:00:00.000Z", expectedRevision: session.revision, actorCapabilities: capabilitiesForAcademicRolloverRole(actorRole) }
}

const validChildren = [
  { childId: "child-amelie", childName: "Amelie Haddad", sourceBranchId: "branch-riverside", targetBranchId: "branch-riverside", targetClassId: "class-meadow", childNumber: "RV272801", allowBranchTransfer: false },
  { childId: "child-noah", childName: "Noah Mansour", sourceBranchId: "branch-riverside", targetBranchId: "branch-riverside", targetClassId: "class-seedlings", childNumber: "RV272802", allowBranchTransfer: false },
  { childId: "child-lina", childName: "Lina Farah", sourceBranchId: "branch-riverside", targetBranchId: "branch-riverside", targetClassId: "class-sunroom", childNumber: "RV272803", allowBranchTransfer: false },
]
const validTeachers = [
  { teacherId: "teacher-sophie", teacherName: "Sophie Martin", sourceBranchId: "branch-riverside", targetBranchId: "branch-riverside", targetClassId: "class-meadow", allowBranchTransfer: false },
  { teacherId: "teacher-nina", teacherName: "Nina Saleh", sourceBranchId: "branch-riverside", targetBranchId: "branch-riverside", targetClassId: "class-seedlings", allowBranchTransfer: false },
]
const passChecks = { exactlyOneActiveYear: true, selectedChildrenAssigned: true, selectedTeachersAssigned: true, childHistoryComplete: true, legacyYearAdapterUpdated: true, unrelatedRowsUnchanged: true }

export function AcademicRolloverLab() {
  const search = useSyncExternalStore(subscribe, snapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const audit = new URLSearchParams(search).get("audit") === "axe"
  return <Scenario key={`${stage}:${role}:${audit}`} stage={stage} initialRole={role} audit={audit} />
}

function Scenario({ stage, initialRole, audit }: { stage: AcademicRolloverFixtureStage; initialRole: AcademicRolloverRole; audit: boolean }) {
  const [session, setSession] = useState(() => createAcademicRolloverFixture(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(() => projectAcademicRolloverForRole(session, role), [session, role])
  const status = deriveAcademicRolloverStatus(session)
  const copy = content[status]
  const canAct = role === "administrator" || (role === "coordinator" && ["SOURCE_GAP", "PLAN_DRAFT", "PREFLIGHT_BLOCKED", "IMPACT_REVIEW"].includes(status)) || (role === "auditor" && ["BACKUP_UNVERIFIED", "APPROVAL_REQUIRED", "EXECUTION_ACCEPTED"].includes(status))

  function accept(next: AcademicRolloverSession, message: string) { setSession(next); setError(""); setAnnouncement(message); requestAnimationFrame(() => requestAnimationFrame(() => headingRef.current?.focus())) }
  function saveAndPreflight(current: AcademicRolloverSession, key: string) {
    let next = saveAcademicRolloverPlan(current, { ...commandBase(current, `${key}-save`, role), fromYearId: "school-year-2026-2027", fromYearLabel: "2026-2027", toYearLabel: "2027-2028", startDate: "2027-09-01", endDate: "2028-06-30", children: validChildren, teachers: validTeachers, optionalDomains: ["HOLIDAYS", "VACCINATIONS"], unselectedChildPolicy: "RETAIN_OLD_YEAR" })
    next = runAcademicRolloverPreflight(next, commandBase(next, `${key}-preflight`, role))
    return next
  }
  function runAction() {
    try {
      if (status === "SOURCE_GAP") return accept(confirmAcademicRolloverSources(session, { ...commandBase(session, "sources", role), sources: session.requiredSources.map((item) => ({ ...item })) }), "Seven source revisions confirmed. Planning can begin without changing records.")
      if (status === "PLAN_DRAFT") return accept(saveAndPreflight(session, "plan"), "Plan revision one saved and passed dry-run preflight.")
      if (status === "PREFLIGHT_BLOCKED") return accept(saveAndPreflight(session, "resolve"), "All three blockers resolved in a new plan revision; preflight now passes.")
      if (status === "IMPACT_REVIEW") return accept(confirmAcademicRolloverImpact(session, commandBase(session, "impact", role)), "Impact confirmed for three children, two teachers, and one unselected child.")
      if (status === "BACKUP_PENDING") return accept(captureAcademicRolloverBackup(session, { ...commandBase(session, "backup", role), engine: "pg_dump", databaseIdentity: "garderie-production", storageKey: "legacy-archives/newyear/2027-2028/backup.sql", bytes: 18_240_000, sha256: "a".repeat(64), immutable: true, schemaVersion: "2026071101" }), "Immutable pg_dump captured with checksum. It is not yet recovery proof.")
      if (status === "BACKUP_UNVERIFIED") return accept(verifyAcademicRolloverBackup(session, { ...commandBase(session, "verify-backup", role, "auditor-ines"), restoreProof: { isolatedTargetId: "restore-drill-2027-07-18", checksumMatch: true, schemaVersionMatch: true, rowCountMatch: true, foreignKeysValid: true, sampledInvariantsValid: true, restoredAt: "2027-07-18T10:00:00.000Z" } }), "Isolated restore verified checksum, schema, rows, foreign keys, and sampled invariants.")
      if (status === "APPROVAL_REQUIRED") {
        const hasOperator = session.approvals.some((item) => item.type === "OPERATOR")
        return accept(approveAcademicRollover(session, { ...commandBase(session, hasOperator ? "custodian-approval" : "operator-approval", role, hasOperator ? "auditor-ines" : "admin-ava"), approvalType: hasOperator ? "DATA_CUSTODIAN" : "OPERATOR" }), hasOperator ? "Distinct data-custodian approval recorded. Execution is ready." : "Operator approval recorded. A distinct data custodian is still required.")
      }
      if (status === "READY_TO_EXECUTE") return accept(executeAcademicRollover(session, { ...commandBase(session, "execute", role), lockId: "organization-riverside-rollover-lock" }), "Atomic rollover accepted under the organization lock. Validation remains open.")
      if (status === "EXECUTION_ACCEPTED") return accept(validateAcademicRollover(session, { ...commandBase(session, "validate", role, "auditor-ines"), checks: passChecks }), "All six post-cutover invariants passed. The rollover is complete.")
      if (status === "VALIDATION_FAILED") return accept(rollbackAcademicRollover(session, { ...commandBase(session, "rollback", role), checksumMatch: true, previousYearRestored: true, rowCountsMatch: true }), "Verified backup restored the previous active year and row counts.")
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The transition was rejected") }
  }

  return (
    <div className="academic-rollover-lab" data-axe-audit={audit ? "axe" : undefined} data-role={role} data-status={status.toLowerCase()}>
      <header className="rollover-topbar"><strong>Kiddz Online</strong><span>Territory-neutral academic rollover lifecycle</span><div className="rollover-controls"><select aria-label="Rollover state" value={stage} onChange={(event) => navigate({ state: event.target.value })}>{stages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select aria-label="Rollover role" value={role} onChange={(event) => { const next = event.target.value as AcademicRolloverRole; setRole(next); navigate({ role: next }) }}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" aria-label="Reset rollover scenario" title="Reset" onClick={() => setSession(createAcademicRolloverFixture(stage))}><RefreshCw aria-hidden="true" /></button></div></header>
      <main className="rollover-main">
        <section className="rollover-heading"><div><span>Wave 6 · Data administration</span><h1>Accountable academic rollover</h1></div><p>Plan, backup, restore proof, approval, execution, validation, rollback, and completion remain separate so irreversible administration stays recoverable.</p></section>
        <dl className="rollover-context"><div><dt>Organization</dt><dd>Riverside Nursery</dd></div><div><dt>Role</dt><dd>{roleLabels[role]}</dd></div><div><dt>Transition</dt><dd>{projection.fromYear && projection.toYear ? `${projection.fromYear} → ${projection.toYear}` : "Not planned"}</dd></div><div><dt>Plan revision</dt><dd>{projection.planRevision ?? "None"}</dd></div><div><dt>Backup</dt><dd>{projection.backupStatus.toLowerCase().replace("_", " ")}</dd></div></dl>
        <section className={`rollover-decision rollover-decision--${status.toLowerCase()}`}><div className="rollover-decision__icon" aria-hidden="true">{status === "COMPLETED" || status === "ROLLBACK_CONFIRMED" ? <CheckCircle2 /> : status === "PREFLIGHT_BLOCKED" || status === "VALIDATION_FAILED" ? <AlertTriangle /> : status.includes("BACKUP") ? <DatabaseBackup /> : <ShieldCheck />}</div><div className="rollover-decision__copy"><span>{copy.eyebrow}</span><h2 ref={headingRef} tabIndex={-1}>{copy.title}</h2><p>{copy.detail}</p></div><div className="rollover-decision__action"><button type="button" onClick={runAction} disabled={!canAct || status === "COMPLETED" || status === "ROLLBACK_CONFIRMED"}>{status === "VALIDATION_FAILED" ? <ArchiveRestore aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}{copy.action}</button><small>{canAct ? "Accepted transitions announce the result and return focus here." : "This role can inspect only the evidence inside its assigned responsibility."}</small></div></section>
        {error ? <p className="rollover-error" role="alert"><AlertTriangle aria-hidden="true" />{error}</p> : null}<p className="rollover-announcer" aria-live="polite">{announcement}</p>
        <section className="rollover-plan"><header><div><span>Dry-run plan</span><h2>Carry-forward assignments</h2></div><strong>{projection.impact ? `${projection.impact.childrenSelected} children · ${projection.impact.teachersSelected} teachers` : "Not calculated"}</strong></header>{projection.childAssignments ? <div className="rollover-table"><div className="rollover-row rollover-row--head"><span>Record</span><span>Target class</span><span>New number</span><span>Branch</span></div>{projection.childAssignments.map((item) => <div className="rollover-row" key={item.childId}><div><small>Child</small><strong>{item.childName}</strong></div><div><small>Class</small><strong>{item.targetClassId.replace("class-", "")}</strong></div><div><small>Number</small><strong>{item.childNumber}</strong></div><div><small>Transfer</small><strong>{item.sourceBranchId === item.targetBranchId ? "Same branch" : "Cross branch"}</strong></div></div>)}</div> : <Restricted text="Auditors receive counts and recovery evidence without child or teacher identities." />}</section>
        <div className="rollover-grid"><Evidence title="Preflight and impact" icon={<UsersRound aria-hidden="true" />}><dl><div><dt>Blockers</dt><dd>{projection.blockerCount}</dd></div><div><dt>Classes affected</dt><dd>{projection.impact?.classesAffected ?? 0}</dd></div><div><dt>Branches affected</dt><dd>{projection.impact?.branchesAffected ?? 0}</dd></div><div><dt>Unselected children</dt><dd>{projection.impact?.unselectedChildren ?? 0}</dd></div></dl>{projection.blockers?.map((item) => <p className="rollover-blocker" key={item.id}>{item.message}</p>)}</Evidence><Evidence title="Recovery evidence" icon={<DatabaseBackup aria-hidden="true" />}>{projection.backup ? <dl><div><dt>Engine</dt><dd>{projection.backup.engine}</dd></div><div><dt>Status</dt><dd>{projection.backup.status.toLowerCase()}</dd></div><div><dt>Immutable</dt><dd>{projection.backup.immutable ? "Yes" : "No"}</dd></div><div><dt>Restore drill</dt><dd>{projection.backup.restoreProof ? "Passed" : "Pending"}</dd></div></dl> : <Restricted text={role === "coordinator" ? "Storage identity and checksums are restricted to administrators and auditors." : "No backup artifact exists yet."} />}</Evidence><Evidence title="Approvals and cutover" icon={<LockKeyhole aria-hidden="true" />}><dl><div><dt>Approvals</dt><dd>{projection.approvalCount} / 2</dd></div><div><dt>Execution</dt><dd>{projection.executionStatus?.toLowerCase() ?? "Not started"}</dd></div><div><dt>Validation</dt><dd>{projection.validationStatus?.toLowerCase() ?? "Not run"}</dd></div><div><dt>Rollback</dt><dd>{projection.rollbackStatus?.toLowerCase() ?? "Not required"}</dd></div></dl></Evidence></div>
        <section className="rollover-history"><header><div><span>Append-only proof</span><h2>Rollover history</h2></div><History aria-hidden="true" /></header>{projection.events ? <ol>{projection.events.slice(-8).reverse().map((event) => <li key={event.id}><strong>{event.type.replaceAll("_", " ").toLowerCase()}</strong><small>{event.detail} · revision {event.revision}</small></li>)}</ol> : <Restricted text="Coordinator access excludes backup, approval actors, execution receipts, and audit history." />}</section>
      </main><AcademicRolloverAxeHarness enabled={audit} signature={`${stage}:${role}:${status}`} />
    </div>
  )
}

function Evidence({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <section><header><h2>{title}</h2>{icon}</header>{children}</section> }
function Restricted({ text }: { text: string }) { return <div className="rollover-restricted"><LockKeyhole aria-hidden="true" /><p>{text}</p></div> }
