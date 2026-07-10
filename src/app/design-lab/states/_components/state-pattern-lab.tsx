"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CloudOff,
  FileWarning,
  History,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  WifiOff,
  X,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  isRedesignStateId,
  redesignStateAcceptanceRules,
  redesignStateContracts,
  redesignStateGroups,
  redesignStateOrder,
  type RedesignStateId,
} from "@/lib/redesign-state-contracts"
import { StateAxeHarness } from "./state-axe-harness"

const stateIcons = {
  initial: CircleHelp,
  loading: LoaderCircle,
  empty: CircleHelp,
  partial: FileWarning,
  unknown: CircleHelp,
  draft: Save,
  validation: AlertTriangle,
  denied: LockKeyhole,
  failure: XCircle,
  offline: WifiOff,
  conflict: CloudOff,
  waiting: History,
  success: CheckCircle2,
  corrected: Pencil,
  closed: ShieldCheck,
} satisfies Record<RedesignStateId, typeof CircleHelp>

const subscribeToStaticLocation = () => () => undefined
const readAuditSnapshot = () => {
  const params = new URLSearchParams(window.location.search)
  const requestedState = params.get("state")
  return `${params.get("audit") === "axe" ? "axe" : "off"}:${isRedesignStateId(requestedState) ? requestedState : "initial"}`
}
const readServerAuditSnapshot = () => "off:initial"

export function StatePatternLab() {
  const [activeState, setActiveState] = useState<RedesignStateId>("initial")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [meal, setMeal] = useState("")
  const [mood, setMood] = useState("")
  const [note, setNote] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const mealRef = useRef<HTMLSelectElement>(null)
  const auditSnapshot = useSyncExternalStore(
    subscribeToStaticLocation,
    readAuditSnapshot,
    readServerAuditSnapshot,
  )
  const [axeAudit, requestedState] = auditSnapshot.split(":") as [
    "axe" | "off",
    RedesignStateId,
  ]

  const selectState = (state: RedesignStateId) => {
    setActiveState(state)
    setMobileOpen(false)
    setAnnouncement(`${redesignStateContracts[state].label} fixture loaded`)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }))
  }

  const closeMobileNavigation = useCallback(() => {
    setMobileOpen(false)
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (mobileOpen) menuCloseRef.current?.focus()
  }, [mobileOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) closeMobileNavigation()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileNavigation, mobileOpen])

  const renderedState = axeAudit === "axe" ? requestedState : activeState
  const activeDefinition = redesignStateContracts[renderedState]
  const ActiveIcon = stateIcons[renderedState]

  return (
    <div className="state-lab" data-axe-audit={axeAudit} data-state={renderedState}>
      <StateAxeHarness
        enabled={axeAudit === "axe"}
        signature={`state:${renderedState}`}
      />
      <aside className={`state-sidebar${mobileOpen ? " is-open" : ""}`} aria-label="State fixtures">
        <div className="state-sidebar__header">
          <div><span>Design system lab</span><strong>State contracts</strong></div>
          <button ref={menuCloseRef} className="state-icon-button state-sidebar__close" type="button" aria-label="Close state navigation" onClick={closeMobileNavigation}><X aria-hidden="true" /></button>
        </div>
        <p>Territory-neutral behavior fixtures. No production data or selected visual direction.</p>
        <nav aria-label="State matrix">
          {redesignStateGroups.map((group) => (
            <div className="state-nav-group" key={group}>
              <span>{group}</span>
              {redesignStateOrder.filter((state) => redesignStateContracts[state].group === group).map((state) => {
                const definition = redesignStateContracts[state]
                const Icon = stateIcons[state]
                return <button key={state} className={renderedState === state ? "is-active" : undefined} aria-current={renderedState === state ? "page" : undefined} onClick={() => selectState(state)} type="button"><Icon aria-hidden="true" /><span>{definition.label}</span><ChevronRight aria-hidden="true" /></button>
              })}
            </div>
          ))}
        </nav>
      </aside>

      {mobileOpen && <button className="state-scrim" aria-label="Close state navigation" onClick={closeMobileNavigation} type="button" />}

      <div className="state-workspace">
        <header className="state-topbar">
          <button ref={menuTriggerRef} className="state-icon-button state-menu-button" aria-label="Open state navigation" onClick={() => setMobileOpen(true)} type="button"><Menu aria-hidden="true" /></button>
          <div><span>Meadow · lunch observation</span><strong>Room care state fixture</strong></div>
          <span className="state-context"><span />Synthetic data · Tue 14 Jul · 09:18</span>
          <button className="state-reset" type="button" aria-label="Reset state fixture" onClick={() => { setMeal(""); setMood(""); setNote(""); selectState("initial") }}><RotateCcw aria-hidden="true" /><span>Reset fixture</span></button>
        </header>

        <main className="state-main">
          <section className="state-heading">
            <div className={`state-heading__icon is-${renderedState}`}><ActiveIcon aria-hidden="true" /></div>
            <div><span>{activeDefinition.group} state</span><h1>{activeDefinition.label}</h1><p>{activeDefinition.summary}</p></div>
          </section>

          <div className="state-layout">
            <section className="state-source" aria-labelledby="state-source-heading">
              <header><div><span>Source object</span><h2 id="state-source-heading">Meadow lunch care</h2></div><span className={`state-source__status is-${renderedState}`}>{activeDefinition.sourceStatus}</span></header>
              <dl>
                <div><dt>Room</dt><dd>Meadow · 2-3 years</dd></div>
                <div><dt>Observed children</dt><dd>{renderedState === "empty" ? "0" : "Theo Martin · Mila Costa"}</dd></div>
                <div><dt>Current completion</dt><dd>{activeDefinition.completion}</dd></div>
                <div><dt>Source revision</dt><dd>{activeDefinition.revision}</dd></div>
              </dl>
              <footer><span>Why this panel stays stable</span><p>Page identity, object scope, and source status do not disappear while secondary data loads, fails, conflicts, or completes.</p></footer>
            </section>

            <section className="state-fixture" aria-labelledby="state-fixture-heading">
              <header><div><span>Behavior fixture</span><h2 id="state-fixture-heading">{activeDefinition.label} presentation</h2></div><span>State {redesignStateOrder.indexOf(renderedState) + 1} of {redesignStateOrder.length}</span></header>
              <div className="state-fixture__body">{renderFixture({ activeState: renderedState, meal, mood, note, mealRef, setMeal, setMood, setNote, selectState })}</div>
            </section>
          </div>

          <section className="state-contract" aria-labelledby="state-contract-heading">
            <div><span>Acceptance contract</span><h2 id="state-contract-heading">What must remain true</h2></div>
            <ul>{redesignStateAcceptanceRules(renderedState).map((rule) => <li key={rule}><CheckCircle2 aria-hidden="true" /><span>{rule}</span></li>)}</ul>
            {renderedState === "validation" && <button type="button" onClick={() => mealRef.current?.focus()}>Focus first error</button>}
          </section>
        </main>
        <p className="state-announcement" aria-live="polite">{announcement}</p>
      </div>
    </div>
  )
}

type FixtureProps = {
  activeState: RedesignStateId
  meal: string
  mood: string
  note: string
  mealRef: React.RefObject<HTMLSelectElement | null>
  setMeal: (value: string) => void
  setMood: (value: string) => void
  setNote: (value: string) => void
  selectState: (state: RedesignStateId) => void
}

function renderFixture(props: FixtureProps) {
  const form = (validation = false, draft = false, unknown = false) => (
    <form className="state-care-form" onSubmit={(event) => { event.preventDefault(); props.selectState(validation || !props.meal || !props.mood ? "validation" : "success") }}>
      {draft && <div className="state-inline-status is-draft"><Save aria-hidden="true" /><span><strong>Draft saved at 09:14</strong>Revision 3 · this device · Riverside</span></div>}
      {unknown && <div className="state-inline-status is-unknown"><CircleHelp aria-hidden="true" /><span><strong>Meal observation is still unknown</strong>Choose only what was directly observed.</span></div>}
      <div className="state-form-grid">
        <label>Meal portion<select ref={props.mealRef} aria-invalid={validation && !props.meal ? "true" : undefined} aria-describedby={validation && !props.meal ? "meal-error" : undefined} value={props.meal} onChange={(event) => props.setMeal(event.target.value)}><option value="">Choose observed portion</option><option value="all">All eaten</option><option value="most">Most eaten</option><option value="some">Some eaten</option><option value="none">None eaten</option></select>{validation && !props.meal && <span id="meal-error" className="state-field-error">Choose the portion that was observed.</span>}</label>
        <label>Mood after lunch<select aria-invalid={validation && !props.mood ? "true" : undefined} aria-describedby={validation && !props.mood ? "mood-error" : undefined} value={props.mood} onChange={(event) => props.setMood(event.target.value)}><option value="">Choose observed mood</option><option value="settled">Settled</option><option value="tired">Tired</option><option value="upset">Upset</option></select>{validation && !props.mood && <span id="mood-error" className="state-field-error">Choose the mood that was observed.</span>}</label>
      </div>
      <label>Room note <span>Optional</span><textarea value={props.note} onChange={(event) => props.setNote(event.target.value)} placeholder="Add factual room context…" /></label>
      <div className="state-form-actions"><button type="button" onClick={() => props.selectState("draft")}>Save draft</button><button type="submit">Review and submit<ChevronRight aria-hidden="true" /></button></div>
    </form>
  )

  switch (props.activeState) {
    case "initial":
      return form()
    case "loading":
      return <div className="state-skeleton" role="status" aria-live="polite" aria-busy="true"><div /><div className="is-short" /><div className="state-skeleton__fields"><span /><span /></div><div className="is-large" /><p>Loading care record…</p></div>
    case "empty":
      return <div className="state-empty"><CircleHelp aria-hidden="true" /><strong>No children are assigned to Meadow for lunch</strong><p>Riverside · Tue 14 Jul. Check the live room roster before creating care records.</p><button type="button">Open room roster<ChevronRight aria-hidden="true" /></button></div>
    case "partial":
      return <div className="state-partial"><div className="state-inline-status is-warning"><FileWarning aria-hidden="true" /><span><strong>One child source is unavailable</strong>Mila&apos;s current attendance could not be refreshed. Do not include her in batch entry.</span></div><div className="state-record-row"><span>TM</span><div><strong>Theo Martin</strong><small>Present · report not started</small></div><span className="is-safe">Available</span></div><div className="state-record-row is-muted"><span>MC</span><div><strong>Mila Costa</strong><small>Attendance source unavailable · refreshed 4 min ago</small></div><span>Blocked</span></div><button className="state-primary-action" type="button" onClick={() => props.selectState("initial")}>Continue with Theo<ChevronRight aria-hidden="true" /></button></div>
    case "unknown":
      return form(false, false, true)
    case "draft":
      return form(false, true)
    case "validation":
      return form(true)
    case "denied":
      return <div className="state-empty is-denied"><LockKeyhole aria-hidden="true" /><strong>You cannot submit care for this room</strong><p>Your current assignment allows read access to Meadow but not care-report submission. No child details outside this room have been exposed.</p><button type="button">Return to Today<ChevronRight aria-hidden="true" /></button></div>
    case "failure":
      return <div className="state-failure"><div className="state-inline-status is-critical"><XCircle aria-hidden="true" /><span><strong>The draft was not saved</strong>Your input is still here. The server did not accept revision 3.</span></div><dl><div><dt>Meal</dt><dd>{props.meal || "Most eaten"}</dd></div><div><dt>Mood</dt><dd>{props.mood || "Settled"}</dd></div><div><dt>Room note</dt><dd>{props.note || "Lunch finished calmly."}</dd></div></dl><div className="state-form-actions"><button type="button">Copy entered values</button><button type="button" onClick={() => props.selectState("loading")}>Retry save<RotateCcw aria-hidden="true" /></button></div></div>
    case "offline":
      return <div className="state-offline"><div className="state-inline-status is-offline"><WifiOff aria-hidden="true" /><span><strong>Offline · 2 changes queued on this device</strong>Nothing is submitted yet. Keep this page open until sync completes.</span></div><div className="state-queue-record"><span>09:16</span><div><strong>Meal · Most eaten</strong><small>Theo Martin · local draft revision 4</small></div><span>Queued</span></div><div className="state-queue-record"><span>09:17</span><div><strong>Mood · Settled</strong><small>Mila Costa · local draft revision 2</small></div><span>Queued</span></div><button className="state-primary-action" type="button">View offline queue<ChevronRight aria-hidden="true" /></button></div>
    case "conflict":
      return <div className="state-conflict"><div className="state-inline-status is-warning"><CloudOff aria-hidden="true" /><span><strong>This care record changed on another device</strong>Compare revisions before replacing any factual value.</span></div><div className="state-conflict-grid"><article><span>Server · revision 5 · 09:17</span><strong>Most eaten · Settled</strong><p>Saved by Lina R. on Room iPad.</p><button type="button" onClick={() => props.selectState("corrected")}>Use server revision</button></article><article><span>This device · revision 4 · 09:16</span><strong>Some eaten · Tired</strong><p>Unsynced draft by you on Manager Mac.</p><button type="button" onClick={() => props.selectState("corrected")}>Keep mine with reason</button></article></div></div>
    case "waiting":
      return <div className="state-waiting"><History aria-hidden="true" /><div><span>Submitted 09:18 · waiting 6 min</span><strong>Manager review is required</strong><p>The child reports are stored. Parent delivery will not begin until Noor H. reviews the room exception.</p></div><dl><div><dt>Owner</dt><dd>Noor H. · Riverside manager</dd></div><div><dt>Next rule</dt><dd>Escalate after 30 min</dd></div></dl><button className="state-primary-action" type="button">Open submitted record<ChevronRight aria-hidden="true" /></button></div>
    case "success":
      return <div className="state-success"><CheckCircle2 aria-hidden="true" /><div><span>Server confirmed · 09:18</span><strong>2 lunch care reports submitted</strong><p>Meadow now has no incomplete lunch reports. Parent delivery is scheduled for handover.</p></div><div className="state-result-facts"><span><strong>0</strong>reports remaining</span><span><strong>2</strong>history events added</span><span><strong>1</strong>handover updated</span></div><button className="state-primary-action" type="button" onClick={() => props.selectState("closed")}>View handled result<ChevronRight aria-hidden="true" /></button></div>
    case "corrected":
      return <div className="state-timeline"><div><span>09:16</span><i /><article><strong>Draft revision 4</strong><p>Some eaten · Tired · recorded on Manager Mac</p></article></div><div><span>09:17</span><i /><article><strong>Server revision 5</strong><p>Most eaten · Settled · recorded by Lina R.</p></article></div><div className="is-current"><span>09:21</span><i /><article><strong>Correction accepted · revision 6</strong><p>Most eaten · Tired. Reason: practitioner confirmed mood after handover.</p><small>Corrected by Karim S. · original revisions preserved</small></article></div></div>
    case "closed":
      return <div className="state-closed"><ShieldCheck aria-hidden="true" /><div><span>Closed at 09:24</span><strong>Meadow lunch care is handled</strong><p>Submission, review, correction, and handover obligations are complete.</p></div><dl><div><dt>Final revision</dt><dd>6</dd></div><div><dt>Submitted by</dt><dd>Karim S.</dd></div><div><dt>Reviewed by</dt><dd>Noor H.</dd></div><div><dt>Evidence</dt><dd>3 history events · 0 attachments</dd></div></dl><button className="state-primary-action" type="button" onClick={() => props.selectState("initial")}>Start another record<ChevronRight aria-hidden="true" /></button></div>
  }
}
