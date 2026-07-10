"use client"

import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from "motion/react"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  Focus,
  Gauge,
  History,
  ListChecks,
  PanelRightOpen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type ScenarioId = "handoff" | "completion" | "panel"
type CompletionPhase = "ready" | "confirming" | "complete"
type SourceId = "coverage" | "accident" | "payment"

type ScenarioDefinition = {
  label: string
  eyebrow: string
  summary: string
  icon: typeof Focus
}

const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  handoff: {
    label: "Queue to source",
    eyebrow: "Continuity",
    summary: "Move from an owned task to its authoritative room record without losing cause, scope, or place.",
    icon: Focus,
  },
  completion: {
    label: "Confirmed completion",
    eyebrow: "Consequence",
    summary: "Settle a resolved task only after the server confirms the source object and linked queue changed.",
    icon: CheckCircle2,
  },
  panel: {
    label: "Interruptible panel",
    eyebrow: "Control",
    summary: "Open, switch, and dismiss contextual records while every interaction remains reversible and responsive.",
    icon: PanelRightOpen,
  },
}

const sourceRecords: Record<SourceId, {
  label: string
  title: string
  meta: string
  status: string
  statusTone: "warning" | "critical" | "safe"
  facts: Array<[string, string]>
}> = {
  coverage: {
    label: "Room coverage",
    title: "Meadow needs cover",
    meta: "Riverside · 12:30-13:00",
    status: "Action due",
    statusTone: "warning",
    facts: [["Required ratio", "1:5"], ["Projected", "1:6 from 12:30"], ["Owner", "Noor H."], ["Source", "Rota + live attendance"]],
  },
  accident: {
    label: "Safety review",
    title: "Theo's accident record",
    meta: "Meadow · submitted 09:42",
    status: "Review due",
    statusTone: "critical",
    facts: [["Recorded by", "Lina R."], ["Manager", "Noor H."], ["Parent status", "Not acknowledged"], ["Source", "Accident revision 3"]],
  },
  payment: {
    label: "Payment allocation",
    title: "Martin family payment",
    meta: "Riverside · EUR 240 received",
    status: "Allocated",
    statusTone: "safe",
    facts: [["Invoice", "KO-2026-0714"], ["Allocated", "EUR 240"], ["Balance", "EUR 0"], ["Source", "Family ledger revision 8"]],
  },
}

const transition = {
  type: "spring" as const,
  stiffness: 430,
  damping: 38,
  mass: 0.68,
}

const panelTransition = {
  type: "spring" as const,
  stiffness: 470,
  damping: 42,
  mass: 0.72,
}

export function MotionContractLab() {
  const [scenario, setScenario] = useState<ScenarioId>("handoff")
  const [forceReducedMotion, setForceReducedMotion] = useState(false)
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [completionPhase, setCompletionPhase] = useState<CompletionPhase>("ready")
  const [activeSource, setActiveSource] = useState<SourceId | null>(null)
  const [announcement, setAnnouncement] = useState("")
  const handoffTriggerRef = useRef<HTMLButtonElement>(null)
  const handoffCloseRef = useRef<HTMLButtonElement>(null)
  const panelCloseRef = useRef<HTMLButtonElement>(null)
  const panelReturnFocusRef = useRef<HTMLButtonElement | null>(null)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeHandoff = useCallback(() => {
    setHandoffOpen(false)
    setAnnouncement("Room source closed. Focus returned to the queue item.")
    window.requestAnimationFrame(() => handoffTriggerRef.current?.focus())
  }, [])

  const closeSourcePanel = useCallback(() => {
    setActiveSource(null)
    setAnnouncement("Context panel closed. Focus returned to its source trigger.")
    const returnTarget = panelReturnFocusRef.current
    window.requestAnimationFrame(() => returnTarget?.focus())
  }, [])

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (activeSource) closeSourcePanel()
      else if (handoffOpen) closeHandoff()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [activeSource, closeHandoff, closeSourcePanel, handoffOpen])

  const selectScenario = (nextScenario: ScenarioId) => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
    setScenario(nextScenario)
    setHandoffOpen(false)
    setActiveSource(null)
    setCompletionPhase("ready")
    setAnnouncement(`${scenarios[nextScenario].label} prototype loaded.`)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }))
  }

  const openHandoff = () => {
    setHandoffOpen(true)
    setAnnouncement("Meadow source opened from owned work.")
    window.setTimeout(() => handoffCloseRef.current?.focus(), forceReducedMotion ? 0 : 180)
  }

  const startCompletion = () => {
    if (completionPhase !== "ready") return
    setCompletionPhase("confirming")
    setAnnouncement("Assignment sent to the Riverside source record.")
    completionTimerRef.current = setTimeout(() => {
      setCompletionPhase("complete")
      setAnnouncement("Server confirmed. Meadow coverage and the owned-work queue are updated.")
    }, 720)
  }

  const resetCompletion = () => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current)
    setCompletionPhase("ready")
    setAnnouncement("Completion fixture reset to its unresolved source state.")
  }

  const openSourcePanel = (source: SourceId, trigger: HTMLButtonElement) => {
    const opening = activeSource === null
    panelReturnFocusRef.current = trigger
    setActiveSource(source)
    setAnnouncement(`${sourceRecords[source].title} opened in context.`)
    if (opening) window.setTimeout(() => panelCloseRef.current?.focus(), forceReducedMotion ? 0 : 180)
  }

  const activeDefinition = scenarios[scenario]
  const ActiveIcon = activeDefinition.icon

  return (
    <MotionConfig reducedMotion={forceReducedMotion ? "always" : "user"} transition={transition}>
      <div className="motion-lab">
        <aside className="motion-lab__sidebar" aria-label="Motion prototypes">
          <header>
            <span>Design system lab</span>
            <strong>Motion contracts</strong>
          </header>
          <p>Territory-neutral behavior. Every transition must clarify source, consequence, or control.</p>
          <nav aria-label="Motion scenarios">
            {(Object.keys(scenarios) as ScenarioId[]).map((scenarioId, index) => {
              const definition = scenarios[scenarioId]
              const Icon = definition.icon
              return (
                <button
                  key={scenarioId}
                  className={scenario === scenarioId ? "is-active" : undefined}
                  aria-current={scenario === scenarioId ? "page" : undefined}
                  type="button"
                  onClick={() => selectScenario(scenarioId)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon aria-hidden="true" />
                  <span><strong>{definition.label}</strong><small>{definition.eyebrow}</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
              )
            })}
          </nav>
          <footer>
            <ShieldCheck aria-hidden="true" />
            <span><strong>Acceptance rule</strong>State remains legible without motion.</span>
          </footer>
        </aside>

        <div className="motion-lab__workspace">
          <header className="motion-lab__topbar">
            <div><span>Riverside · synthetic operations</span><strong>Purposeful motion prototype</strong></div>
            <label className="motion-toggle">
              <input
                type="checkbox"
                checked={forceReducedMotion}
                onChange={(event) => {
                  setForceReducedMotion(event.target.checked)
                  setAnnouncement(event.target.checked ? "Reduced-motion preview enabled." : "System motion preference restored.")
                }}
              />
              <span aria-hidden="true"><i /></span>
              Force reduced motion
            </label>
          </header>

          <main className="motion-lab__main">
            <section className="motion-lab__heading">
              <div className="motion-lab__heading-icon"><ActiveIcon aria-hidden="true" /></div>
              <div><span>{activeDefinition.eyebrow} prototype</span><h1>{activeDefinition.label}</h1><p>{activeDefinition.summary}</p></div>
              <div className="motion-lab__mode"><CircleDot aria-hidden="true" /><span><strong>{forceReducedMotion ? "Reduced" : "User preference"}</strong>Motion policy</span></div>
            </section>

            <LayoutGroup id="kiddz-motion-lab">
              <section className="motion-stage" aria-label={`${activeDefinition.label} interactive prototype`}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={scenario}
                    className="motion-stage__scenario"
                    initial={{ opacity: 0, y: forceReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: forceReducedMotion ? 0 : -6 }}
                    transition={{ duration: forceReducedMotion ? 0.01 : 0.16, ease: "easeOut" }}
                  >
                    {scenario === "handoff" && (
                      <HandoffPrototype
                        isOpen={handoffOpen}
                        triggerRef={handoffTriggerRef}
                        closeRef={handoffCloseRef}
                        onOpen={openHandoff}
                        onClose={closeHandoff}
                        onResolve={() => selectScenario("completion")}
                      />
                    )}
                    {scenario === "completion" && (
                      <CompletionPrototype phase={completionPhase} onComplete={startCompletion} onReset={resetCompletion} />
                    )}
                    {scenario === "panel" && (
                      <PanelPrototype
                        activeSource={activeSource}
                        closeRef={panelCloseRef}
                        onOpen={openSourcePanel}
                        onClose={closeSourcePanel}
                        reduceMotion={forceReducedMotion}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>
            </LayoutGroup>

            <ContractPanel scenario={scenario} forceReducedMotion={forceReducedMotion} />
          </main>
          <p className="motion-lab__announcement" aria-live="polite">{announcement}</p>
        </div>
      </div>
    </MotionConfig>
  )
}

function HandoffPrototype({
  isOpen,
  triggerRef,
  closeRef,
  onOpen,
  onClose,
  onResolve,
}: {
  isOpen: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
  closeRef: React.RefObject<HTMLButtonElement | null>
  onOpen: () => void
  onClose: () => void
  onResolve: () => void
}) {
  return (
    <div className="handoff-prototype">
      <section className="motion-queue" aria-labelledby="owned-work-heading">
        <header><div><span>Owned work · Riverside</span><h2 id="owned-work-heading">Needs you now</h2></div><span className="motion-count">3 open</span></header>
        <div className="motion-queue__list">
          <motion.button
            ref={triggerRef}
            layout
            className={`motion-work-item${isOpen ? " is-open" : ""}`}
            type="button"
            onClick={onOpen}
            aria-expanded={isOpen}
          >
            {!isOpen ? <motion.span className="motion-source-anchor is-warning" layoutId="meadow-coverage-source"><Users aria-hidden="true" /></motion.span> : <span className="motion-source-anchor-placeholder" aria-hidden="true" />}
            <span><small>Ratio coverage · due in 28 min</small><strong>Meadow needs one practitioner</strong><em>12:30-13:00 · projected ratio 1:6</em></span>
            <span className="motion-owner">You</span>
            <ChevronRight aria-hidden="true" />
          </motion.button>
          <button className="motion-work-item" type="button" onClick={() => undefined}>
            <span className="motion-source-anchor is-critical"><History aria-hidden="true" /></span>
            <span><small>Safety review · waiting 18 min</small><strong>Review Theo&apos;s accident record</strong><em>Parent acknowledgement still pending</em></span>
            <span className="motion-owner">You</span>
            <ChevronRight aria-hidden="true" />
          </button>
          <button className="motion-work-item" type="button" onClick={() => undefined}>
            <span className="motion-source-anchor"><ListChecks aria-hidden="true" /></span>
            <span><small>Daily care · due before 14:00</small><strong>Approve Meadow lunch reports</strong><em>2 reports submitted · 1 awaiting review</em></span>
            <span className="motion-owner">Noor</span>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <footer><Clock3 aria-hidden="true" />Ordered by legal and operational consequence, then time.</footer>
      </section>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.aside
            key="coverage-source"
            className="handoff-source"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={panelTransition}
            aria-labelledby="coverage-source-heading"
          >
            <header>
              <motion.span className="motion-source-anchor is-warning" layoutId="meadow-coverage-source"><Users aria-hidden="true" /></motion.span>
              <div><span>Authoritative source</span><h2 id="coverage-source-heading">Meadow coverage</h2></div>
              <button ref={closeRef} className="motion-icon-button" type="button" onClick={onClose} aria-label="Close Meadow source"><X aria-hidden="true" /></button>
            </header>
            <div className="handoff-source__status"><span>At risk from 12:30</span><strong>1 practitioner needed</strong><p>Eight present children. Lina&apos;s break creates a projected 1:6 ratio for 30 minutes.</p></div>
            <dl>
              <div><dt>Evidence</dt><dd>Live attendance + rota</dd></div>
              <div><dt>Last reconciled</dt><dd>10:02 · 2 min ago</dd></div>
              <div><dt>Current owner</dt><dd>You · nursery manager</dd></div>
            </dl>
            <button className="motion-primary-button" type="button" onClick={onResolve}>Resolve coverage<ArrowRight aria-hidden="true" /></button>
          </motion.aside>
        ) : (
          <div className="handoff-placeholder"><PanelRightOpen aria-hidden="true" /><strong>Open a work item</strong><p>The destination will retain the same source cue, scope, and urgency.</p></div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CompletionPrototype({ phase, onComplete, onReset }: { phase: CompletionPhase; onComplete: () => void; onReset: () => void }) {
  const isComplete = phase === "complete"
  return (
    <div className="completion-prototype">
      <header className="completion-summary">
        <div><span>Riverside · owned work</span><h2>{isComplete ? "Coverage is handled" : "Resolve Meadow coverage"}</h2><p>{isComplete ? "The room source and linked queue now agree." : "Review the exact time, assignment, and resulting ratio before confirming."}</p></div>
        <div className="completion-counter" aria-label={`${isComplete ? 2 : 3} open work items`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.strong key={isComplete ? 2 : 3} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{isComplete ? 2 : 3}</motion.strong>
          </AnimatePresence>
          <span>open</span>
        </div>
      </header>

      <div className="completion-layout">
        <section className="completion-source" aria-labelledby="completion-source-heading">
          <header><div><span>Source review</span><h3 id="completion-source-heading">Meadow · 12:30-13:00</h3></div><span className={isComplete ? "is-safe" : "is-warning"}>{isComplete ? "Covered" : "At risk"}</span></header>
          <div className="completion-assignment">
            <div className="completion-avatar">HS</div>
            <div><strong>Hana Scott</strong><span>Float practitioner · available 12:15-14:00</span></div>
            <Check aria-hidden="true" />
          </div>
          <dl>
            <div><dt>Current projection</dt><dd>{isComplete ? "1:4 · compliant" : "1:6 · below rule"}</dd></div>
            <div><dt>After assignment</dt><dd>1:4 · 2 practitioners</dd></div>
            <div><dt>Scope</dt><dd>Riverside · Meadow only</dd></div>
          </dl>
          <div className="completion-actions">
            <button type="button" onClick={onReset} disabled={phase === "ready"}><RotateCcw aria-hidden="true" />Reset</button>
            <motion.button className="motion-primary-button" type="button" onClick={onComplete} disabled={phase !== "ready"} whileTap={{ scale: 0.985 }}>
              {phase === "ready" && <>Confirm assignment<ArrowRight aria-hidden="true" /></>}
              {phase === "confirming" && <><span className="motion-saving-dot" />Saving to Riverside</>}
              {phase === "complete" && <><Check aria-hidden="true" />Server confirmed</>}
            </motion.button>
          </div>
        </section>

        <section className="completion-evidence" aria-labelledby="completion-evidence-heading">
          <header><span>Durable result</span><h3 id="completion-evidence-heading">What changed</h3></header>
          <AnimatePresence mode="wait" initial={false}>
            {!isComplete ? (
              <motion.div key="pending" className="completion-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Clock3 aria-hidden="true" /><strong>{phase === "confirming" ? "Awaiting server confirmation" : "No change submitted"}</strong><p>The work item remains open until the source record accepts the assignment.</p>
              </motion.div>
            ) : (
              <motion.div key="complete" className="completion-confirmed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CheckCircle2 aria-hidden="true" /><div><span>Confirmed 10:04</span><strong>Hana assigned to Meadow</strong><p>Coverage source revision 12 · owned work item closed by server.</p></div>
                <ul><li><Check aria-hidden="true" />Room ratio projection updated to 1:4</li><li><Check aria-hidden="true" />Hana&apos;s rota now includes Meadow</li><li><Check aria-hidden="true" />Queue history records Noor H. as resolver</li></ul>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}

function PanelPrototype({
  activeSource,
  closeRef,
  onOpen,
  onClose,
  reduceMotion,
}: {
  activeSource: SourceId | null
  closeRef: React.RefObject<HTMLButtonElement | null>
  onOpen: (source: SourceId, trigger: HTMLButtonElement) => void
  onClose: () => void
  reduceMotion: boolean
}) {
  return (
    <div className="panel-prototype">
      <section className="panel-source-list" aria-labelledby="source-list-heading">
        <header><div><span>Today · Riverside</span><h2 id="source-list-heading">Open source records</h2></div><span>3 records</span></header>
        {(Object.keys(sourceRecords) as SourceId[]).map((sourceId) => {
          const source = sourceRecords[sourceId]
          return (
            <button
              key={sourceId}
              className={activeSource === sourceId ? "is-active" : undefined}
              type="button"
              aria-expanded={activeSource === sourceId}
              onClick={(event) => onOpen(sourceId, event.currentTarget)}
            >
              <span className={`panel-record-dot is-${source.statusTone}`} />
              <span><small>{source.label}</small><strong>{source.title}</strong><em>{source.meta}</em></span>
              <ExternalLink aria-hidden="true" />
            </button>
          )
        })}
        <p><Sparkles aria-hidden="true" />Try opening one record, then another before the panel settles. The transition retargets without blocking input.</p>
      </section>

      <AnimatePresence initial={false}>
        {activeSource && (
          <motion.aside
            key="context-panel"
            className="context-panel"
            initial={{ opacity: 0, x: reduceMotion ? 0 : 34 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : 26 }}
            transition={panelTransition}
            aria-label="Contextual source record"
          >
            <header><span>Context panel</span><button ref={closeRef} className="motion-icon-button" type="button" onClick={onClose} aria-label="Close context panel"><X aria-hidden="true" /></button></header>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={activeSource} className="context-panel__content" initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }} transition={{ duration: reduceMotion ? 0.01 : 0.14 }}>
                <span className={`context-panel__status is-${sourceRecords[activeSource].statusTone}`}>{sourceRecords[activeSource].status}</span>
                <h2>{sourceRecords[activeSource].title}</h2>
                <p>{sourceRecords[activeSource].meta}</p>
                <dl>{sourceRecords[activeSource].facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                <button className="motion-primary-button" type="button">Open full record<ArrowRight aria-hidden="true" /></button>
              </motion.div>
            </AnimatePresence>
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence>{activeSource && <motion.div className="context-panel__scrim" aria-hidden="true" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
    </div>
  )
}

function ContractPanel({ scenario, forceReducedMotion }: { scenario: ScenarioId; forceReducedMotion: boolean }) {
  const contracts: Record<ScenarioId, Array<{ label: string; value: string; icon: typeof Gauge }>> = {
    handoff: [
      { label: "Purpose", value: "Preserve source continuity", icon: Focus },
      { label: "Animated", value: "Transform + opacity", icon: Gauge },
      { label: "Spring", value: "430 / 38 / 0.68", icon: Sparkles },
      { label: "Evidence", value: "Scope stays in both states", icon: ShieldCheck },
    ],
    completion: [
      { label: "Purpose", value: "Signal server consequence", icon: CheckCircle2 },
      { label: "Animated", value: "Transform + opacity", icon: Gauge },
      { label: "Spring", value: "430 / 38 / 0.68", icon: Sparkles },
      { label: "Evidence", value: "Revision + history remain", icon: ShieldCheck },
    ],
    panel: [
      { label: "Purpose", value: "Maintain reversible context", icon: PanelRightOpen },
      { label: "Animated", value: "Transform + opacity", icon: Gauge },
      { label: "Spring", value: "470 / 42 / 0.72", icon: Sparkles },
      { label: "Evidence", value: "Focus returns to trigger", icon: ShieldCheck },
    ],
  }
  return (
    <section className="motion-contract" aria-labelledby="motion-contract-heading">
      <header><span>Acceptance contract</span><h2 id="motion-contract-heading">Motion earns its place</h2><p>No animation is the only evidence that work moved, saved, failed, or completed.</p></header>
      <div className="motion-contract__grid">
        {contracts[scenario].map(({ label, value, icon: Icon }) => <div key={label}><Icon aria-hidden="true" /><span><small>{label}</small><strong>{value}</strong></span></div>)}
      </div>
      <div className="motion-contract__reduced"><CircleDot aria-hidden="true" /><span><small>Reduced equivalent</small><strong>{forceReducedMotion ? "Active now: instant geometry + preserved opacity feedback" : "System setting disables transforms and layout motion"}</strong></span></div>
    </section>
  )
}
