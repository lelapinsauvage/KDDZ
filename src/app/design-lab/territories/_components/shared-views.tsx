"use client"

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  SlidersHorizontal,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"
import { useMemo, useState } from "react"
import { children, type TerritoryId } from "../_data"

export function ChildrenView({ territory }: { territory: TerritoryId }) {
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<"all" | "unknown" | "incomplete">("all")

  const visibleChildren = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return children.filter((child) => {
      const matchesQuery = !normalizedQuery || `${child.name} ${child.room}`.toLowerCase().includes(normalizedQuery)
      const matchesFilter = activeFilter === "all"
        || (activeFilter === "unknown" && child.attendance === "Unknown")
        || (activeFilter === "incomplete" && child.care !== "Complete")
      return matchesQuery && matchesFilter
    })
  }, [activeFilter, query])

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const toggleVisible = () => {
    const visibleIds = visibleChildren.map((child) => child.id)
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...current, ...visibleIds])))
  }

  return (
    <div className="territory-record-view territory-view-enter" data-view-territory={territory}>
      <header className="record-view-heading">
        <div><span className="territory-eyebrow">Riverside · 47 active records</span><h1>Children</h1><p>Attendance, care completion, and current child context.</p></div>
        <button className="territory-primary-button" type="button"><Plus aria-hidden="true" /> Add child</button>
      </header>

      <section className="record-toolbar" aria-label="Children controls">
        <label className="record-search"><Search aria-hidden="true" /><span className="territory-visually-hidden">Search children</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search child or room" /></label>
        <div className="record-filter-group" aria-label="Saved views">
          <button className={activeFilter === "all" ? "is-active" : undefined} onClick={() => setActiveFilter("all")} type="button">All children <span>47</span></button>
          <button className={activeFilter === "unknown" ? "is-active" : undefined} onClick={() => setActiveFilter("unknown")} type="button">Attendance unknown <span>1</span></button>
          <button className={activeFilter === "incomplete" ? "is-active" : undefined} onClick={() => setActiveFilter("incomplete")} type="button">Care incomplete <span>4</span></button>
        </div>
        <button className="territory-secondary-button record-filter-button" type="button"><SlidersHorizontal aria-hidden="true" /> Filters <span>2</span></button>
      </section>

      {selectedIds.length > 0 && (
        <div className="record-bulk-bar territory-detail-enter" role="status">
          <strong>{selectedIds.length} selected</strong>
          <span />
          <button type="button"><MessageCircle aria-hidden="true" /> Message families</button>
          <button type="button"><Download aria-hidden="true" /> Export selected</button>
          <button onClick={() => setSelectedIds([])} type="button">Clear</button>
        </div>
      )}

      <section className="record-table-shell" aria-label="Children records">
        <table className="record-table">
          <thead>
            <tr>
              <th className="record-table__select"><input aria-label="Select visible children" checked={visibleChildren.length > 0 && visibleChildren.every((child) => selectedIds.includes(child.id))} onChange={toggleVisible} type="checkbox" /></th>
              <th>Child</th><th>Room</th><th>Attendance</th><th>Arrival</th><th>Daily care</th><th>Current context</th><th><span className="territory-visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visibleChildren.map((child) => (
              <tr className={selectedIds.includes(child.id) ? "is-selected" : undefined} key={child.id}>
                <td className="record-table__select"><input aria-label={`Select ${child.name}`} checked={selectedIds.includes(child.id)} onChange={() => toggleSelected(child.id)} type="checkbox" /></td>
                <td><span className="child-identity"><span className="child-avatar">{child.initials}</span><span><strong>{child.name}</strong><small>ID · {child.id.slice(0, 8)}</small></span></span></td>
                <td><span className="room-label">{child.room}</span></td>
                <td><span className={`record-status record-status--${child.attendance.toLowerCase()}`}>{child.attendance}</span></td>
                <td><strong className="record-time">{child.arrival}</strong></td>
                <td><span className={`record-status record-status--${child.care.toLowerCase()}`}>{child.care}</span></td>
                <td><span className="record-note">{child.note}</span></td>
                <td><button className="territory-icon-button" aria-label={`Open actions for ${child.name}`} type="button"><MoreHorizontal aria-hidden="true" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleChildren.length === 0 && <div className="record-empty"><Search aria-hidden="true" /><strong>No children match this view</strong><span>Adjust the search or saved view.</span></div>}
      </section>

      <section className="record-mobile-list" aria-label="Children records">
        {visibleChildren.map((child) => (
          <article className={selectedIds.includes(child.id) ? "is-selected" : undefined} key={child.id}>
            <label>
              <input aria-label={`Select ${child.name}`} checked={selectedIds.includes(child.id)} onChange={() => toggleSelected(child.id)} type="checkbox" />
              <span className="child-avatar">{child.initials}</span>
              <span className="record-mobile-list__identity"><strong>{child.name}</strong><small>{child.room} · {child.arrival}</small></span>
            </label>
            <div className="record-mobile-list__states"><span className={`record-status record-status--${child.attendance.toLowerCase()}`}>{child.attendance}</span><span className={`record-status record-status--${child.care.toLowerCase()}`}>{child.care} care</span></div>
            <p>{child.note}</p>
            <button aria-label={`Open ${child.name}`} type="button"><ArrowRight aria-hidden="true" /></button>
          </article>
        ))}
        {visibleChildren.length === 0 && <div className="record-empty"><Search aria-hidden="true" /><strong>No children match this view</strong><span>Adjust the search or saved view.</span></div>}
      </section>

      <footer className="record-table-footer"><span>Showing {visibleChildren.length} of 47 children</span><div><button disabled type="button"><ArrowLeft aria-hidden="true" /> Previous</button><button type="button">Next <ArrowRight aria-hidden="true" /></button></div></footer>
    </div>
  )
}

export function CareView({ territory }: { territory: TerritoryId }) {
  const cohort = children.filter((child) => child.room === "Meadow")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [meal, setMeal] = useState("")
  const [mood, setMood] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"idle" | "draft" | "error" | "submitted">("idle")

  const toggleChild = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    setStatus("idle")
  }

  const saveDraft = () => setStatus("draft")
  const submit = () => {
    if (selectedIds.length === 0 || !meal || !mood) setStatus("error")
    else setStatus("submitted")
  }

  return (
    <div className="care-entry-view territory-view-enter" data-view-territory={territory}>
      <header className="record-view-heading care-view-heading">
        <div><span className="territory-eyebrow">Meadow · lunch observation</span><h1>Record room care</h1><p>Apply one observed value, then review each child exception.</p></div>
        <div className="care-draft-state"><span className={status === "draft" || status === "submitted" ? "is-saved" : undefined} /><strong>{status === "draft" ? "Draft saved just now" : status === "submitted" ? "Submitted to 2 children" : "Not yet saved"}</strong></div>
      </header>

      <div className="care-entry-layout">
        <section className="care-roster territory-panel" aria-labelledby="care-roster-title">
          <div className="care-section-heading"><div><span className="territory-eyebrow">Step 1</span><h2 id="care-roster-title">Choose observed children</h2></div><span>{selectedIds.length} selected</span></div>
          <div className="care-child-list">
            {cohort.map((child) => (
              <label className={selectedIds.includes(child.id) ? "is-selected" : undefined} key={child.id}>
                <input checked={selectedIds.includes(child.id)} onChange={() => toggleChild(child.id)} type="checkbox" />
                <span className="child-avatar">{child.initials}</span>
                <span><strong>{child.name}</strong><small>{child.attendance} · {child.care} report</small></span>
                {selectedIds.includes(child.id) && <Check aria-hidden="true" />}
              </label>
            ))}
          </div>
          <button className="territory-text-button" onClick={() => setSelectedIds(cohort.map((child) => child.id))} type="button"><UsersRound aria-hidden="true" /> Select observed room group</button>
        </section>

        <form className="care-form territory-panel" onSubmit={(event) => { event.preventDefault(); submit() }}>
          <div className="care-section-heading"><div><span className="territory-eyebrow">Step 2</span><h2>Record the shared observation</h2></div><span>Fields start unset</span></div>

          <div className="care-form-grid">
            <label><span>Meal</span><select value={meal} onChange={(event) => { setMeal(event.target.value); setStatus("idle") }}><option value="">Choose observed portion</option><option>All eaten</option><option>Most eaten</option><option>Some eaten</option><option>Not eaten</option></select><ChevronDown aria-hidden="true" /></label>
            <label><span>Mood after lunch</span><select value={mood} onChange={(event) => { setMood(event.target.value); setStatus("idle") }}><option value="">Choose observed mood</option><option>Settled</option><option>Energetic</option><option>Tired</option><option>Upset</option></select><ChevronDown aria-hidden="true" /></label>
            <label className="care-form-grid__wide"><span>Room note <small>Optional</small></span><textarea value={note} onChange={(event) => { setNote(event.target.value); setStatus("idle") }} placeholder="Add context that applies to the selected children" rows={4} /></label>
          </div>

          <button className="care-attachment" type="button"><Paperclip aria-hidden="true" /><span><strong>Add photo or document</strong><small>No attachment selected</small></span><Plus aria-hidden="true" /></button>

          {status === "error" && <div className="care-form-message care-form-message--error" role="alert"><AlertCircle aria-hidden="true" /><span><strong>Complete the observed group and values</strong><small>Select at least one child, a meal portion, and a mood.</small></span></div>}
          {status === "submitted" && <div className="care-form-message care-form-message--success" role="status"><CheckCircle2 aria-hidden="true" /><span><strong>Lunch observation submitted</strong><small>{selectedIds.length} child records updated from the server-confirmed result.</small></span></div>}
          {status === "draft" && <div className="care-form-message" role="status"><Clock3 aria-hidden="true" /><span><strong>Draft saved</strong><small>Revision 3 can be resumed on the Meadow tablet.</small></span></div>}

          <div className="care-form-actions"><button className="territory-secondary-button" onClick={saveDraft} type="button">Save draft</button><button className="territory-primary-button" type="submit">Review and submit <ArrowRight aria-hidden="true" /></button></div>
        </form>
      </div>

      <section className="care-exceptions" aria-labelledby="care-exceptions-title"><div><span className="territory-eyebrow">Step 3</span><h2 id="care-exceptions-title">Child exceptions</h2></div><p>Exceptions become available after a shared observation and never inherit factual values silently.</p><button disabled={!meal || selectedIds.length === 0} type="button">Review {selectedIds.length || 0} children <ArrowRight aria-hidden="true" /></button></section>
    </div>
  )
}

export function ReviewView({ territory }: { territory: TerritoryId }) {
  const [reviewed, setReviewed] = useState(false)
  const [allocated, setAllocated] = useState(false)

  return (
    <div className="review-view territory-view-enter" data-view-territory={territory}>
      <header className="record-view-heading">
        <div><span className="territory-eyebrow">Safety and financial review</span><h1>Two consequential changes</h1><p>Review source evidence and result before commitment.</p></div>
      </header>

      <div className="review-layout">
        <section className={`review-object review-object--critical${reviewed ? " is-reviewed" : ""}`} aria-labelledby="accident-review-title">
          <header className="review-object__header">
            <span className="review-object__icon">{reviewed ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}</span>
            <div><span className="territory-eyebrow">{reviewed ? "Manager reviewed at 09:22" : "Review by 10:00 · submitted 08:44"}</span><h2 id="accident-review-title">Minor playground accident</h2><p>Leo Dubois · Studio · incident A-1047</p></div>
            <span className={`record-status record-status--${reviewed ? "complete" : "unknown"}`}>{reviewed ? "Reviewed" : "Awaiting review"}</span>
          </header>

          <div className="review-facts">
            <div><span>Observed event</span><strong>Small graze to right knee during outdoor play</strong></div>
            <div><span>Immediate care</span><strong>Cleaned with water; sterile dressing applied</strong></div>
            <div><span>Child state</span><strong>Comfortable and returned to quiet play at 08:51</strong></div>
            <div><span>Evidence</span><strong>2 observations · 1 attachment · first-aid record complete</strong></div>
          </div>

          <ol className="review-timeline" aria-label="Accident report history">
            <li><span /><div><strong>08:39 · Event observed</strong><small>Recorded by Mila R. · Studio</small></div></li>
            <li><span /><div><strong>08:44 · Report submitted</strong><small>Required evidence complete · revision 2</small></div></li>
            {reviewed && <li className="territory-detail-enter"><span /><div><strong>09:22 · Manager review confirmed</strong><small>Confirmed by Karim S. · parent acknowledgment still pending</small></div></li>}
          </ol>

          <div className="review-consequence">
            <div><strong>{reviewed ? "Parent acknowledgment remains pending" : "Confirming review will notify Leo's parent"}</strong><span>{reviewed ? "Message sent at 09:22. The report stays open until acknowledgment." : "The report will remain open and visible until the parent acknowledges it."}</span></div>
            {reviewed ? <button className="territory-secondary-button" type="button"><MessageCircle aria-hidden="true" /> Open message</button> : <button className="territory-primary-button" onClick={() => setReviewed(true)} type="button"><UserRoundCheck aria-hidden="true" /> Confirm manager review</button>}
          </div>
        </section>

        <aside className={`review-object review-object--finance${allocated ? " is-reviewed" : ""}`} aria-labelledby="payment-review-title">
          <header className="review-object__header"><span className="review-object__icon"><span className="currency-mark">EUR</span></span><div><span className="territory-eyebrow">{allocated ? "Allocated just now" : "Recorded yesterday · unallocated"}</span><h2 id="payment-review-title">EUR 240 payment</h2><p>Martin family · bank transfer</p></div></header>
          <div className="payment-balance"><span>Family balance before</span><strong>EUR 480</strong><span>Payment to allocate</span><strong>- EUR 240</strong><span>Balance after</span><strong>EUR 240</strong></div>
          <div className="payment-target"><span>Allocate to</span><button type="button"><span><strong>July nursery fees</strong><small>Invoice INV-2048 · EUR 480 remaining</small></span><ChevronDown aria-hidden="true" /></button></div>
          <div className="payment-history"><span>09 Jul · Payment imported from bank feed</span>{allocated && <span className="territory-detail-enter">14 Jul · EUR 240 allocated by Karim S.</span>}</div>
          {allocated ? <div className="care-form-message care-form-message--success" role="status"><CheckCircle2 aria-hidden="true" /><span><strong>Payment allocated</strong><small>Family balance is now EUR 240. Receipt is ready to send.</small></span></div> : <button className="territory-primary-button review-object__full-action" onClick={() => setAllocated(true)} type="button">Allocate EUR 240 <ArrowRight aria-hidden="true" /></button>}
        </aside>
      </div>
    </div>
  )
}
