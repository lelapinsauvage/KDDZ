# Kiddz Online State Pattern Validation

**Date:** 2026-07-10  
**Status:** Territory-neutral state fixtures browser-validated  
**Prototype:** `/design-lab/states`

## Question

Can the design-system contract express every required data, input, system, and result state without hiding page identity, inventing facts, losing user input, or treating a toast/animation as proof?

## Prototype Boundary

The state lab uses one synthetic Meadow lunch-care object to exercise behavior. It does not call server actions, persist drafts, alter production components, select a creative territory, or prove backend integrity.

It exists to make state requirements visible and testable before production screens compose them.

## Implemented Matrix

### Data

- Initial
- Loading
- Empty
- Partial

### Input

- Unknown
- Draft
- Validation

### System

- Permission denied
- Server failure
- Offline
- Conflict

### Result

- Waiting
- Success
- Corrected
- Closed

Every fixture keeps a stable page heading, source object, room scope, completion, and revision panel. The changing presentation is bounded to the behavior region.

## Interaction Evidence

### Validation

- Selecting Validation exposed 2 field-local errors.
- Both affected selects set `aria-invalid="true"` and connect to their error text.
- `Focus first error` moved focus to `Meal portion`.
- Existing field values remain controlled and are not cleared by validation.

### Success

- Selecting `Most eaten` and `Settled`, entering a note, and submitting changed the fixture to Success.
- Source status changed from `Not submitted` to `Submitted`.
- Completion changed from `0 of 2 submitted` to `2 of 2 submitted`.
- Result states `2 lunch care reports submitted`, `0 reports remaining`, `2 history events added`, and `1 handover updated`.

The fixture is local, but the UI contract correctly requires those values to come from the server response in production.

### Conflict and correction

- Conflict compares server revision 5 with local revision 4.
- Each version exposes values, actor/device context, and a distinct resolution action.
- Choosing the server revision changed the fixture to Corrected.
- Corrected exposes 3 timeline events and ends at `Correction accepted · revision 6`.
- Source revision becomes `6 · original preserved`.

### Responsive navigation

- At `390 x 844`, the page has no horizontal overflow and no visible interactive target below 44px.
- Closed off-canvas navigation is hidden and non-interactive.
- Opening moves focus to `Close state navigation`.
- Closing returns focus to `Open state navigation`.
- Mobile turns the source and behavior comparison into one ordered column.
- Reset becomes a labeled icon-only control while retaining the accessible name.

### State framing

- Selecting a lower sidebar fixture returns the main document to the new state's heading.
- The sidebar maintains its own scroll.
- Conflict production capture confirms `scrollY = 0` after selection.

## Automated Verification

- `pnpm exec eslint src/app/design-lab/states --max-warnings=0`: passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- `pnpm build`: passed and emitted `/design-lab/states` as a static route.
- Fresh production console: no state-route errors.

The repository build still logs known dynamic-route prerender messages from unrelated legacy pages using request-scoped APIs. The build exits successfully.

## Captures

| Evidence | Artifact |
| --- | --- |
| Initial desktop | `states/state-lab-initial-desktop.png` |
| Validation desktop | `states/state-lab-validation-desktop.png` |
| Conflict desktop | `states/state-lab-conflict-desktop.png` |
| Initial mobile | `states/state-lab-initial-mobile.png` |

## Findings

### Stable source context reduces false confidence

Keeping object, scope, completion, and revision visible makes loading, partial, failure, offline, and conflict states interpretable. A full-page spinner would erase the information needed to judge whether the operation is safe.

### Unknown must remain a first-class value

Unobserved meal or mood stays unset. `Unknown`, zero, none, absent, and not applicable are different facts and cannot share one visual/technical value.

### Draft is not completion

Draft exposes saved time, device, branch, and revision. The source completion remains `0 of 2 submitted` until a server result is accepted.

### Failure must preserve labor

Server failure repeats the entered meal, mood, and note, then keeps retry and copy/escalation adjacent. Error presentation cannot clear or hide the user's work.

### Offline must not imitate success

The offline fixture labels 2 local changes as queued and states that nothing is submitted. Offline support requires an approved sensitive-data, sync, and conflict contract; a service worker alone is insufficient.

### Waiting is a durable result

Submission and closure are different. Waiting preserves the submitted source while naming the manager dependency, elapsed time, and escalation rule.

### Correction is append-only

Conflict resolution and later factual correction preserve original revisions. The selected result never deletes history merely to simplify presentation.

## Pattern Acceptance

The following territory-neutral behaviors are accepted for future workflow fixtures:

- Stable page identity and source object through all states.
- Structural loading rather than generic takeover.
- Accurate empty scope/date.
- Explicit missing source and freshness for partial data.
- Unknown as distinct from zero/none.
- Versioned draft with scope and sync state.
- Inline validation with first-error focus.
- Safe denial with return path.
- Preserved input and idempotent retry on failure.
- Offline queue distinguished from server completion.
- Side-by-side revision conflict and reasoned resolution.
- Named owner/time/rule for waiting.
- Server-derived source update for success.
- Append-only correction history.
- Closed state that removes urgency but preserves evidence.

## Open Gate

Before shared production components are accepted:

- Connect fixtures to real server result schemas and state machines.
- Add automated axe/ARIA, contrast, keyboard, and screen-reader tests.
- Verify 320px reflow and 200% zoom.
- Emulate reduced motion and verify loading/status meaning.
- Validate offline storage and conflict policy with security/privacy review.
- Test long Arabic/RTL and English labels.
- Add dark/high-contrast token variants after creative selection.
- Add visual regression fixtures for every state.
- Test motion under CPU slowdown and real tablet/mobile hardware.

## Decision

Use this matrix as a mandatory screen and component acceptance fixture. It earns design-system progress for state behavior only; it does not earn final visual tokens, production components, backend state integrity, or product rollout.
