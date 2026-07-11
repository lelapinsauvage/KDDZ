"use client"

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  History,
  RefreshCcw,
  ShieldQuestion,
  UserCheck,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import { projectAttendanceSession, type LiveReadinessStatus } from "@/lib/redesign-live-operations"
import {
  assignFixtureCover,
  buildFixtureOperations,
  createFixtureAttendanceSession,
  createForecastFixtureStaff,
  fixtureCoverCandidates,
  fixturePolicy,
  fixtureRoomMeta,
  fixtureSeedlingsPolicy,
  previewFixtureCover,
  recordFixtureAttendance,
  type FixtureAttendanceChoice,
  type FixtureCoverCandidateId,
} from "@/lib/redesign-live-operations-fixtures"
import { OperationsAxeHarness } from "./operations-axe-harness"

const attendanceChoices: Array<{ value: FixtureAttendanceChoice; label: string; detail: string }> = [
  { value: "PRESENT", label: "Present", detail: "Observed in Meadow now" },
  { value: "ABSENT", label: "Absent", detail: "Not present after direct check" },
  { value: "LATE_EXPECTED", label: "Late expected", detail: "Expected at 09:45" },
  { value: "NOT_EXPECTED", label: "Not expected", detail: "Not scheduled for this session" },
]

const statusLabels: Record<LiveReadinessStatus, string> = {
  UNKNOWN: "Unknown",
  NEEDS_ATTENTION: "Needs attention",
  SAFE_WITH_EXCEPTIONS: "Safe with exceptions",
  SAFE: "Safe",
}

const fixturePolicies = {
  "room-meadow": fixturePolicy,
  "room-seedlings": fixtureSeedlingsPolicy,
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getAuditSnapshot() {
  return new URLSearchParams(window.location.search).get("audit") === "axe"
}

export function LiveOperationsLab() {
  const axeAudit = useSyncExternalStore(subscribeToLocation, getAuditSnapshot, () => false)
  const [attendance, setAttendance] = useState(createFixtureAttendanceSession)
  const [forecastStaff, setForecastStaff] = useState(createForecastFixtureStaff)
  const [attendanceChoice, setAttendanceChoice] = useState<FixtureAttendanceChoice | null>(null)
  const [coverCandidate, setCoverCandidate] = useState<FixtureCoverCandidateId | null>(null)
  const [announcement, setAnnouncement] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)

  const operations = useMemo(
    () => buildFixtureOperations(attendance, forecastStaff),
    [attendance, forecastStaff],
  )
  const attendanceProjection = useMemo(() => projectAttendanceSession(attendance), [attendance])
  const alma = attendanceProjection.children.find((child) => child.childId === "child-alma")
  const stage = operations.room.current.status === "UNKNOWN"
    ? "attendance"
    : operations.room.forecast?.status === "NEEDS_ATTENTION"
      ? "cover"
      : "resolved"
  const coverPreview = useMemo(
    () => coverCandidate ? previewFixtureCover(attendance, forecastStaff, coverCandidate) : null,
    [attendance, coverCandidate, forecastStaff],
  )

  const focusActionHeading = () => window.requestAnimationFrame(() => actionHeadingRef.current?.focus())

  function handleAttendance() {
    if (!attendanceChoice) return
    setAttendance((current) => recordFixtureAttendance(current, attendanceChoice))
    setAttendanceChoice(null)
    setAnnouncement(`Alma Reyes attendance accepted as ${attendanceChoice.toLowerCase().replaceAll("_", " ")}. Ratio source updated.`)
    focusActionHeading()
  }

  function handleCover() {
    if (!coverCandidate || coverPreview?.status !== "ACCEPTABLE") return
    const selectedCandidate = fixtureCoverCandidates.find((candidate) => candidate.staffId === coverCandidate)
    setForecastStaff((current) => assignFixtureCover(attendance, current, coverCandidate))
    setCoverCandidate(null)
    setAnnouncement(`${selectedCandidate?.name ?? "Selected cover"} assigned to Meadow from 12:30 to 13:00. Both affected room forecasts updated.`)
    focusActionHeading()
  }

  function resetFixture() {
    setAttendance(createFixtureAttendanceSession())
    setForecastStaff(createForecastFixtureStaff())
    setAttendanceChoice(null)
    setCoverCandidate(null)
    setAnnouncement("Live operations fixture reset.")
    focusActionHeading()
  }

  const StatusIcon = operations.branch.status === "SAFE"
    ? CheckCircle2
    : operations.branch.status === "UNKNOWN"
      ? ShieldQuestion
      : AlertTriangle

  return (
    <div
      className="operations-lab"
      data-axe-audit={axeAudit ? "axe" : "off"}
      data-stage={stage}
    >
      <OperationsAxeHarness
        enabled={axeAudit}
        signature={`operations:${stage}:${operations.branch.status}:${coverCandidate ?? "none"}:${coverPreview?.status ?? "none"}`}
      />

      <header className="operations-topbar">
        <div className="operations-brand"><strong>Kiddz Online</strong><span>Live operations contract</span></div>
        <span className="operations-synthetic"><span aria-hidden="true" />Synthetic source data</span>
        <button className="operations-reset" type="button" aria-label="Reset live operations fixture" onClick={resetFixture}>
          <RefreshCcw aria-hidden="true" /><span>Reset fixture</span>
        </button>
      </header>

      <main className="operations-main">
        <header className="operations-heading">
          <div>
            <span>Behavior before visual territory</span>
            <h1>Can one observed fact update the whole nursery picture?</h1>
            <p>Resolve Meadow&apos;s unknown attendance, inspect the ratio consequence, then cover the forecast break.</p>
          </div>
          <dl className="operations-context" aria-label="Operational context">
            <div><dt>Branch</dt><dd>Riverside</dd></div>
            <div><dt>Mode</dt><dd><span aria-hidden="true" />Live</dd></div>
            <div><dt>As of</dt><dd>Tue 14 Jul, 09:18</dd></div>
          </dl>
        </header>

        <section
          className={`operations-readiness is-${operations.branch.status.toLowerCase()}`}
          aria-labelledby="operations-readiness-title"
        >
          <span className="operations-readiness__icon" aria-hidden="true"><StatusIcon /></span>
          <div>
            <span>Branch readiness</span>
            <h2 id="operations-readiness-title">{statusLabels[operations.branch.status]}</h2>
            <p>{operations.branch.reason}</p>
          </div>
          <dl>
            <div><dt>Rooms checked</dt><dd>{operations.branch.roomCount}</dd></div>
            <div><dt>Open work</dt><dd>{operations.workItems.length}</dd></div>
            <div><dt>Source revision</dt><dd>{attendance.revision}</dd></div>
          </dl>
        </section>

        <div className="operations-workspace">
          <section className="operations-plane" aria-labelledby="operations-plane-title">
            <header>
              <div><span>Room operating plane</span><h2 id="operations-plane-title">Live rooms</h2></div>
              <span>Current and next change</span>
            </header>

            {operations.rooms.map((room) => {
              const roomId = room.roomId as keyof typeof fixtureRoomMeta
              const meta = fixtureRoomMeta[roomId]
              const policy = fixturePolicies[roomId]
              const isMeadow = room.roomId === "room-meadow"
              return (
                <div className="operations-room" data-room-status={room.status} key={room.roomId}>
                  <div className="operations-room__identity">
                    <span>{meta.ageBand}</span>
                    <h3>{room.roomName}</h3>
                    <p>{room.primaryReason}</p>
                  </div>
                  <dl className="operations-room__facts">
                    <div>
                      <dt>Children now</dt>
                      <dd><strong>{room.current.presentChildren}</strong> present</dd>
                      <dd className="operations-room__meta">{room.current.unknownChildren} unknown</dd>
                    </div>
                    <div>
                      <dt>Counted staff</dt>
                      <dd><strong>{room.current.countedAdults}</strong> of {room.current.requiredAdults ?? "?"}</dd>
                      <dd className="operations-room__meta">{policy.label}</dd>
                    </div>
                    <div>
                      <dt>Next change</dt>
                      <dd>{isMeadow ? <><strong>12:30</strong> Lina&apos;s break</> : <><strong>None</strong> scheduled</>}</dd>
                      <dd className="operations-room__meta">{room.forecast?.countedAdults ?? "?"} of {room.forecast?.requiredAdults ?? "?"} counted then</dd>
                    </div>
                  </dl>
                  <div className="operations-room__state">
                    <span className={`operations-status is-${room.status.toLowerCase()}`}>
                      {statusLabels[room.status]}
                    </span>
                    {isMeadow ? (
                      <button type="button" onClick={focusActionHeading} aria-controls="operations-action-panel">
                        {stage === "attendance" ? "Resolve attendance" : stage === "cover" ? "Review cover" : "View handled state"}
                        <ArrowRight aria-hidden="true" />
                      </button>
                    ) : <span className="operations-room__source-note">Sources confirmed</span>}
                  </div>
                </div>
              )
            })}

            <section className="operations-work" aria-labelledby="operations-work-title">
              <div className="operations-section-heading">
                <div><span>Owned work</span><h3 id="operations-work-title">What needs handling</h3></div>
                <span>{operations.workItems.length} open</span>
              </div>
              {operations.workItems.length > 0 ? operations.workItems.map((item) => (
                <div className="operations-work__item" key={item.id}>
                  <span className={`is-${item.priority.toLowerCase()}`}>{item.priority.replaceAll("_", " ")}</span>
                  <div><strong>{item.title}</strong><p>{item.consequence}</p></div>
                  <button type="button" onClick={focusActionHeading}>Open<ArrowRight aria-hidden="true" /></button>
                </div>
              )) : (
                <div className="operations-work__empty"><CheckCircle2 aria-hidden="true" /><div><strong>No unresolved source work</strong><p>Attendance and forecast cover are confirmed from accepted events.</p></div></div>
              )}
            </section>
          </section>

          <aside className="operations-action" id="operations-action-panel" aria-labelledby="operations-action-title">
            <header>
              <span>{stage === "attendance" ? "Step 1 of 2" : stage === "cover" ? "Step 2 of 2" : "Handled"}</span>
              <h2 id="operations-action-title" ref={actionHeadingRef} tabIndex={-1}>
                {stage === "attendance" ? "Resolve Alma's attendance" : stage === "cover" ? "Cover Lina's break" : "Meadow is ready"}
              </h2>
              <p>
                {stage === "attendance"
                  ? "No state is selected. Record only what was directly observed."
                  : stage === "cover"
                    ? "The room is safe now and becomes under-covered at 12:30."
                    : "The current source and next forecast both meet the supplied fixture decision."}
              </p>
            </header>

            {stage === "attendance" && (
              <>
                <div className="operations-source-fact">
                  <ShieldQuestion aria-hidden="true" />
                  <div><span>Source fact</span><strong>Alma Reyes</strong><p>Expected in Meadow. No accepted observation yet.</p></div>
                </div>
                <fieldset className="operations-options">
                  <legend>Observed attendance</legend>
                  {attendanceChoices.map((choice) => (
                    <label key={choice.value}>
                      <input
                        type="radio"
                        name="attendance-choice"
                        value={choice.value}
                        checked={attendanceChoice === choice.value}
                        onChange={() => setAttendanceChoice(choice.value)}
                      />
                      <span className="operations-option__mark" aria-hidden="true"><Check /></span>
                      <span><strong>{choice.label}</strong><small>{choice.detail}</small></span>
                    </label>
                  ))}
                </fieldset>
                <button className="operations-primary" type="button" disabled={!attendanceChoice} onClick={handleAttendance}>
                  Confirm observation<ArrowRight aria-hidden="true" />
                </button>
              </>
            )}

            {stage === "cover" && (
              <>
                <dl className="operations-consequence">
                  <div><dt>Current</dt><dd>1 counted adult / 1 required</dd></div>
                  <div><dt>At 12:30</dt><dd>0 counted adults / 1 required</dd></div>
                  <div><dt>Cause</dt><dd>Lina&apos;s scheduled break</dd></div>
                </dl>
                <fieldset className="operations-options operations-options--cover">
                  <legend>Available candidates</legend>
                  {fixtureCoverCandidates.map((candidate) => (
                    <label key={candidate.staffId}>
                      <input
                        type="radio"
                        name="cover-choice"
                        checked={coverCandidate === candidate.staffId}
                        onChange={() => setCoverCandidate(candidate.staffId)}
                      />
                      <span className="operations-option__mark" aria-hidden="true"><Check /></span>
                      <span><strong>{candidate.name}</strong><small>{candidate.detail}</small></span>
                      <UserCheck aria-hidden="true" />
                    </label>
                  ))}
                </fieldset>
                {coverPreview && (
                  <section
                    className={`operations-cover-preview is-${coverPreview.status.toLowerCase()}`}
                    aria-live="polite"
                    aria-label="Cover impact preview"
                  >
                    <header><span>Impact preview</span><strong>{coverPreview.status === "ACCEPTABLE" ? "Both rooms remain safe" : coverPreview.status === "BLOCKED" ? "Creates another room risk" : "Impact remains unknown"}</strong></header>
                    <dl>
                      {coverPreview.after.map((room) => (
                        <div key={room.roomId}>
                          <dt>{room.roomName}</dt>
                          <dd>{room.countedAdults} of {room.requiredAdults ?? "?"} counted</dd>
                          <dd><span className={`operations-status is-${room.status.toLowerCase()}`}>{statusLabels[room.status]}</span></dd>
                        </div>
                      ))}
                    </dl>
                    <p>{coverPreview.reasons[0]}</p>
                  </section>
                )}
                <p className="operations-policy-note">This fixture consumes an approved policy decision. It does not calculate or claim a legal ratio.</p>
                <button className="operations-primary" type="button" disabled={coverPreview?.status !== "ACCEPTABLE"} onClick={handleCover}>
                  {!coverPreview ? "Select cover to preview impact" : coverPreview.status === "ACCEPTABLE" ? "Assign 12:30-13:00 cover" : "Cannot create another room risk"}<ArrowRight aria-hidden="true" />
                </button>
              </>
            )}

            {stage === "resolved" && (
              <div className="operations-resolved">
                <span aria-hidden="true"><CheckCircle2 /></span>
                <strong>Current and forecast sources confirmed</strong>
                <p>Alma&apos;s accepted attendance event updates Meadow. Sam&apos;s time-bounded assignment covers 12:30 while Seedlings remains safe and Lina&apos;s history stays intact.</p>
                <dl>
                  <div><dt>Attendance revision</dt><dd>{attendance.revision}</dd></div>
                  <div><dt>Cover source</dt><dd>12:30-13:00</dd></div>
                  <div><dt>Open work</dt><dd>0</dd></div>
                </dl>
              </div>
            )}
          </aside>
        </div>

        <section className="operations-history" aria-labelledby="operations-history-title">
          <header><History aria-hidden="true" /><div><span>Append-only source history</span><h2 id="operations-history-title">Accepted attendance events</h2></div></header>
          <div className="operations-history__rows">
            {attendance.events.map((event) => {
              const child = attendanceProjection.children.find((item) => item.childId === event.childId)
              return (
                <div key={event.eventId}>
                  <span>{new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" }).format(new Date(event.occurredAt))}</span>
                  <div><strong>{child?.displayName ?? event.childId}</strong><small>{event.kind.toLowerCase().replaceAll("_", " ")}</small></div>
                  <span>Revision {event.revision}</span>
                </div>
              )
            })}
          </div>
          <footer><Clock3 aria-hidden="true" /><span>Original events remain addressable for correction and audit. No browser flag represents completion.</span></footer>
        </section>
      </main>

      <p className="operations-announcement" aria-live="polite">{announcement}</p>
      <span className="operations-debug-state" aria-hidden="true">{alma?.state}</span>
    </div>
  )
}
