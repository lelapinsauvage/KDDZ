# Kiddz Online Targeted Reference Flow Study

**Status:** Benchmark flow pass 2
**Last updated:** 2026-07-10
**Focus:** Motion purpose, feedback, recovery, live state, dense work, and cross-device continuity

## Purpose

The first Mobbin pass established broad interaction principles across Revolut, Notion, Cosmos, Cursor, Vercel, Duolingo, Duolingo ABC, Genie, and 7shifts. This pass closes the most important behavior gaps before creative territories: Apple first-party patterns, Things 3, Headspace, Flighty, Airbnb, Stripe, and the limited current evidence for Anything.

The question is not what their surfaces look like. It is which behaviors make complex work feel clear, responsive, recoverable, and trustworthy, and which of those behaviors fit nursery operations.

## Evidence Method And Boundary

- Inspected current Mobbin flow previews for Headspace, Things 3, Flighty, Airbnb, Stripe, and Apple Reminders.
- Inspected one exact current Anything screen; exact multi-step Anything flow results remain unavailable.
- Cross-checked with current official Apple HIG, Things, Flighty, Stripe, Airbnb, and Anything sources.
- Flow screenshots establish visible hierarchy, sequence, labels, and state changes.
- Static captures do not prove timing curves, live frame rate, screen-reader behavior, haptic quality, network recovery, or implementation performance.
- Official product copy establishes intended capability, not independent proof of task success.

## Apple: Feedback Has A Consequence Budget

**Official evidence:** [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback), [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo), and [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)

Apple's current guidance makes four relevant distinctions:

1. Motion should convey status, feedback, instruction, or continuity and remain optional.
2. Status feedback belongs near the object it describes when interruption is unnecessary.
3. Alerts are reserved for critical, actionable, or unexpectedly irreversible consequence.
4. Undo names and reveals the outcome so users do not repeat it blindly.

This is the useful meaning of an Apple-grade experience for Kiddz. It is not glass, oversized radii, translucent toolbars, or a copied platform skin.

### Kiddz transfer

- A room changing from `UNKNOWN` to `SAFE` updates in place; it does not need a modal celebration.
- A ratio breach, irreversible record removal, or destructive scope change can interrupt because the consequence warrants it.
- Attendance correction uses a named action such as `Undo arrival for Maya` and visibly restores the source row and ratio state.
- Motion, haptic, icon, text, and color may reinforce one result, but no essential meaning depends on motion or haptics.
- Routine success remains quiet. Significant confirmation such as attendance submission, payment allocation, or inspection generation receives stronger feedback.

### Reject

- Copying current Apple materials without a Kiddz product reason.
- Alerting after every routine save.
- Spring motion on every control.
- An undo toast whose affected record is no longer visible and whose result is unclear.

## Apple Reminders: Functional Color And Progressive Scheduling

**Evidence:** [Adding a reminder](https://mobbin.com/flows/9ea3f67c-0921-4556-8e2a-3356326e8b43)

### What is visible

- The home uses colored summary blocks for functional collections such as Today, Scheduled, All, Flagged, and Completed.
- The creation sheet begins with title and notes, then exposes date, time, urgency, repeat, end date, list, and details in a readable sequence.
- Date and time controls activate through explicit toggles; inactive complexity does not occupy equal attention.
- The final reminder returns to its source list with date, recurrence, tags, flag, and related automations visible on the row.

### Why it works

Color owns a stable information category rather than decorating arbitrary cards. Progressive controls keep the first action light while preserving power. Completion changes the source object, not only a transient message.

### Kiddz transfer

- If Today uses colored state modules, each color must own a stable operational meaning.
- Conditional medical, recurrence, deadline, or follow-up fields appear only when activated or triggered.
- Creating a work item or record returns to the originating room, child, or queue with the new state visible.

### Reject

- A dashboard of equal rounded color blocks for every module.
- Using color category and severity interchangeably.
- Platform-specific form styling copied into desktop web.

## Things 3: Power Tucked Beside The Object

**Official evidence:** [Things features](https://culturedcode.com/things/features/), [Scheduling to-dos](https://culturedcode.com/things/support/articles/2803579/), and [cross-device availability](https://culturedcode.com/things/support/articles/2803552/)

**Flow evidence:** [Creating a project](https://mobbin.com/flows/1999adcb-b259-4ae5-a6f2-2ea992810fbb), [editing a to-do list](https://mobbin.com/flows/759e30bf-a470-4c6b-9a36-415ccd28476d), and [deleting a project](https://mobbin.com/flows/a24a9a93-7718-4da2-a253-541de7ac0cde)

### What is visible

- Navigation is organized by when work becomes actionable: Today, Upcoming, Anytime, Someday, and Logbook.
- A project opens as a clean working object with details added progressively.
- Date, deadline, tags, repeat, move, duplicate, delete, and share remain adjacent in a compact action menu.
- Editing can expand one task over its list while preserving surrounding context.
- Completed or deleted projects change the source-list count and placement.

Cultured Code describes the same design intent: content becomes more structured, concepts become clearer, and optional details stay tucked away until needed.

### Kiddz transfer

- Organize work by operational readiness and due state, not only department.
- Expand one room, child, or work item in place when comparison context matters.
- Keep advanced attributes adjacent and dormant.
- Move verified work into history without losing its audit trail.
- Let drafts and work resume across the devices where the real task can continue.

### Reject

- Treating collaborative legal work like a private personal to-do list.
- Hiding owner, source, severity, or audit state for visual simplicity.
- One universal blue accent with no Kiddz identity or operational semantics.

## Headspace: Emotion Is Attached To A Moment

**Evidence:** [Short completion flow](https://mobbin.com/flows/7763b37d-c5e6-4394-9471-f8f1823c9fc7) and [session, reflection, and return](https://mobbin.com/flows/a7d6a68b-d9af-4e4f-8871-c4fa5e2d6922)

### What is visible

- Home presents a short sequenced path with completed, current, and upcoming steps.
- Content cards use illustration and color tied to the specific topic, not generic decoration.
- The active session becomes an immersive, focused mode with almost all navigation removed.
- Completion first asks for a brief reflection, then shows a simple result and one `Finish` action.
- Returning home changes the exact source step from current to completed.

### Why it works

The expressive moment is earned by a focused emotional task. The path geometry persists before and after the session, so color and illustration reinforce progress instead of replacing it.

### Kiddz transfer

- Use expressive art and color in onboarding, guidance, learning, parent education, and meaningful low-risk completion.
- A focused incident, attendance review, or setup flow can temporarily reduce navigation, but still expose safe exit and draft behavior.
- Completion returns to the source queue or room and visibly changes its state.
- Optional reflection may fit staff wellbeing or training, not routine compliance work.

### Reject

- Meditation-card composition as the manager dashboard.
- Illustration in active safety, medical, ratio, or finance evidence.
- Adding an emotional reflection step after routine operational actions.
- Treating every work sequence as a wellness journey.

## Flighty: Live State Can Be Visually Rich When It Is Real

**Official evidence:** [Flighty product](https://flighty.com/) and [Live Activities and widgets](https://flighty.com/help/live-activities-widgets)

**Flow evidence:** [Flight detail](https://mobbin.com/flows/80d817cd-6544-4771-8d1e-88afee59ff08), [en-route detail](https://mobbin.com/flows/65069967-d37e-4f05-9532-da40f10a5008), and [My Flights](https://mobbin.com/flows/822e5e87-5e54-4117-b556-362464cac7e1)

### What is visible

- A real map and moving route are the product state, not a background illustration.
- A bottom sheet keeps the highest-value timing and status over the live context.
- Route detail leads with current phase, arrival countdown, origin/destination times, and changes.
- Updated times preserve previous values through strikethrough and show early/late deltas.
- Secondary panels explain arrival forecast, sample size, inbound aircraft, update history, and data issues.
- The user can report a data problem from the detail context.

### Why it works

The dramatic visual is justified because spatial movement is the object being tracked. Confidence comes from current status, changed values, explanation, and update history rather than animation alone.

### Kiddz transfer

- A room operating plane can be visually distinctive when every mark represents real attendance, staffing, timing, or ratio state.
- Preserve old and new values when a consequential time or assignment changes.
- Forecasts show source, assumptions, sample/confidence, and the next update.
- Give users a route to report or correct suspect operational data.
- Use compact live projections for notifications, widgets, or mobile summaries only when the underlying state is trustworthy.

### Reject

- An immersive map or diagram where a table answers the nursery question faster.
- Decorative motion standing in for freshness.
- Forecast confidence hidden behind a colored status.
- Promotional upsells competing with urgent operational state.

## Airbnb: Review The Commitment, Then Name The Pending State

**Official evidence:** [Booking basics](https://www.airbnb.com/help/article/380)

**Flow evidence:** [Booking a stay](https://mobbin.com/flows/d871944b-0d2f-4c69-a4cb-1302e47d0163), [booking a home](https://mobbin.com/flows/5b91784c-84a8-41e5-9f29-138275095d5f), and [reservation detail](https://mobbin.com/flows/d958f447-0c09-4e15-90ea-d58bd989216f)

### What is visible

- Search context keeps destination, dates, and guests together.
- Price can be switched to total-price display before selection.
- Booking review separates price details, due-now amount, payment method, cancellation policy, ground rules, profile requirements, and final commitment.
- The final button names the actual action, `Request to book`, rather than implying a confirmed reservation.
- The result states `pending`, explains what must happen next and by when, and keeps the reservation object available in Trips.
- Reservation detail later groups directions, rules, communication, and related context around the committed object.

### Kiddz transfer

- Keep branch, room, child, date, and scope together through a high-risk flow.
- Show total consequence before payment, broadcast, attendance confirmation, rota publication, or evidence sharing.
- Name the actual transition: `Submit for review`, `Send to parent`, or `Confirm attendance`, not generic `Done`.
- Pending acknowledgment or approval stays pending and explains the next actor and deadline.
- After commitment, build a durable object workspace rather than a success dead end.

### Reject

- Marketplace imagery and discovery patterns in operational tools.
- Long policy walls without progressive summary and source links.
- Hiding required identity or permission steps until the final action.

## Stripe: One Transaction, One Timeline, Reversible Where Reality Allows

**Official evidence:** [Refund and cancel payments](https://docs.stripe.com/refunds) and [Dashboard basics](https://docs.stripe.com/dashboard/basics)

**Flow evidence:** [Refunding a payment](https://mobbin.com/flows/ba467959-813e-475d-baa8-86879366dd96), [canceling a refund](https://mobbin.com/flows/3dc3394c-9d60-464e-940a-b33f6ddead1b), and [transaction detail](https://mobbin.com/flows/a2116660-cf1a-4a5a-8104-cd09d342dc37)

### What is visible

- The transaction detail leads with amount, status, customer, and an event timeline.
- Breakdown, payment method, risk, source, receipt, connections, metadata, and raw events deepen the same object.
- Refund stays over the transaction and states time-to-customer, fee consequence, amount, reason, and notes.
- The action button repeats the exact refund amount.
- After submission, the page becomes `Partial refund`, updates the timeline and net amount, and exposes cancellation only while the real state allows it.
- Failed attempts remain in the timeline rather than disappearing.

Stripe's official documentation confirms that refund status can be pending, failed, canceled, or completed; cancellation is available only for eligible intermediate states, and reference numbers can support later tracing.

### Kiddz transfer

- Build finance around one family ledger object and event timeline.
- Keep amount, allocation, reason, delivery, and resulting balance visible before commitment.
- Corrections use reversal, reallocation, or cancellation when the domain state permits, not silent edit/delete.
- Preserve failed attempts and references for staff and parent support.
- Make button labels carry consequence: `Allocate EUR 240`, `Reverse payment`, or `Send receipt`.

### Reject

- Developer-level event payloads in the default manager view.
- Copying financial density into attendance or care flows.
- Presenting an action as reversible when the external system has already committed it.

## Anything: Cross-Device Promise, Partial Interaction Evidence

**Official evidence:** [Anything Mobile](https://www.anything.com/app), [Anything web](https://www.createanything.com/), and [Anything on the App Store](https://apps.apple.com/us/app/anything-ai-app-builder/id6751247034)

**Screen evidence:** [Conversational build result](https://mobbin.com/screens/079294f2-fc45-4acd-b1b6-7cca02e224e1)

### What is confirmed

- Official product descriptions emphasize voice input, building on mobile, syncing across devices, and finishing later in the browser.
- The exact inspected screen shows a user request, generic `Working...` status, a generated feature recap, a persistent composer, input controls, and a stop control.
- Current App Store copy states that source-code editing, export, and App Store submission have web-only boundaries.

### Evidence limit

One result screen and marketing copy do not prove creation stages, failure recovery, history, preview continuity, code diff, accessibility, or reliable mobile-to-web handoff. Unrelated Mimo, Manus, and Vibecode search results were excluded from Anything findings.

### Kiddz transfer

- A draft started on mobile or tablet should resume on desktop at the same object and revision.
- Surface capability boundaries before users invest work: `Continue full reconciliation on desktop` is better than revealing the limit at the end.
- Voice may accelerate notes or search, but structured high-risk transitions remain explicit and reviewable.

### Reject

- Generic `Working...` for long-running or high-stakes work.
- A feature recap as proof that the underlying result is correct.
- Chat replacing source records, state machines, permissions, or audit history.
- Claiming Anything's interaction quality beyond the evidence available.

## Cross-Reference Synthesis

### 1. Completion modifies the source object

Headspace marks the exact path step, Things changes the source list, Apple Reminders inserts the enriched reminder, Airbnb creates a pending trip, and Stripe updates transaction state and timeline. Kiddz completion must produce the same visible source change.

### 2. Pending is not success

Airbnb distinguishes requested from confirmed. Stripe distinguishes initiated, pending, failed, canceled, reversal, and completed. Kiddz must preserve submitted, delivered, reviewed, acknowledged, and closed as separate states.

### 3. Rich visuals require rich truth

Flighty's globe is valid because it represents live flight movement. Headspace art is valid because it represents emotional content. Kiddz visualizations and illustrations need an equally specific job; empty visual spectacle is rejected.

### 4. Advanced fields stay close, not always open

Things, Apple Reminders, Airbnb, and Stripe preserve depth next to the object and reveal it at the right stage. Kiddz can retain every legacy field without presenting every field at once.

### 5. Consequence determines interruption

Apple's feedback guidance, Airbnb's commitment review, and Stripe's refund confirmation align: routine state can update in place; irreversible or externally consequential work deserves focused review.

### 6. Cross-device boundaries must be honest

Things advertises synced device-specific applications. Flighty projects live state into widgets and Live Activities. Anything distinguishes mobile creation from web-only code/export/publish. Kiddz should let work travel while explaining which surface can safely finish it.

### 7. Recovery names the real outcome

Apple undo guidance, Flighty's changed-value history, and Stripe's eligible cancellation make recovery specific. Kiddz does not use a generic `Undo` where the domain requires a correction, reversal, reassignment, or reopened review.

## Journey Transfer Matrix

| Kiddz journey | Reference behavior | Required proof in territory/prototype |
| --- | --- | --- |
| J01 Open safely | Flighty live state + Apple integrated feedback | Room state, source freshness, change history, next forecast |
| J02 Attendance | Apple Reminders explicit controls + Airbnb review/pending language | Unknown-first roster, exception review, server-confirmed source update |
| J03 Room care | Things progressive depth + Headspace focused mode | Batch context, child exceptions, draft recovery, quiet completion |
| J04 Health/safety | Apple consequence budget + Stripe timeline | Focused evidence, explicit transition, owned follow-up, correction history |
| J05 Staffing/ratios | Flighty live/change explanation + Things time-oriented work | Current/forecast cover, source values, reassignment consequence |
| J06 Finance | Stripe object/timeline + Airbnb total review | One ledger, allocation consequence, pending/failed/reversed states |
| J07 Inspection | Airbnb requirements preflight + Stripe durable events | Missing evidence, stages, manifest, ready/pending/failed/share state |

## Motion Translation For The Territories

The creative territories must demonstrate motion in four different consequence levels:

| Level | Example | Expected behavior |
| --- | --- | --- |
| Immediate input | Toggle state, select child, open row | Near-instant feedback; no flourish |
| Spatial continuity | Open inspect panel, expand work item, move room assignment | Source-to-detail continuity; restrained spring |
| Significant completion | Confirm attendance, submit care batch, allocate payment | Source state visibly changes; concise feedback; correction adjacent |
| Brand milestone | Onboarding completion, first safe opening, training milestone | Most expressive Kiddz motion; settles quickly; reduced-motion equivalent |

Unsafe ratio, incident, access denial, failed payment, and destructive confirmation use motion only to clarify state and focus. They do not celebrate.

## Territory Transfer Queue

Every creative territory must visibly prove:

1. Today room state with Flighty-level explainability but no decorative data scene.
2. A Things-like expansion from compact work item to full context without losing the queue.
3. Headspace-level emotional ownership in a low-risk guidance or completion moment.
4. Airbnb-level consequence review and honest pending state.
5. Stripe-level finance timeline and correction state.
6. Apple-level integrated feedback, explicit recovery, reduced-motion equivalence, and severity-matched interruption.
7. Anything-like cross-device resume with capability boundaries disclosed before handoff.

## Anti-Copy Rules

- Do not copy Apple materials, navigation chrome, or device-specific controls into desktop web.
- Do not turn Today into Headspace's content-card feed.
- Do not use Things' minimalism to hide collaboration, severity, or audit state.
- Do not use Flighty's spectacle without a real live data object.
- Do not use Airbnb's marketplace cards for nursery records.
- Do not expose Stripe's technical event density by default.
- Do not use Anything's conversational metaphor for structured operations.
- Do not claim live motion, accessibility, performance, or recovery quality from static Mobbin captures.

## Remaining Evidence Debt

1. Real-device motion timing, haptics, large text, VoiceOver, and reduced motion in Apple, Things, Headspace, and Flighty.
2. Authenticated failure and interruption behavior in the direct nursery competitors.
3. Exact multi-step Anything mobile-to-web resume and failed-build flows.
4. Current Things Mac/iPad relationship for dense keyboard work.
5. Airbnb and Stripe localization, long-text, and accessibility behavior under real assistive settings.

This debt remains recorded, but the pattern evidence is sufficient to begin complete creative territories. Territory decisions stay reversible until realistic browser prototypes pass the Kiddz acceptance gates.
