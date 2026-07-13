"use client"

import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, ExternalLink, Play, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, type CSSProperties } from "react"
import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"
import { brandDirections, pinterestReferenceById, pinterestReferences, type BrandDirection, type BrandDirectionId } from "../_data"

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
  initialDirection: BrandDirectionId | null
}) {
  const [activeId, setActiveId] = useState<BrandDirectionId | null>(initialDirection)
  const [motionRun, setMotionRun] = useState(0)
  const active = activeId ? brandDirections.find((direction) => direction.id === activeId) ?? null : null

  const replaceDirectionQuery = (id: BrandDirectionId | null) => {
    const params = new URLSearchParams(window.location.search)
    if (id) params.set("direction", id)
    else params.delete("direction")
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
  }

  const selectDirection = (id: BrandDirectionId) => {
    setActiveId(id)
    setMotionRun((value) => value + 1)
    replaceDirectionQuery(id)
    window.requestAnimationFrame(() => document.querySelector("#direction-proof")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  const clearDirection = () => {
    setActiveId(null)
    replaceDirectionQuery(null)
    window.requestAnimationFrame(() => document.querySelector("#direction-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  return (
    <main className="brand-room" data-axe-audit={axeAuditEnabled ? "axe" : undefined} data-direction={active?.id ?? "gallery"}>
      <AxeAuditHarness
        activeRootSelector='.brand-room[data-axe-audit="axe"]'
        auditNodeId="kiddz-brand-direction-axe-audit"
        auditTriggerId="kiddz-run-brand-direction-axe-audit"
        enabled={axeAuditEnabled}
        signature={active?.id ?? "gallery"}
        surfaceToken="--surface"
      />
      <header className="brand-room__masthead">
        <div className="brand-room__brand">Kiddz <span>Online</span></div>
        <div className="brand-room__status"><span aria-hidden="true" /> {active ? `Inspecting ${active.name}` : "Direction gate · no selection"}</div>
      </header>

      <section className="brand-room__intro" aria-labelledby="brand-direction-title">
        <p>Brand direction room · six options · no default winner</p>
        <h1 id="brand-direction-title">See the whole creative field before choosing a direction.</h1>
        <span>
          Ten live Pinterest references become six independent strategies, identities, type systems,
          palettes, and motion beliefs. Every source and every refusal is visible below.
        </span>
      </section>

      <PinterestSourceWall />
      <DirectionGallery activeId={activeId} onSelect={selectDirection} />

      <div aria-live="polite" className="sr-only">{active ? `Showing full proof for ${active.name}` : "Showing all six creative directions"}</div>
      {active ? (
        <section className="direction-detail" id="direction-proof">
          <header className="direction-detail__header">
            <button onClick={clearDirection} type="button"><ArrowLeft aria-hidden="true" /> Back to all six</button>
            <div><span>Full proof · not a selection</span><strong>{active.number} / {active.name}</strong></div>
          </header>
          <BrandBoard direction={active} motionRun={motionRun} onPlay={() => setMotionRun((value) => value + 1)} />
        </section>
      ) : null}

      <footer className="brand-room__boundary">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>This is the decision before the design system.</strong>
          <span>After selection: codify the identity, tokens, components, motion, and the first production pilot.</span>
        </div>
        <Link href="/design-lab/brand-directions/evaluation">Read the research verdict <ArrowRight aria-hidden="true" /></Link>
      </footer>
    </main>
  )
}

function PinterestSourceWall() {
  const clusters = Array.from(new Set(pinterestReferences.map((reference) => reference.cluster)))

  return (
    <section className="pinterest-source-wall" aria-labelledby="pinterest-source-title">
      <div className="pinterest-source-wall__heading">
        <div>
          <span>Live source board · refreshed 13 July 2026</span>
          <h2 id="pinterest-source-title">Pinterest is evidence here, not decoration.</h2>
        </div>
        <p>The board contains ten saved references. We extracted four recurring taste signals, then translated them into six systems instead of copying one brand.</p>
      </div>

      <div className="pinterest-source-wall__body">
        <a className="pinterest-board-visual" href="https://fr.pinterest.com/karims2381/_pins/" rel="noreferrer" target="_blank">
          <Image
            alt="Karim's Pinterest board showing ten saved references for motion, identity, child-world expression, and brand-to-product systems"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 42vw"
            src="/brand-research/pinterest-board-2026-07-13.png"
          />
          <span>Open the live board <ExternalLink aria-hidden="true" /></span>
        </a>

        <div className="pinterest-clusters">
          {clusters.map((cluster, index) => (
            <section className="pinterest-cluster" key={cluster}>
              <header><span>0{index + 1}</span><h3>{cluster}</h3></header>
              {pinterestReferences.filter((reference) => reference.cluster === cluster).map((reference) => (
                <a href={reference.href} key={reference.id} rel="noreferrer" target="_blank">
                  <strong>{reference.title}</strong>
                  <span>{reference.signal}</span>
                  <ExternalLink aria-hidden="true" />
                </a>
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}

function DirectionGallery({ activeId, onSelect }: { activeId: BrandDirectionId | null; onSelect: (id: BrandDirectionId) => void }) {
  return (
    <section className="direction-gallery-section" id="direction-gallery" aria-labelledby="direction-gallery-title">
      <header className="direction-gallery-section__heading">
        <div><span>Six independent translations</span><h2 id="direction-gallery-title">Compare every direction at once.</h2></div>
        <p>Each option has a different strategic belief, memory asset, typographic voice, color role, and Pinterest lineage. Opening proof does not select it.</p>
      </header>

      <div className="direction-gallery">
        {brandDirections.map((direction) => (
          <article
            className={`direction-gallery-card${activeId === direction.id ? " is-open" : ""}`}
            data-gallery-direction={direction.id}
            key={direction.id}
            style={{
              "--card-ink": direction.colors[0].value,
              "--card-accent": direction.colors[1].value,
              "--card-third": direction.colors[2].value,
              "--card-fourth": direction.colors[3].value,
            } as CSSProperties}
          >
            <header className="direction-gallery-card__header">
              <span>{direction.number} / 06</span>
              <div><h3>{direction.name}</h3><p>{direction.short}</p></div>
            </header>

            <DirectionThumbnail direction={direction} />

            <p className="direction-gallery-card__thesis">{direction.thesis}</p>

            <div className="direction-gallery-card__system">
              <div><span>Display</span><strong>{direction.typeDisplay}</strong></div>
              <div><span>Product</span><strong>{direction.typeProduct}</strong></div>
              <div className="direction-gallery-card__palette" aria-label={`${direction.name} palette`} role="group">
                {direction.colors.map((color) => <i key={color.name} style={{ background: color.value }} title={`${color.name} ${color.value}`} />)}
              </div>
            </div>

            <div className="direction-gallery-card__sources">
              <span>Pinterest roots</span>
              <div>{direction.pinterestRoots.map((id) => {
                const reference = pinterestReferenceById[id]
                return <a href={reference.href} key={id} rel="noreferrer" target="_blank">{reference.title}<ExternalLink aria-hidden="true" /></a>
              })}</div>
            </div>

            <dl className="direction-gallery-card__decision">
              <div><dt>Take</dt><dd>{direction.pinterestTake}</dd></div>
              <div><dt>Refuse</dt><dd>{direction.pinterestReject}</dd></div>
            </dl>

            <button aria-pressed={activeId === direction.id} onClick={() => onSelect(direction.id)} type="button">
              {activeId === direction.id ? "Proof open" : "Open full proof"}<ArrowRight aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function DirectionThumbnail({ direction }: { direction: BrandDirection }) {
  if (direction.id === "kinetic-kindness") {
    return <div className="direction-thumbnail direction-thumbnail--kinetic"><strong>Kiddz</strong><span><i />nline</span><em>Care moves with you.</em></div>
  }
  if (direction.id === "open-studio") {
    return <div className="direction-thumbnail direction-thumbnail--studio"><small>K/O · 26</small><strong>KIDDZ<br /><span>ONLINE</span></strong><em>CARE, COMPOSED DAILY</em></div>
  }
  if (direction.id === "living-record") {
    return <div className="direction-thumbnail direction-thumbnail--record"><small>RIVERSIDE · MONDAY</small><strong>Kiddz</strong><em>online</em><span>Care, visibly handled.</span></div>
  }
  if (direction.id === "bright-signal") {
    return <div className="direction-thumbnail direction-thumbnail--signal"><i><span /></i><div><strong>Kiddz</strong><em>Online</em><small>NOW / NEXT / OWNER</small></div></div>
  }
  if (direction.id === "care-commons") {
    return <div className="direction-thumbnail direction-thumbnail--commons"><div><i>AM</i><i>LN</i><i>AR</i></div><strong>Kiddz</strong><em>online, together</em><span>One day. Held by many.</span></div>
  }
  return <div className="direction-thumbnail direction-thumbnail--quiet"><strong>Kiddz</strong><span>Online<i /></span><small>Care, visibly handled.</small></div>
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
