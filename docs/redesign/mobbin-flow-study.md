# Kiddz Online Mobbin Flow Study

**Status:** Benchmark flow pass 1
**Last updated:** 2026-07-10
**Platforms inspected:** iOS and web
**Decision rule:** Borrow behavior and system logic; never copy surface styling without a Kiddz-specific reason

## Purpose

This study turns named references into concrete flow evidence. It focuses on how strong products move a user from intent to trustworthy completion, how they expose complex options, and how they preserve context. It does not treat a polished screenshot as proof of good UX.

Each flow is evaluated against Kiddz Online's critical jobs:

- opening and live readiness;
- attendance and room care;
- safety and health resolution;
- staffing and ratios;
- finance and reconciliation;
- compliance and inspection evidence.

## Evidence Method And Boundary

Mobbin returned flow metadata plus evenly spaced screen previews. Findings below describe only the visible previews and the ordered flow structure; they do not invent unshown transitions, motion curves, timing, accessibility behavior, or error states.

The named product or app must match the result before it is used as evidence. Searches for Anything, Brightwheel, and Famly returned unrelated products, so those results are explicitly excluded. Current direct-nursery capability evidence remains in `competitor-gap-analysis.md`; live or authenticated competitor flow inspection is still pending.

## Flow 01 - Revolut: Transaction Confidence

**Evidence:** [Sending money](https://mobbin.com/flows/c4a1fcdc-9763-40cb-8470-3ca850e88da2) and [Sending money to a bank account](https://mobbin.com/flows/bd6a93e9-def6-4315-b58e-b24d337e5d41)

### What is visible

- An existing recipient conversation keeps Request and Send next to the relationship context.
- The review screen names the trust risk before the irreversible action.
- Recipient, reference, amount received, fees, total, and arrival estimate appear in one scan before Send.
- Completion returns to the same recipient context and inserts the transaction into history.
- The longer bank flow first separates recipient types, then collects details, amount, funding source, reference, and review.
- The final detail screen exposes a multi-stage transfer lifecycle rather than treating submission as settlement.

### Why it works

The product separates intent, data entry, review, submission, and settlement without making the user reconstruct context. The same amount and recipient travel through every stage. The strongest moment is not visual decoration; it is the review screen's accounting of consequence.

### Kiddz transfer

- A payment confirmation shows child/family, charge allocation, previous balance, payment, new balance, method, receipt state, and parent-delivery state.
- Attendance confirmation shows room, roster revision, explicit status counts, exceptions, and resulting ratio state.
- Medical submission shows child, incident type, evidence, owner, notification obligations, and next state.
- Submitted is not confused with settled, delivered, acknowledged, reviewed, or closed.

### Reject

- Dark fintech styling, promotional money modules, consumer spending metaphors, and hiding audit evidence behind friendly summaries.

## Flow 02 - Notion: Progressive Power In Place

**Evidence:** [Creating a database table](https://mobbin.com/flows/4892e6e0-7b24-40b0-bd6e-f89160746b62), [Creating a database](https://mobbin.com/flows/552346f6-4d15-448e-be12-2a2cfdab394b), and [Advanced database filtering](https://mobbin.com/flows/3250dd04-9241-4db0-843a-51e4a8a5bf34)

### What is visible

- Creation happens inside the current page rather than launching a visually separate application.
- Column configuration opens from the column itself, preserving spatial context.
- Common filter actions remain compact; advanced groups appear only after explicit selection.
- Applied rules become persistent chips above the data, so the result never loses its explanation.
- Choosing an existing data source uses a right-side panel while the new view remains visible.
- The canvas is mostly white; color belongs to tags, active controls, and the primary New action.

### Why it works

Power is adjacent to the object it changes. Menus and side panels preserve the table as the user's reference frame. Progressive disclosure reduces the initial control count without removing depth.

### Kiddz transfer

- Filters open from the list toolbar or active column and persist as readable, removable chips.
- Saved views describe operational questions such as "Attendance unknown," "Medical review due," or "Balance overdue," not implementation fields.
- Child, staff, payment, and incident records open in an inspect panel when comparison context should remain visible.
- Advanced rule builders remain available for administrators without crowding the manager's daily view.

### Reject

- Blank-canvas assumptions, low-contrast controls for high-risk state, and allowing flexible user structure to weaken regulated data contracts.

## Flow 03 - Cosmos: Immediate Capture And Return

**Evidence:** [Saving an element to a library](https://mobbin.com/flows/5d8387b0-b41d-4229-b4fa-f5d68b0bb6a0) and [Library](https://mobbin.com/flows/121adc9b-7f76-4a60-b421-f88db0f33080)

### What is visible

- Save opens a bottom sheet over the item instead of navigating away.
- The destination list distinguishes quick-save library, named collection, and new collection.
- Selection changes the bookmark state and produces a concise saved confirmation.
- Returning to Library keeps search, filtering, and Elements/Clusters mode close to the content.

### Why it works

The action is tiny, contextual, and reversible-looking. The user remains oriented because the source item stays visible behind the sheet and the result appears both locally and systemically.

### Kiddz transfer

- Low-risk personalization such as saving a view, pinning a child/room, or adding a dashboard module can use the same contextual sheet and immediate confirmation model.
- A manager's saved operational views should be one action away and remain visible in navigation or the home workspace.
- This interaction is appropriate for preference changes, not medical, attendance, staffing, or financial truth.

### Reject

- Image-led discovery layouts, unexplained icon navigation, and using ephemeral toast feedback as the only proof of a high-risk mutation.

## Flow 04 - Cursor: Inspectable Work Lifecycle

**Evidence:** [Chatting with an agent](https://mobbin.com/flows/de3904e0-f2db-4e6c-81db-e91d90483f80) and [Agent with reviewable changes](https://mobbin.com/flows/b4567594-0b04-4b3c-944d-3c1b53a0974e)

### What is visible

- A centered prompt creates the first task; task history then appears in a persistent left rail.
- Work items show named steps, elapsed time, model/worker context, and status.
- A completed task expands into the result rather than disappearing into a notification.
- Changed artifacts are summarized, then inspected in a dedicated review pane.
- The user can distinguish setup, active work, completion, review, and ready states.

### Why it works

The product turns background work into inspectable objects. History, current state, result, and source artifacts stay connected. The user can return later and understand what happened.

### Kiddz transfer

- Action-needed work becomes a persistent `WorkItem` with source, owner, deadline, progress, evidence, and resolution.
- Inspection generation shows stages and produced files, then opens a manifest/review pane.
- Ratio resolution records the trigger, candidate cover, assignment, recalculation, and final safety state.
- Medical review shows what changed between revisions and who marked it ready or closed.

### Reject

- AI transcript as the primary interface, developer vocabulary, dark-only density, and raw technical logs for nontechnical nursery users.

## Flow 05 - Vercel: Safe Defaults, Advanced Depth, Visible Deployment

**Evidence:** [Setting up a deployment](https://mobbin.com/flows/edfece19-b9e5-482a-b867-ec0e47ff61ad) and [Creating a project by import](https://mobbin.com/flows/0d992538-325c-42ff-ae7f-66d1ef3dbba8)

### What is visible

- The initial setup collects the few decisions required to proceed.
- Build settings and environment variables remain collapsed until needed.
- The primary Deploy action stays stable beneath configuration.
- Success becomes a new product state with next steps and a direct route into the deployed project.
- The destination dashboard separates overview, deployments, logs, analytics, observability, firewall, domains, and settings around one project context.

### Why it works

Defaults carry common cases, while advanced configuration remains discoverable in place. The flow has a clear handoff from creation to an ongoing entity with status and history.

### Kiddz transfer

- Nursery setup, export configuration, complex report criteria, and policy configuration begin with safe defaults and expand advanced fields only when relevant.
- Inspection-package generation becomes a staged job with progress, output, manifest, and next actions.
- Created records land in a persistent workspace rather than a dead-end success screen.

### Reject

- Developer-product terminology, monochrome austerity, and assuming empty technical dashboards are useful to ordinary managers.

## Flow 06 - Duolingo: Complete Feedback Geometry

**Evidence:** [Completing a lesson](https://mobbin.com/flows/c199f9a9-7a91-4795-8ba5-5a3c24847009) and [Completing a lesson with mistake recovery](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18)

### What is visible

- Progress remains fixed at the top of the activity.
- Correct and incorrect feedback occupies a stable bottom region with a single next action.
- Color, icon, copy, and control state communicate the result together.
- Previous mistakes return as named work rather than being silently forgotten.
- Completion eventually returns to the learning path with the changed node visible.
- The longer flow adds several reward, streak, quest, and promotion interstitials after the core task.

### Why it works

Every action receives an unmistakable result and next step. Completion changes the parent context. The flow demonstrates that feedback can feel physical without a modal for every answer.

### Kiddz transfer

- Routine care, attendance, acknowledgment, and checklist actions use stable inline feedback regions with one next action.
- Success changes the source row/card immediately and visibly.
- An error explains what remains wrong without erasing entered work.
- A corrected record returns to its queue with the item visibly resolved.

### Reject

- Streak pressure, reward currencies, celebration after every administrative action, emotional manipulation, and gamification of safety, debt, medical work, or legal compliance.

## Flow 07 - Duolingo ABC: One Instruction, One Physical Action

**Evidence:** [Completing an alphabet lesson](https://mobbin.com/flows/f7cb5d59-e2de-4d7d-b4b4-d512c8d327dd) and [Completing a story lesson](https://mobbin.com/flows/bd0fc0b4-4e4a-46c4-8d40-556990c7cf83)

### What is visible

- Each screen asks for one action with very large hit areas.
- Progress is short, persistent, and visually distinct from the content.
- Correctness becomes a simple, unmistakable state before returning to the path.
- The story flow separates content consumption, comprehension choice, result, and progress update.
- Illustration carries instruction while controls remain structurally consistent.

### Why it works

Decision load is constrained by composition, not by removing the journey. The user always knows what can be touched and what happened.

### Kiddz transfer

- Tablet floor actions can use one-observation-at-a-time focus when hands are occupied or interruption risk is high.
- Large attendance-state controls and batch review reduce mis-taps.
- Parent/mobile guidance can combine illustration and plain language for setup or unfamiliar tasks.

### Reject

- Child-facing visual scale, character density, sound/reward assumptions, and turning the adult manager workspace into a children's application.

## Flow 08 - Genie: Minimal Conversational Entry, Weak Operational State

**Evidence:** [Chat with image input](https://mobbin.com/flows/a1265bc6-e0eb-42ab-a7f5-ad3ae8bf1ca6) and [Chat with text input](https://mobbin.com/flows/f7d36e0a-101d-4a6c-bcfe-77a60bfef3a5)

### What is visible

- The first screen offers a few prompt suggestions above a persistent composer.
- Image attachment remains inside the composer before submission.
- A submitted request becomes a message, a minimal ellipsis represents waiting, and the result fills the same thread.
- Follow-up remains available at the bottom.

### Why it works

The entry point is immediately understandable and multimodal input does not create a separate workflow.

### Kiddz transfer

- Natural-language search, report questions, and low-risk assistant help can use a persistent query composer with visible source attachments.
- Voice can accelerate floor capture, but the recognized structured fields must be reviewed before save.

### Reject

- Ellipsis-only progress for long work, unstructured chat replacing forms, generic answers without source provenance, and a universal assistant occupying the product's primary hierarchy.

## Flow 09 - 7shifts: Schedule Preflight And Publish

**Evidence:** [Publishing a schedule](https://mobbin.com/flows/a188ab96-5d5c-4917-bb42-e27d16942411) and [Fixing schedule errors](https://mobbin.com/flows/389ba0ce-9288-4d83-bfbb-c7a8eb426111)

### What is visible

- The weekly grid keeps people, roles, days, shifts, time off, open shifts, hours, and labor context together.
- Conflict and overtime counts sit beside the Publish action as preflight state.
- A Fix warnings entry is persistent rather than appearing only after failure.
- Publishing preserves the schedule view and changes the action state in place.
- The automatic error-fixing modal lists processing stages but does not explain specific decisions in the previewed frames.

### Why it works

The user edits and validates the same spatial object. Problems are visible before publication and remain tied to the schedule.

### Kiddz transfer

- Rota and room coverage need a time grid where child demand, staff assignment, qualification, breaks, and ratio risk align.
- Conflict chips name the number and severity of unresolved ratio/qualification issues before publish.
- Suggested cover must explain each proposed move and its knock-on effect before application.

### Reject

- Opaque "perfect schedule" automation, auto-fixing safety constraints without review, and dense color bands without a documented semantic system.

## Explicit Evidence Gaps

### Anything

The Mobbin flow query returned Grok, Canva, and Replika. Deep screen search returned Mimo and Manus. None were treated as Anything evidence. Anything remains supported only by its official product material until an exact live or Mobbin match is available.

### Brightwheel And Famly

Exact childcare attendance and ratio searches returned Partiful, Luma, Kakao Pay, Deputy, 7shifts, ClassDojo, and Fresha. These products may be useful adjacent references, but they do not establish Brightwheel or Famly behavior. No category-flow claim was made from those results.

### Motion And Accessibility

Static flow previews cannot establish animation curves, durations, focus movement, screen-reader output, dynamic type behavior, haptics, sound, reduced-motion handling, or performance. Those require live-product or implemented-prototype inspection.

## Cross-Product Pattern Synthesis

### 1. Preserve the source context

Cosmos keeps the item behind the save sheet; Revolut returns the transaction to its recipient history; Notion configures the table beside the table; 7shifts validates the schedule over the schedule. Kiddz actions should usually resolve in the context that created them.

### 2. Show consequence before commitment

Revolut's review summary and 7shifts' conflict preflight make the irreversible edge explicit. Kiddz needs the same discipline for attendance, payment, medical submission, rota publication, deletion, and inspection generation.

### 3. Make status a durable object

Revolut settlement, Cursor task history, Vercel deployment, and Duolingo path state persist after the immediate success moment. Kiddz must distinguish saved, submitted, delivered, reviewed, acknowledged, resolved, and closed.

### 4. Keep advanced power adjacent but dormant

Notion's filter menus and Vercel's expandable settings make depth discoverable without presenting every option at once. Kiddz should avoid permanent walls of filters and form sections.

### 5. Use a stable feedback region

Duolingo changes the lower action area instead of stacking toasts and modals. Kiddz routine actions can confirm, explain errors, and offer correction in the same physical region.

### 6. Let color identify state, not decorate structure

Across the strongest white/light examples, neutral canvas dominates while blue, green, red, yellow, or tags identify active, success, risk, or category. Kiddz should create fewer, larger semantic color moments rather than many colored cards.

### 7. Progress must name what is happening

Cursor and Vercel provide meaningful stages and resulting artifacts. Genie's ellipsis and 7shifts' generic auto-fix copy demonstrate the lower-quality boundary. Long-running Kiddz work must expose stage, owner, cancel/retry behavior, and output.

## Journey Transfer Matrix

| Kiddz journey | Most useful references | Transfer |
| --- | --- | --- |
| J01 Open safely | Cursor, 7shifts, Vercel | Persistent readiness state, preflight conflicts, inspectable source facts |
| J02 Attendance | Duolingo ABC, Revolut, Cosmos | Large explicit states, review before confirm, immediate source-row update |
| J03 Room care | Duolingo ABC, Notion, Cosmos | One focused observation, batch context, progressive exceptions, return in place |
| J04 Health/safety | Revolut, Cursor, Duolingo | Consequence review, owned lifecycle, visible correction and resolution |
| J05 Staffing/ratios | 7shifts, Cursor, Vercel | Time grid, conflict preflight, explained proposals, publish/review state |
| J06 Finance | Revolut, Notion | Amount and allocation confidence, review, settlement history, contextual filters |
| J07 Inspection | Vercel, Cursor, 7shifts | Preflight, staged generation, manifest review, durable package status |

## Visual And Interaction Implications

1. The operational canvas remains approximately 90% white or near-white.
2. Structural containers use spacing, alignment, typography, and restrained borders before shadow or color.
3. Color appears on active state, resolved state, risk, selected category, primary action, and brand moments with a documented reason.
4. Sheets preserve context for contained decisions; inspect panels preserve list/table comparison; full pages are reserved for immersive or complex tasks.
5. Active filters and unresolved conflicts become readable chips because they explain the current result, not because chips are fashionable.
6. Completion changes the source object visibly and may use a brief spring or shared-element transition; a toast is secondary evidence.
7. High-risk review screens use plain totals, source references, and consequence language before visual celebration.
8. The design system needs distinct patterns for routine action, high-risk confirmation, long-running process, review, and historical audit.

## Anti-Copy Rules

- Do not use Revolut's dark finance aesthetic.
- Do not use Notion's neutrality to erase priority.
- Do not use Cosmos imagery where text/state must lead.
- Do not use Cursor's technical transcript as manager UX.
- Do not use Vercel's developer language or empty technical panels.
- Do not gamify medical, safeguarding, finance, ratio, or inspection work.
- Do not use Duolingo ABC scale and character density on the manager desktop.
- Do not make chat the product's organizing metaphor.
- Do not let automatic scheduling resolve safety rules opaquely.

## Next Evidence

1. Inspect Anything through its live web/iOS product or exact future Mobbin result.
2. Obtain authenticated or guided Brightwheel, Famly, Blossom, Connect Childcare, Tapestry, and Cheqdin flows.
3. Inspect live Apple, Things 3, Headspace, Flighty, Stripe, and Airbnb flows for motion, error recovery, and accessibility.
4. Convert this study into operational architecture, brand-expression, and cross-device synthesis maps.
5. Use realistic Kiddz content to test three creative territories against these behavior rules.
