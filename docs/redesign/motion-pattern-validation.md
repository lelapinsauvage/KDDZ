# Purposeful Motion Pattern Validation

**Date:** 2026-07-10  
**Route:** `/design-lab/motion`  
**Scope:** Territory-neutral interaction contracts only  
**Production UI changed:** No

## Question

Can Kiddz use spring motion and shared continuity to make operational cause, consequence, and control easier to understand without turning motion into decoration, blocking interaction, or becoming the only proof of state?

## Sources And Implementation Choice

- [Motion for React](https://motion.dev/docs/react) is the lab runtime. The repository now pins `motion` `12.42.2` and imports from `motion/react`.
- [Motion layout animation](https://motion.dev/docs/react-layout-animations) supports transform-based layout animation and `layoutId` continuity between related source elements.
- [MotionConfig](https://motion.dev/docs/react-motion-config) applies a user or forced reduced-motion policy across the lab.
- [Motion accessibility](https://motion.dev/docs/react-accessibility) informed the reduced equivalent: geometry motion is removed while opacity and durable result evidence remain.
- [AnimatePresence](https://motion.dev/docs/react-animate-presence) keeps exit, replacement, and interrupted panel states controlled during React removal.

The dependency is justified only for validated continuity, consequence, and contextual-panel transitions. The lab does not introduce scroll spectacle, decorative parallax, blur, layout-property animation, or a general animation layer.

## Implemented Contracts

### 1. Queue To Source

- A ratio-coverage task opens its authoritative Meadow room source.
- One shared `layoutId` moves the source cue from the owned-work row to the source header.
- Branch, room, time, projected ratio, evidence, reconciliation time, and owner remain visible as durable text.
- The destination close action receives focus; Escape closes the source and restores focus to the exact queue trigger.
- A browser-discovered grid defect caused the work-item text to shift when the shared cue left its slot. A stable placeholder now preserves the item anatomy throughout the transition.
- Measured fresh-transition settle: approximately 645ms, with the panel settled first and the small shared source cue completing last.

### 2. Server-Confirmed Completion

- `Confirm assignment` enters a named pending state while the unresolved queue count remains `3`.
- Only simulated server confirmation changes the room status from `At risk` to `Covered`, the projection from `1:6` to `1:4`, and the queue count from `3` to `2`.
- The final state retains source revision, resolver, rota effect, ratio effect, and queue-history effect.
- The completion remains fully understandable after every animation ends and when motion is disabled.

### 3. Interruptible Context Panel

- Three distinct source records can open in a contextual panel.
- Opening coverage and switching to safety review after 60ms retargets the content without blocking the second action.
- Escape restores focus to the most recently selected source trigger.
- On phone, the panel becomes a bottom sheet with a click-dismiss scrim and one semantic close button. The visual scrim is `aria-hidden` so assistive technology does not receive duplicate `Close context panel` controls.

## Motion Contract

| Property | Queue / completion | Context panel |
| --- | --- | --- |
| Purpose | Source continuity or confirmed consequence | Reversible contextual control |
| Animated values | Transform and opacity | Transform and opacity |
| Spring | stiffness 430, damping 38, mass 0.68 | stiffness 470, damping 42, mass 0.72 |
| Reduced equivalent | Instant geometry, preserved opacity and text evidence | Instant geometry, preserved opacity and focus behavior |
| Forbidden | Fake progress, layout-property animation, blur, autoplay, decorative motion | Focus trapping without modality, blocked input, scroll-linked movement |

The short saving indicator animates opacity only and becomes static under `prefers-reduced-motion`.

## Browser Evidence

### Functional

| Check | Result |
| --- | --- |
| Handoff trigger uniqueness | One accessible ratio-coverage trigger |
| Handoff destination | Meadow coverage source opened with source scope intact |
| Handoff focus | Close action focused; Escape returned to the queue trigger |
| Completion pending | `Saving to Riverside`, disabled repeat action, queue count still `3` |
| Completion confirmed | `Coverage is handled`, count `2`, projection `1:4`, three durable history effects |
| Panel interruption | Coverage to accident retarget succeeded after 60ms |
| Panel recovery | Escape returned focus to the accident trigger |
| Reduced motion | At 55ms, panel and shared cue transforms were both `none`; source heading and opacity feedback remained |

### Responsive

| Viewport | Overflow | Visible targets below 44px | Result |
| --- | ---: | ---: | --- |
| 1280 x 720 | 0px | 0 | Desktop lab and interactions passed |
| 768 x 900 | 0px | 0 | Stacked stage passed |
| 390 x 844 | 0px | 0 | Reflow, wrapped header, and mobile bottom sheet passed |

The mobile panel measured 384px wide in a 390px viewport and 640px high with the scrim present. The lab header was changed from ellipsis to a wrapped title after browser review.

### Production Mode

- `pnpm build` passed and emitted `/design-lab/motion` as a static route.
- Production preview at port 3003 reproduced the completion and phone-panel outcomes.
- Production browser logs: empty.
- Captures:
  - `docs/redesign/motion/queue-to-source-1440.png`
  - `docs/redesign/motion/confirmed-completion-1440.png`
  - `docs/redesign/motion/context-panel-390.png`

The build continued to emit the known legacy dynamic-server diagnostics for unrelated authenticated routes and the existing `@page` optimizer warning. No new warning originated in the motion lab.

## Static Verification

- `pnpm exec eslint src/app/design-lab/motion --max-warnings=0`: passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Performance-pattern scan found no `transition: all`, blur, or backdrop filter in the lab.
- `pnpm build`: passed.

## Decision

Accept these three behavior patterns as territory-neutral design-system contracts:

1. Shared continuity is allowed only when origin and destination are the same source object.
2. Completion motion begins after authoritative confirmation and must update the source and linked work visibly.
3. Panels remain interruptible, Escape-recoverable, focus-restoring, and equivalent under reduced motion.

Do not yet apply final visual tokens or migrate production screens. Creative-territory selection remains the visual constitution gate.

## Remaining Evidence Debt

- Real operator testing of whether continuity improves speed and confidence.
- Automated accessibility audit, 200% zoom, 320px reflow, screen-reader pass, and Windows high-contrast mode.
- Real-device frame timing and INP measurement on representative nursery hardware.
- Production server state machines instead of the lab's simulated confirmation.
- Final tokens, themes, and component APIs after territory selection.
