import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import { rooms, workItems, type PrototypeView, type Room, type TerritoryId, type WorkItem } from "../_data"
import { territoryStressCopy, type TerritoryStressMode } from "../_stress"

type TodayViewProps = {
  territory: TerritoryId
  selectedRoomId: string
  onSelectRoom: (id: string) => void
  coverAssigned: boolean
  onAssignCover: () => void
  onOpenView: (view: PrototypeView) => void
  stressMode: TerritoryStressMode
}

export function TodayView(props: TodayViewProps) {
  if (props.territory === "signal") return <SignalToday {...props} />
  if (props.territory === "carebook") return <CarebookToday {...props} />
  return <DaylightToday {...props} />
}

function DaylightToday(props: TodayViewProps) {
  const copy = territoryStressCopy[props.stressMode].today.daylight
  return (
    <div className="today-view today-view--daylight territory-view-enter">
      <header className="daylight-readiness">
        <div>
          <span className="territory-eyebrow">Riverside · live at 09:18</span>
          <h1>{copy.heading}</h1>
          <p>{copy.summary}</p>
        </div>
        <div className="daylight-readiness__mark" aria-hidden="true">
          <ShieldCheck />
        </div>
      </header>

      <div className="today-layout">
        <section className="territory-panel room-panel" aria-labelledby="daylight-rooms-title">
          <PanelHeading
            eyebrow="Live rooms"
            title="The nursery now"
            detail="41 of 47 children observed · 11 of 12 staff present"
            id="daylight-rooms-title"
          />
          <div className="room-list">
            {rooms.map((room) => (
              <RoomRow key={room.id} room={room} {...props} />
            ))}
          </div>
        </section>

        <section className="territory-panel work-panel" aria-labelledby="daylight-work-title">
          <PanelHeading eyebrow="Owned work" title="Needs handling" detail="Ordered by consequence and time" id="daylight-work-title" />
          <WorkList {...props} />
        </section>
      </div>

      <section className="daylight-completion-strip" aria-label="Daily completion">
        <span className="daylight-completion-strip__icon"><Sparkles aria-hidden="true" /></span>
        <div><strong>Morning handover is 82% complete</strong><span>4 care reports and 1 parent acknowledgment remain.</span></div>
        <button onClick={() => props.onOpenView("care")} type="button">Open handover <ArrowRight aria-hidden="true" /></button>
      </section>
    </div>
  )
}

function SignalToday(props: TodayViewProps) {
  const copy = territoryStressCopy[props.stressMode].today.signal
  return (
    <div className="today-view today-view--signal territory-view-enter">
      <header className="signal-heading">
        <div>
          <span className="territory-eyebrow">Live operation · refreshed 22 sec ago</span>
          <h1>{copy.heading}</h1>
          <p>{copy.summary}</p>
        </div>
        <div className="signal-heading__facts" aria-label="Current totals">
          <span><strong>41</strong> present</span>
          <span><strong>11</strong> staff</span>
          <span><strong>2</strong> open items</span>
        </div>
      </header>

      <div className="signal-layout">
        <section className="territory-panel signal-plane" aria-labelledby="signal-plane-title">
          <div className="signal-plane__heading">
            <div><span className="territory-eyebrow">Room operating plane</span><h2 id="signal-plane-title">Now and next</h2></div>
            <div className="signal-time-scale" aria-hidden="true"><span>09:18</span><span>11:00</span><span>12:30</span><span>14:00</span></div>
          </div>
          <div className="signal-room-table" role="table" aria-label="Room operating state">
            <div className="signal-room-table__head" role="row">
              <span role="columnheader">Room</span><span role="columnheader">Children</span><span role="columnheader">Staff</span><span role="columnheader">Ratio</span><span role="columnheader">Next change</span>
            </div>
            {rooms.map((room) => <SignalRoomRow key={room.id} room={room} {...props} />)}
          </div>
        </section>

        <section className="territory-panel work-panel signal-work" aria-labelledby="signal-work-title">
          <PanelHeading eyebrow="Resolution queue" title="Work in motion" detail="1 critical · 1 forecast · 2 required" id="signal-work-title" />
          <WorkList {...props} compact />
        </section>
      </div>
    </div>
  )
}

function CarebookToday(props: TodayViewProps) {
  const copy = territoryStressCopy[props.stressMode].today.carebook
  return (
    <div className="today-view today-view--carebook territory-view-enter">
      <header className="carebook-brief">
        <span className="territory-eyebrow">Tuesday&apos;s opening brief · 09:18</span>
        <h1>{props.stressMode === "default" ? <>Riverside is safe now.<br />Meadow needs cover before 12:30.</> : copy.heading}</h1>
        <p>{copy.summary}</p>
        <button onClick={() => props.onSelectRoom("meadow")} type="button">Read Meadow&apos;s source record <ArrowRight aria-hidden="true" /></button>
      </header>

      <div className="carebook-layout">
        <section className="carebook-day-record" aria-labelledby="carebook-rooms-title">
          <div className="carebook-section-heading"><span>Room record</span><h2 id="carebook-rooms-title">The day, room by room</h2><time>As of 09:18</time></div>
          <div className="carebook-room-list">
            {rooms.map((room, index) => <CarebookRoomRow key={room.id} room={room} index={index + 1} {...props} />)}
          </div>
        </section>

        <section className="carebook-notes" aria-labelledby="carebook-work-title">
          <div className="carebook-section-heading"><span>Assigned notes</span><h2 id="carebook-work-title">Still to handle</h2><time>4 open</time></div>
          <WorkList {...props} />
        </section>
      </div>

      <footer className="carebook-activity">
        <span><Check aria-hidden="true" /> 08:52 · Nest opening check confirmed by Ella M.</span>
        <span><UserRoundCheck aria-hidden="true" /> 09:06 · Aya&apos;s medication check recorded by Noor H.</span>
      </footer>
    </div>
  )
}

function PanelHeading({ eyebrow, title, detail, id }: { eyebrow: string; title: string; detail: string; id: string }) {
  return <div className="panel-heading"><div><span className="territory-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2></div><p>{detail}</p></div>
}

function RoomRow({ room, selectedRoomId, onSelectRoom, coverAssigned }: TodayViewProps & { room: Room }) {
  const selected = room.id === selectedRoomId
  const stateLabel = room.id === "meadow" && coverAssigned ? "Cover assigned" : room.stateLabel
  return (
    <div className={`room-row room-row--${room.state}${selected ? " is-selected" : ""}${room.id === "meadow" && coverAssigned ? " is-resolved" : ""}`}>
      <button className="room-row__main" onClick={() => onSelectRoom(room.id)} aria-expanded={selected} type="button">
        <span className="room-state-icon"><RoomStateIcon state={room.id === "meadow" && coverAssigned ? "safe" : room.state} /></span>
        <span className="room-row__identity"><strong>{room.name}</strong><small>{room.age}</small></span>
        <span className="room-row__fact"><strong>{room.present}/{room.expected}</strong><small>children</small></span>
        <span className="room-row__fact"><strong>{room.staffPresent}/{room.staffRequired}</strong><small>staff</small></span>
        <span className="room-row__state"><strong>{stateLabel}</strong><small>{room.nextChange}</small></span>
        <ArrowRight aria-hidden="true" />
      </button>
      {selected && <RoomExpansion room={room} coverAssigned={coverAssigned} />}
    </div>
  )
}

function SignalRoomRow({ room, selectedRoomId, onSelectRoom, coverAssigned }: TodayViewProps & { room: Room }) {
  const selected = room.id === selectedRoomId
  const resolved = room.id === "meadow" && coverAssigned
  return (
    <button className={`signal-room-row signal-room-row--${resolved ? "safe" : room.state}${selected ? " is-selected" : ""}`} onClick={() => onSelectRoom(room.id)} role="row" type="button">
      <span role="cell"><span className="signal-state-dot" /><strong>{room.name}</strong><small>{room.age}</small></span>
      <span role="cell"><strong>{room.present}/{room.expected}</strong><small>{room.unknown ? `${room.unknown} unknown` : "observed"}</small></span>
      <span role="cell"><strong>{room.staffPresent}/{room.staffRequired}</strong><small>on floor</small></span>
      <span role="cell"><strong>{resolved ? "1:4" : room.ratio}</strong><small>{resolved ? "covered" : room.stateLabel}</small></span>
      <span role="cell"><strong>{resolved ? "Cover: Leila N." : room.nextChange}</strong><small>{resolved ? "12:30-13:00" : room.detail}</small></span>
      <ArrowRight aria-hidden="true" />
    </button>
  )
}

function CarebookRoomRow({ room, index, selectedRoomId, onSelectRoom, coverAssigned }: TodayViewProps & { room: Room; index: number }) {
  const selected = room.id === selectedRoomId
  const resolved = room.id === "meadow" && coverAssigned
  return (
    <article className={`carebook-room-entry carebook-room-entry--${resolved ? "safe" : room.state}${selected ? " is-selected" : ""}`}>
      <button onClick={() => onSelectRoom(room.id)} aria-expanded={selected} type="button">
        <span className="carebook-room-entry__number">{String(index).padStart(2, "0")}</span>
        <span className="carebook-room-entry__copy"><strong>{room.name}</strong><small>{resolved ? "Qualified cover assigned for Lina's break." : room.stateLabel}</small></span>
        <span className="carebook-room-entry__count"><strong>{room.present}/{room.expected}</strong><small>children</small></span>
        <time>{room.id === "meadow" ? "12:30" : "Now"}</time>
        <ArrowRight aria-hidden="true" />
      </button>
      {selected && <RoomExpansion room={room} coverAssigned={coverAssigned} />}
    </article>
  )
}

function RoomExpansion({ room, coverAssigned }: { room: Room; coverAssigned: boolean }) {
  const resolved = room.id === "meadow" && coverAssigned
  return (
    <div className="room-expansion territory-detail-enter">
      <div><span>Observed children</span><strong>{room.present} present · {room.absent} absent · {room.late} late{room.unknown ? ` · ${room.unknown} unknown` : ""}</strong></div>
      <div><span>Ratio source</span><strong>{resolved ? "3 qualified staff · covered through 13:00" : `${room.staffPresent} staff · required ${room.staffRequired} · ${room.ratio}`}</strong></div>
      <p>{resolved ? "Leila N. accepted temporary cover from Studio. Both rooms remain safe." : room.detail}</p>
    </div>
  )
}

function WorkList(props: TodayViewProps & { compact?: boolean }) {
  return <div className={`work-list${props.compact ? " work-list--compact" : ""}`}>{workItems.map((item) => <WorkItemRow key={item.id} item={item} {...props} />)}</div>
}

function WorkItemRow({ item, coverAssigned, onAssignCover, onOpenView }: TodayViewProps & { item: WorkItem }) {
  const resolved = item.id === "meadow-cover" && coverAssigned
  const handleAction = () => {
    if (item.id === "meadow-cover") onAssignCover()
    else if (item.id === "care-reports") onOpenView("care")
    else onOpenView("review")
  }
  return (
    <article className={`work-item work-item--${resolved ? "resolved" : item.priority}`}>
      <span className="work-item__icon"><WorkIcon priority={resolved ? "info" : item.priority} resolved={resolved} /></span>
      <div className="work-item__copy">
        <span>{resolved ? "Handled · cover accepted" : item.eyebrow}</span>
        <strong>{resolved ? "Meadow cover assigned to Leila N." : item.title}</strong>
        <p>{resolved ? "Temporary cover runs 12:30-13:00. Both rooms remain safe." : item.detail}</p>
        <small>{resolved ? "Assigned by you · just now" : `${item.owner} · ${item.due}`}</small>
      </div>
      <button onClick={handleAction} type="button">{resolved ? "View assignment" : item.action}<ArrowRight aria-hidden="true" /></button>
    </article>
  )
}

function RoomStateIcon({ state }: { state: Room["state"] }) {
  if (state === "safe") return <CheckCircle2 aria-hidden="true" />
  if (state === "forecast") return <Clock3 aria-hidden="true" />
  return <CircleHelp aria-hidden="true" />
}

function WorkIcon({ priority, resolved }: { priority: WorkItem["priority"]; resolved?: boolean }) {
  if (resolved) return <CheckCircle2 aria-hidden="true" />
  if (priority === "critical") return <AlertTriangle aria-hidden="true" />
  if (priority === "forecast") return <Clock3 aria-hidden="true" />
  if (priority === "required") return <ClipboardCheckIcon />
  return <CircleHelp aria-hidden="true" />
}

function ClipboardCheckIcon() {
  return <ShieldCheck aria-hidden="true" />
}
