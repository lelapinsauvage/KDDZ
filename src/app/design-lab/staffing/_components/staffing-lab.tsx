"use client"

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRoundSearch,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  assignSelectedCover,
  cancelRotaShift,
  capabilitiesForStaffingRole,
  confirmStaffAbsence,
  confirmStaffingSources,
  createStaffingRotaFixture,
  deriveStaffingPlanStatus,
  findRotaConflicts,
  markStaffingSourceChanged,
  projectStaffingForRole,
  refreshStaffingSources,
  scheduleBreakCover,
  selectCoverCandidate,
  type StaffingFixtureStage,
  type StaffingPlan,
  type StaffingPlanStatus,
  type StaffingRole,
} from "@/lib/redesign-staffing-rota-contracts"
import { StaffingAxeHarness } from "./staffing-axe-harness"

const stages: Array<{ value: StaffingFixtureStage; label: string }> = [
  { value: "source-gap", label: "Source gap" },
  { value: "rota-conflict", label: "Rota conflict" },
  { value: "absence-review", label: "Absence review" },
  { value: "cover-required", label: "Cover required" },
  { value: "cover-preview", label: "Cover preview" },
  { value: "cover-confirmed", label: "Cover confirmed" },
  { value: "break-due", label: "Break due" },
  { value: "ready", label: "Ready" },
  { value: "source-changed", label: "Source changed" },
]

const roleLabels: Record<StaffingRole, string> = {
  manager: "Nursery manager",
  scheduler: "Rota coordinator",
  practitioner: "Room practitioner",
}

const statusContent: Record<
  StaffingPlanStatus,
  { eyebrow: string; title: string; detail: string; action: string }
> = {
  SOURCE_GAP: {
    eyebrow: "Readiness withheld",
    title: "Gate presence is not confirmed",
    detail: "The weekly rota cannot prove room readiness until every named source revision is present.",
    action: "Confirm source set",
  },
  ROTA_CONFLICT: {
    eyebrow: "One overlapping assignment",
    title: "One practitioner is scheduled in two rooms",
    detail: "The overlap stays visible until one assignment is cancelled with an auditable reason.",
    action: "Cancel duplicate shift",
  },
  ABSENCE_REVIEW: {
    eyebrow: "Reported at 07:12",
    title: "Confirm the reported absence",
    detail: "A report and a confirmed absence are separate facts. Confirmation exposes the resulting room gap.",
    action: "Confirm absence",
  },
  COVER_REQUIRED: {
    eyebrow: "Meadow is one practitioner short",
    title: "Find qualified cover",
    detail: "Candidates are checked for presence, availability, current qualification, overlap, and source-room consequences.",
    action: "Preview qualified cover",
  },
  COVER_PREVIEW: {
    eyebrow: "Both rooms remain ready",
    title: "Review the cover consequence",
    detail: "The selected practitioner closes Meadow’s gap without removing qualified staff from another room.",
    action: "Assign cover",
  },
  COVER_CONFIRMED: {
    eyebrow: "Cover accepted until 16:00",
    title: "Meadow is ready again",
    detail: "The temporary assignment has an owner, source revision, start, and expiry. The next check is Omar’s break.",
    action: "Review next change",
  },
  BREAK_DUE: {
    eyebrow: "Due by 11:30",
    title: "Schedule the due room break",
    detail: "A qualified floater can cover Sunroom for 30 minutes without weakening another room.",
    action: "Schedule covered break",
  },
  READY: {
    eyebrow: "Current sources agree",
    title: "Both rooms are staffing-ready",
    detail: "Qualified presence, room assignments, accepted cover, and breaks reconcile at this moment.",
    action: "Simulate source change",
  },
  SOURCE_CHANGED: {
    eyebrow: "Projection paused",
    title: "Gate presence changed",
    detail: "Further staffing decisions are blocked until the complete source set is refreshed without regression.",
    action: "Refresh all sources",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): StaffingFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value)
    ? (value as StaffingFixtureStage)
    : "cover-required"
}

function parseRole(search: string): StaffingRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as StaffingRole) : "manager"
}

function commandBase(plan: StaffingPlan, id: string, role: StaffingRole) {
  return {
    eventId: `${id}-${plan.revision}`,
    idempotencyKey: `${id}-${plan.revision}-once`,
    actorId:
      role === "manager"
        ? "manager-river"
        : role === "scheduler"
          ? "scheduler-river"
          : "staff-amina",
    occurredAt: plan.operationalNow,
    expectedRevision: plan.revision,
    actorCapabilities: capabilitiesForStaffingRole(role),
  }
}

function statusIcon(status: StaffingPlanStatus) {
  if (status === "READY" || status === "COVER_CONFIRMED") return <CheckCircle2 />
  if (status === "SOURCE_GAP" || status === "SOURCE_CHANGED") return <ShieldCheck />
  if (status === "BREAK_DUE") return <Clock3 />
  if (status === "COVER_REQUIRED" || status === "COVER_PREVIEW") return <UserRoundSearch />
  return <AlertTriangle />
}

function formatTime(value: string | undefined) {
  if (!value) return "Unknown"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function StaffingLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return (
    <StaffingScenario
      key={`${stage}:${role}:${axeAudit}`}
      stage={stage}
      initialRole={role}
      axeAudit={axeAudit}
    />
  )
}

function StaffingScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: StaffingFixtureStage
  initialRole: StaffingRole
  axeAudit: boolean
}) {
  const [plan, setPlan] = useState(() => createStaffingRotaFixture(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const decisionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(() => projectStaffingForRole(plan, role), [plan, role])
  const status = deriveStaffingPlanStatus(plan)
  const content = statusContent[status]
  const activeAbsence = projection.absences[0]
  const dueBreak = projection.breaks.find((entry) => entry.status === "DUE")
  const selectedCandidate = plan.coverSelections.at(-1)
  const canManage = role !== "practitioner"

  function focusDecision() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => decisionHeadingRef.current?.focus())
    })
  }

  function accept(next: StaffingPlan, message: string) {
    setPlan(next)
    setError("")
    setAnnouncement(message)
    focusDecision()
  }

  function runAction() {
    try {
      if (status === "SOURCE_GAP") {
        accept(
          confirmStaffingSources(plan, {
            ...commandBase(plan, "confirm-sources", role),
            sources: [{ sourceId: "gate-presence", revision: 11 }],
          }),
          "All six staffing sources confirmed. The rota overlap now requires resolution.",
        )
        return
      }
      if (status === "ROTA_CONFLICT") {
        const conflict = findRotaConflicts(plan)[0]
        accept(
          cancelRotaShift(plan, {
            ...commandBase(plan, "cancel-overlap", role),
            shiftId: conflict.shiftIds[1],
            reason: "Duplicate room assignment",
          }),
          "Duplicate Sunroom shift cancelled with an audit reason. Sophie’s absence is ready for review.",
        )
        return
      }
      if (status === "ABSENCE_REVIEW") {
        accept(
          confirmStaffAbsence(plan, {
            ...commandBase(plan, "confirm-absence", role),
            absenceId: "absence-sophie",
          }),
          "Absence confirmed. Meadow now shows one unresolved qualified-staff gap.",
        )
        return
      }
      if (status === "COVER_REQUIRED") {
        accept(
          selectCoverCandidate(plan, {
            ...commandBase(plan, "select-nina", role),
            roomId: "room-meadow",
            candidateStaffId: "staff-nina",
            startsAt: "2026-08-04T10:20:00.000Z",
            endsAt: "2026-08-04T16:00:00.000Z",
          }),
          "Nina selected. Target and source-room consequences are ready for review.",
        )
        return
      }
      if (status === "COVER_PREVIEW" && selectedCandidate) {
        const next = assignSelectedCover(plan, {
          ...commandBase(plan, "assign-nina", role),
          selectionId: selectedCandidate.id,
        })
        accept(
          { ...next, operationalNow: "2026-08-04T10:20:01.000Z" },
          "Nina assigned to Meadow until 16:00. Both rooms are ready.",
        )
        return
      }
      if (status === "COVER_CONFIRMED") {
        accept(
          { ...plan, operationalNow: "2026-08-04T11:45:00.000Z" },
          "The plan moved to 11:45. Omar’s due break now requires covered scheduling.",
        )
        return
      }
      if (status === "BREAK_DUE" && dueBreak) {
        accept(
          scheduleBreakCover(plan, {
            ...commandBase(plan, "schedule-break", role),
            breakId: dueBreak.id,
            candidateStaffId: "staff-maya",
            startsAt: "2026-08-04T11:50:00.000Z",
          }),
          "Omar’s break scheduled with Maya covering Sunroom. No room gap was introduced.",
        )
        return
      }
      if (status === "READY") {
        const gateSource = plan.sourceSnapshot.find((entry) => entry.sourceId === "gate-presence")!
        accept(
          markStaffingSourceChanged(plan, {
            ...commandBase(plan, "source-change", role),
            source: { ...gateSource, revision: gateSource.revision + 1 },
          }),
          "Gate presence advanced to a newer revision. Staffing decisions are paused.",
        )
        return
      }
      const sources = plan.sourceSnapshot.map((entry) =>
        entry.sourceId === "gate-presence" ? { ...entry, revision: entry.revision + 1 } : entry,
      )
      accept(
        refreshStaffingSources(plan, {
          ...commandBase(plan, "refresh-sources", role),
          sources,
        }),
        "All staffing sources refreshed without omission or regression. Both rooms are ready.",
      )
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Staffing action failed"
      setError(message)
      setAnnouncement(message)
    }
  }

  function reset() {
    setPlan(createStaffingRotaFixture(stage))
    setError("")
    setAnnouncement("Scenario reset")
  }

  return (
    <div className="staffing-lab" data-axe-audit={axeAudit ? "axe" : "off"}>
      <StaffingAxeHarness
        enabled={axeAudit}
        signature={`${stage}:${role}:${status}:${plan.revision}`}
      />
      <header className="staffing-topbar">
        <strong>Kiddz Online · staffing contract</strong>
        <span>Territory-neutral operational prototype</span>
        <div className="staffing-topbar__controls">
          <label>
            <span>Role</span>
            <select aria-label="Staffing role" value={role} onChange={(event) => setRole(event.target.value as StaffingRole)}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Start from</span>
            <select
              aria-label="Starting staffing scenario state"
              value={stage}
              onChange={(event) => {
                const next = new URL(window.location.href)
                next.searchParams.set("state", event.target.value)
                next.searchParams.set("role", role)
                window.history.pushState({}, "", next)
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
            >
              {stages.map((entry) => (
                <option key={entry.value} value={entry.value}>{entry.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={reset} aria-label="Reset staffing scenario" title="Reset scenario">
            <RefreshCw aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="staffing-main">
        <div className="staffing-heading">
          <div>
            <span>Staffing and rota readiness</span>
            <h1>Qualified cover without hidden consequences</h1>
          </div>
          <p>
            Scheduled, present, qualified, absent, on break, and covering are independent facts.
            Room readiness is derived only from current source revisions.
          </p>
        </div>

        <dl className="staffing-context">
          <div><dt>Branch</dt><dd>{plan.branch.label}</dd></div>
          <div><dt>Operational date</dt><dd>Tuesday, 4 August</dd></div>
          <div><dt>Projection time</dt><dd>{formatTime(plan.operationalNow)}</dd></div>
          <div><dt>Source set</dt><dd>{plan.sourceSnapshot.length} of {plan.sourceRequirements.length} confirmed</dd></div>
          <div><dt>Revision</dt><dd>{plan.revision}</dd></div>
        </dl>

        <section className={`staffing-decision staffing-decision--${status.toLowerCase()}`}>
          <div className="staffing-decision__icon" aria-hidden="true">{statusIcon(status)}</div>
          <div className="staffing-decision__copy">
            <span>{content.eyebrow}</span>
            <h2 ref={decisionHeadingRef} tabIndex={-1}>{content.title}</h2>
            <p>{content.detail}</p>
          </div>
          <div className="staffing-decision__action">
            <button type="button" onClick={runAction} disabled={!canManage}>
              {status === "READY" ? <History aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
              {content.action}
            </button>
            {!canManage ? <small>Your role can inspect room readiness and your own assignment only.</small> : <small>Accepted work is revision-checked and idempotent.</small>}
          </div>
        </section>

        <section className="staffing-rooms" aria-labelledby="staffing-rooms-title">
          <header>
            <div><span>Room readiness</span><h2 id="staffing-rooms-title">Current qualified contribution</h2></div>
            <strong>Policy values are supplied, not hardcoded</strong>
          </header>
          <div className="staffing-room-grid staffing-room-grid--head" aria-hidden="true">
            <span>Room</span><span>Required</span><span>Scheduled</span><span>Present + qualified</span><span>Unknown</span><span>Absent</span><span>Break</span><span>Gap</span><span>Next change</span>
          </div>
          {projection.rooms.map((room) => (
            <article key={room.roomId} className={`staffing-room-grid ${room.gap ? "staffing-room-grid--gap" : ""}`}>
              <div className="staffing-room__name">
                <strong>{room.roomLabel}</strong>
                <small>{room.configured ? `${room.source.length} demand source` : "Source incomplete"}</small>
              </div>
              <Metric label="Required" value={room.requiredQualifiedStaff} />
              <Metric label="Scheduled" value={room.scheduledStaff} />
              <Metric label="Present + qualified" value={room.presentQualifiedStaff} safe={room.gap === 0} />
              <Metric label="Unknown" value={room.unresolvedPresence} />
              <Metric label="Absent" value={room.confirmedAbsent} />
              <Metric label="Break" value={room.onBreak} />
              <Metric label="Gap" value={room.gap} critical={Boolean(room.gap)} />
              <div className="staffing-room__metric"><small>Next change</small><strong>{formatTime(room.nextChangeAt)}</strong></div>
              <div className="staffing-room__people">
                {room.contributions.map((entry) => (
                  <span key={entry.staffId} className={entry.included ? "is-included" : "is-excluded"}>
                    <strong>{entry.displayName}</strong>
                    <small>{entry.included ? "Counting now" : entry.reasons.join(" · ")}</small>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="staffing-lower-grid">
          <section className="staffing-candidates" aria-labelledby="staffing-candidates-title">
            <header>
              <div><span>Consequence preview</span><h2 id="staffing-candidates-title">Cover candidates</h2></div>
              <UserRoundSearch aria-hidden="true" />
            </header>
            {projection.candidates.length ? (
              <ol>
                {projection.candidates.slice(0, 5).map((candidate) => (
                  <li key={candidate.staffId} className={candidate.eligible ? "is-eligible" : ""}>
                    <span><strong>{candidate.displayName}</strong><small>{candidate.roleLabel}</small></span>
                    <span><strong>{candidate.eligible ? "Eligible" : "Unavailable"}</strong><small>{candidate.eligible ? `Target gap ${candidate.targetGapAfterAssignment ?? "unknown"} · source gap ${candidate.sourceGapAfterAssignment ?? 0}` : candidate.reasons.join(" · ")}</small></span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="staffing-restricted"><LockKeyhole aria-hidden="true" /><p>Candidate identity and transfer consequences are restricted for this role.</p></div>
            )}
          </section>

          <section className="staffing-obligations" aria-labelledby="staffing-obligations-title">
            <header>
              <div><span>Open obligations</span><h2 id="staffing-obligations-title">Absence and breaks</h2></div>
              <CalendarClock aria-hidden="true" />
            </header>
            <dl>
              <div><dt>Absence</dt><dd>{activeAbsence ? `${activeAbsence.status.toLowerCase()} · ${activeAbsence.category.toLowerCase()}` : "Restricted or none"}</dd></div>
              {activeAbsence?.privateReason ? <div><dt>Manager evidence</dt><dd>{activeAbsence.privateReason}</dd></div> : null}
              <div><dt>Break</dt><dd>{dueBreak ? `Due ${formatTime(dueBreak.dueBy)} · ${dueBreak.durationMinutes} min` : plan.breaks[0]?.status.toLowerCase() ?? "Restricted or none"}</dd></div>
              <div><dt>Accepted cover</dt><dd>{plan.coverAssignments.length}</dd></div>
            </dl>
            {role === "scheduler" ? <p className="staffing-privacy"><LockKeyhole aria-hidden="true" />Health details are withheld; scheduling consequence remains visible.</p> : null}
          </section>

          <section className="staffing-history" aria-labelledby="staffing-history-title">
            <header>
              <div><span>Accepted history</span><h2 id="staffing-history-title">{projection.events.length} events</h2></div>
              <History aria-hidden="true" />
            </header>
            {projection.events.length ? (
              <ol>
                {projection.events.slice(-5).reverse().map((event) => (
                  <li key={event.eventId}><strong>{event.kind.replaceAll("_", " ").toLowerCase()}</strong><small>{event.detail}</small></li>
                ))}
              </ol>
            ) : role === "practitioner" ? (
              <div className="staffing-restricted"><LockKeyhole aria-hidden="true" /><p>Audit history is restricted for this role.</p></div>
            ) : (
              <div className="staffing-restricted"><History aria-hidden="true" /><p>No staffing decision has been accepted in this scenario.</p></div>
            )}
          </section>
        </div>

        <div className="staffing-announcer" aria-live="polite" aria-atomic="true">{error || announcement}</div>
        {error ? <div className="staffing-error" role="alert"><AlertTriangle aria-hidden="true" />{error}</div> : null}
      </main>
    </div>
  )
}

function Metric({
  label,
  value,
  critical,
  safe,
}: {
  label: string
  value: number | undefined
  critical?: boolean
  safe?: boolean
}) {
  return (
    <div className={`staffing-room__metric ${critical ? "is-critical" : safe ? "is-safe" : ""}`}>
      <small>{label}</small><strong>{value ?? "-"}</strong>
    </div>
  )
}
