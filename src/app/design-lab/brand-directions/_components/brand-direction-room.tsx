"use client"

import { AlertTriangle, ArrowRight, Check, CircleHelp, Clock3, Play, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import { useState, type CSSProperties } from "react"
import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"
import { brandDirections, type BrandDirection, type BrandDirectionId } from "../_data"

const rooms = [
  { name: "Nest", count: "8 / 8", staff: "3 staff", state: "safe", label: "Safe now", detail: "Ella starts break at 11:45" },
  { name: "Meadow", count: "12 / 14", staff: "3 staff", state: "forecast", label: "Cover by 12:30", detail: "One qualified practitioner needed" },
  { name: "Orchard", count: "10 / 13", staff: "3 staff", state: "unknown", label: "1 arrival unknown", detail: "Confirm Alma's arrival" },
  { name: "Studio", count: "11 / 12", staff: "2 staff", state: "safe", label: "Safe now", detail: "Lunch handover at 12:10" },
] as const

export function BrandDirectionRoom({
  axeAuditEnabled,
  initialDirection,
}: {
  axeAuditEnabled: boolean
  initialDirection: BrandDirectionId
}) {
  const [activeId, setActiveId] = useState<BrandDirectionId>(initialDirection)
  const [motionRun, setMotionRun] = useState(0)
  const active = brandDirections.find((direction) => direction.id === activeId) ?? brandDirections[0]

  const selectDirection = (id: BrandDirectionId) => {
    setActiveId(id)
    setMotionRun((value) => value + 1)
    window.history.replaceState(null, "", `?direction=${id}`)
  }

  return (
    <main className="brand-room" data-axe-audit={axeAuditEnabled ? "axe" : undefined} data-direction={active.id}>
      <AxeAuditHarness
        activeRootSelector='.brand-room[data-axe-audit="axe"]'
        auditNodeId="kiddz-brand-direction-axe-audit"
        auditTriggerId="kiddz-run-brand-direction-axe-audit"
        enabled={axeAuditEnabled}
        signature={active.id}
        surfaceToken="--surface"
      />
      <header className="brand-room__masthead">
        <div className="brand-room__brand">Kiddz <span>Online</span></div>
        <div className="brand-room__status"><span aria-hidden="true" /> Direction gate · no selection</div>
      </header>

      <section className="brand-room__intro" aria-labelledby="brand-direction-title">
        <p>Brand direction room · round two</p>
        <h1 id="brand-direction-title">Six different beliefs about what Kiddz can become.</h1>
        <span>
          Same nursery truth. Different strategy, identity, typography, color, imagery, voice,
          and motion. Production remains untouched until one system earns the decision.
        </span>
      </section>

      <nav className="direction-switcher" aria-label="Creative directions">
        {brandDirections.map((direction) => (
          <button
            aria-current={direction.id === active.id ? "page" : undefined}
            className={direction.id === active.id ? "is-active" : ""}
            key={direction.id}
            onClick={() => selectDirection(direction.id)}
            type="button"
          >
            <span>{direction.number}</span>
            <strong>{direction.name}</strong>
            <small>{direction.short}</small>
          </button>
        ))}
      </nav>

      <div aria-live="polite" className="sr-only">Showing {active.name}</div>
      <BrandBoard direction={active} motionRun={motionRun} onPlay={() => setMotionRun((value) => value + 1)} />

      <footer className="brand-room__boundary">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>This is the decision before the design system.</strong>
          <span>After selection: codify the identity, tokens, components, motion, and the first production pilot.</span>
        </div>
      </footer>
    </main>
  )
}

function BrandBoard({ direction, motionRun, onPlay }: { direction: BrandDirection; motionRun: number; onPlay: () => void }) {
  return (
    <article className="direction-board" key={direction.id}>
      <section className="direction-hero">
        <div className="direction-hero__identity">
          <DirectionIdentity direction={direction} motionRun={motionRun} />
          <button className="motion-trigger" onClick={onPlay} type="button">
            <Play aria-hidden="true" /> Play {direction.motion.toLowerCase()}
          </button>
        </div>
        <div className="direction-hero__strategy">
          <span>{direction.number} / 06 · {direction.short}</span>
          <h2>{direction.name}</h2>
          <p>{direction.thesis}</p>
          <blockquote>{direction.promise}</blockquote>
          <dl>
            <div><dt>Ownable assets</dt><dd>{direction.identity}</dd></div>
            <div><dt>Voice</dt><dd>{direction.voice}</dd></div>
          </dl>
        </div>
      </section>

      <section className="system-strip" aria-label={`${direction.name} typography and color`}>
        <div className="type-specimen">
          <span>Typography</span>
          <div className="type-specimen__faces">
            <strong>{direction.typeDisplay}</strong>
            <em>with {direction.typeProduct}</em>
          </div>
          <p>Safe now. Meadow needs cover before 12:30.</p>
          <small>{direction.typeNote}</small>
        </div>
        <div className="palette-specimen">
          <span>Color hierarchy</span>
          <div className="palette-specimen__swatches">
            {direction.colors.map((color) => (
              <div key={color.name} style={{ "--swatch": color.value } as CSSProperties}>
                <i aria-hidden="true" />
                <strong>{color.name}</strong>
                <small>{color.value}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="product-proof" aria-labelledby={`${direction.id}-proof-title`}>
        <header className="product-proof__heading">
          <div>
            <span>Controlled product proof · Riverside · 09:18</span>
            <h3 id={`${direction.id}-proof-title`}>Safe now. Two things need handling before lunch.</h3>
          </div>
          <div className="product-proof__facts" aria-label="Current branch totals" role="group">
            <span><strong>41</strong> present</span>
            <span><strong>11</strong> staff</span>
            <span><strong>2</strong> need you</span>
          </div>
        </header>

        <div className="product-proof__workspace">
          <div className="room-proof" role="table" aria-label="Current room state">
            <div className="room-proof__head" role="row">
              <span role="columnheader">Room</span><span role="columnheader">Children</span><span role="columnheader">Team</span><span role="columnheader">State and next change</span>
            </div>
            {rooms.map((room) => <RoomProofRow key={room.name} room={room} />)}
          </div>

          <aside className="attention-proof" aria-labelledby={`${direction.id}-attention-title`}>
            <span>Needs you · review by 10:00</span>
            <AlertTriangle aria-hidden="true" />
            <h4 id={`${direction.id}-attention-title`}>Accident report needs manager review</h4>
            <p>Evidence is complete. Parent acknowledgment is still pending.</p>
            <button type="button">Review report <ArrowRight aria-hidden="true" /></button>
          </aside>
        </div>
      </section>

      <section className="direction-verdict">
        <div><Sparkles aria-hidden="true" /><span>Strongest at</span><p>{direction.bestAt}</p></div>
        <div><AlertTriangle aria-hidden="true" /><span>Kill it if</span><p>{direction.risk}</p></div>
      </section>
    </article>
  )
}

function DirectionIdentity({ direction, motionRun }: { direction: BrandDirection; motionRun: number }) {
  const common = <><span className="identity-kiddz">Kiddz</span><span className="identity-online">Online</span></>

  if (direction.id === "kinetic-kindness") {
    return (
      <div className="identity identity--kinetic" data-motion-run={motionRun} key={motionRun}>
        <span className="identity-kiddz">Kiddz</span>
        <span className="kinetic-online" aria-label="Online" role="img">
          <span className="kinetic-o" aria-hidden="true"><i /></span>
          <span aria-hidden="true" data-letter="n" /><span aria-hidden="true" data-letter="l" /><span aria-hidden="true" data-letter="i" /><span aria-hidden="true" data-letter="n" /><span aria-hidden="true" data-letter="e" />
        </span>
        <span className="kinetic-dot" aria-hidden="true" />
      </div>
    )
  }
  if (direction.id === "open-studio") {
    return <div className="identity identity--studio" data-motion-run={motionRun} key={motionRun}><span className="studio-index">K/O · 26</span><strong>KIDDZ</strong><strong>ONLINE</strong><span className="studio-caption">care, composed daily</span></div>
  }
  if (direction.id === "living-record") {
    return <div className="identity identity--record" data-motion-run={motionRun} key={motionRun}><span>Riverside edition · 09:18</span><strong>Kiddz</strong><em>online</em><small>Care, visibly handled.</small></div>
  }
  if (direction.id === "bright-signal") {
    return <div className="identity identity--signal" data-motion-run={motionRun} key={motionRun}><span className="signal-mark"><i /></span><div>{common}<small>LIVE NURSERY SYSTEM</small></div></div>
  }
  if (direction.id === "care-commons") {
    return <div className="identity identity--commons" data-motion-run={motionRun} key={motionRun}><div className="commons-people"><span>AM</span><span>LN</span><span>AR</span></div><strong>Kiddz</strong><em>online, together</em><small>47 children · 12 staff · 4 rooms · one day</small></div>
  }
  return <div className="identity identity--quiet" data-motion-run={motionRun} key={motionRun}><strong>Kiddz</strong><span className="quiet-online">Online<i /></span><small>Care, visibly handled.</small></div>
}

function RoomProofRow({ room }: { room: (typeof rooms)[number] }) {
  const Icon = room.state === "safe" ? Check : room.state === "forecast" ? Clock3 : CircleHelp
  return (
    <div className={`room-proof__row room-proof__row--${room.state}`} role="row">
      <span role="cell"><i><Icon aria-hidden="true" /></i><strong>{room.name}</strong></span>
      <span role="cell"><strong>{room.count}</strong></span>
      <span role="cell"><UsersRound aria-hidden="true" />{room.staff}</span>
      <span role="cell"><strong>{room.label}</strong><small>{room.detail}</small></span>
    </div>
  )
}
