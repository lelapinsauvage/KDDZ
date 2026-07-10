# Kiddz Online Creative Territory Evaluation

**Date:** 2026-07-10  
**Status:** Provisional recommendation; no production direction selected  
**Scenario:** Riverside at 09:18, using the shared operational state defined in `creative-territory-briefs.md`

## Purpose

This evaluation compares three implemented creative systems against identical product truth. Each prototype contains the same room state, attendance uncertainty, ratio forecast, accident review, care-report backlog, and unallocated payment. The comparison therefore tests hierarchy, expression, density, interaction, and cross-device behavior rather than different feature sets.

The prototypes are isolated under `/design-lab/territories`. They do not alter the production application, database behavior, native contracts, legacy aliases, authorization, or parity obligations.

## Evidence Set

### Implemented surfaces

- Territory selector with Daylight, Signal, and Carebook.
- A distinct Today composition for every territory.
- Shared Children record surface with search, saved views, selection, and desktop/mobile projections.
- Shared Daily care flow with factual fields unset by default, explicit child scope, validation, draft language, and confirmed submission.
- Shared Safety review flow with source evidence, append-only review history, parent acknowledgment state, and payment allocation consequence.
- Responsive sidebar/drawer, mobile bottom navigation, focus return, and 44px touch targets.

### Browser verification

- `1440 x 900`: all three Today views and all shared workflow surfaces render without horizontal overflow.
- `1280 x 800`: all three Today views render without horizontal overflow.
- `1024 x 768`: all three Today views render without horizontal overflow.
- `768 x 1024`: all three Today views render without horizontal overflow; responsive navigation opens, receives focus, closes, and returns focus to its trigger.
- `390 x 844` and `320 x 568`: all four views in all three territories render without horizontal overflow, expose no visible target smaller than 44px, and keep the mobile navigation outside the main scroll region.
- `720 x 450`: all three Today compositions reflow without page-level horizontal overflow as a 200%-zoom equivalent; this is not actual browser-zoom evidence.
- `1440 x 900`: all 12 territory/view combinations expose zero detected visible-text contrast failures, zero targets below the 32px dense-pointer floor, one main H1, and no unnamed buttons after hardening.
- Responsive drawer focus is contained, `Escape` returns focus to its trigger, and the background is inert while the drawer is open.
- The deterministic reduced-motion hook removes view/detail animation and collapses remaining transitions to `0.01ms` while the real media-query contract remains present.
- A fresh production-route tab produced no territory-specific console errors.
- Production build completed successfully and emitted static routes for the selector and all three territories.

### State-continuity verification

- Assigning Meadow cover updates both the room source state and its queue item.
- Searching for Alma returns only Alma Reyes.
- Daily care blocks empty submission, accepts explicit scope and factual values, then exposes a durable submitted state.
- Manager review appends a timestamped history event while keeping parent acknowledgment pending.
- Allocating EUR 240 updates payment history and the resulting balance.

### Captures

| Evidence | Artifact |
| --- | --- |
| Territory selector | `territories/territory-selector-desktop.png` |
| Daylight Today | `territories/daylight-today-desktop.png` |
| Signal Today | `territories/signal-today-desktop.png` |
| Carebook Today | `territories/carebook-today-desktop.png` |
| Daylight mobile | `territories/daylight-today-mobile.png` |
| Signal mobile | `territories/signal-today-mobile.png` |
| Carebook mobile | `territories/carebook-today-mobile.png` |
| Dense records | `territories/daylight-children-desktop.png` |
| Long form | `territories/daylight-daily-care-desktop.png` |
| High-risk review | `territories/daylight-safety-review-desktop.png` |

## Provisional Scorecard

Scores are out of 5. Weighted totals are out of 100. Operational clarity or accessibility below 4 rejects a territory.

| Criterion | Weight | Daylight | Signal | Carebook |
| --- | ---: | ---: | ---: | ---: |
| Operational clarity | 25% | 4.5 | 4.8 | 4.2 |
| Distinctive brand ownership | 20% | 4.7 | 3.8 | 4.7 |
| Emotional fit | 15% | 4.8 | 3.8 | 4.7 |
| Dense-surface survival | 15% | 4.1 | 4.8 | 4.3 |
| Motion coherence | 10% | 4.4 | 4.1 | 4.3 |
| Accessibility | 10% | 4.3 | 4.5 | 3.8 pre-fix |
| Cross-device continuity | 5% | 4.5 | 4.6 | 4.0 |
| **Weighted total** | **100%** | **90.0** | **86.8** | **87.0 pre-fix** |

Carebook's original score was not accessibility-gate-valid: post-score measurement found muted and accent text below 4.5:1. The prototype was corrected and now passes the same computed/runtime floor as Daylight and Signal, but the score is not retroactively inflated. Its serif/editorial system still carries greater large-text, localization, and dense-work risk.

The scorecard remains provisional because real-user observation, full automated semantic scanning, actual browser zoom, screen-reader verification, real OS reduced motion, color-vision simulation, and native-device validation remain open. Detailed evidence and limits are in `territory-accessibility-validation.md`.

## Territory Findings

### Daylight

**What succeeds**

- Communicates the branch state fastest through a single confident readiness field followed immediately by room evidence.
- Feels most connected to the approved Kiddz identity and the user's Headspace-like emotional reference without turning the manager surface into a children's product.
- Uses color as concentrated operational guidance rather than distributing equal rainbow emphasis.
- Keeps the mobile crop decisive: readiness first, live rooms second, handled work in bottom navigation.
- Has the clearest path to a unique, marketable Kiddz system while preserving serious medical and financial modes through reduced expression.

**What must improve**

- Dense records need Signal-level numeric alignment, truncation discipline, and timing geometry.
- The bright field cannot become a repeated dashboard-card gimmick; it should appear only when one state deserves immediate comprehension.
- The current active-navigation blue is too detached from the territory and should be resolved in the selected token system.
- Illustration and richer spring motion remain hypotheses until tested against repeat-work speed and reduced motion.

### Signal

**What succeeds**

- Produces the fastest room-to-room comparison and the strongest dense operational plane.
- Makes source, ratio, next change, and queue ownership explicit without requiring expansion.
- Scales naturally to audit, finance, medical, occupancy, and multi-branch surfaces.
- Maintains excellent cross-device information compression.

**What must improve**

- Reads too close to a polished generic operations product; the Kiddz identity is not yet strong enough.
- Emotional warmth and caregiver language are secondary to instrumentation.
- The live plane risks over-structuring workflows that are better expressed as human records or guided completion.

### Carebook

**What succeeds**

- Gives handovers, source evidence, acknowledgments, and care records the strongest human continuity.
- Feels editorial and ownable without decorative notebook imitation.
- Makes consequential work feel considered and trustworthy.
- Offers the best language model for opening briefs, parent-facing summaries, and durable records.

**What must improve**

- Editorial hierarchy consumes more vertical space and slows comparison under operational pressure.
- Warm paper tonality can overpower the user's requirement for a mostly white operational canvas.
- The serif layer increases localization, large-text, and dense-form risk.
- Mobile ordering is clear but less efficient for rapid repeated action than Daylight or Signal.

## Recommendation

Advance **Daylight** as the leading foundation for selection review.

This is not a recommendation to blend three visual systems. If selected, Daylight should remain the coherent expressive language. Two narrowly defined product patterns may be reinterpreted inside it:

1. Use Signal's alignment and source/timing grammar for ratio, attendance, finance, medical, and audit density.
2. Use Carebook's record-first language for handovers, incident history, parent acknowledgment, and narrative evidence.

Those imports must inherit Daylight tokens, typography, geometry, and motion. Signal's technical shell and Carebook's paper/serif treatment should not leak into the selected system.

## Gate Status

- Three territories implemented: **complete**.
- Shared realistic scenario and workflows: **complete**.
- Responsive browser evidence: **complete for prototype gate**.
- Provisional scoring and recommendation: **complete**.
- Computed contrast, source-token, 320/390 target/reflow, deterministic reduced-motion, and drawer keyboard evidence: **complete for prototype gate**.
- Full automated semantics, actual browser zoom, screen readers, real OS/device motion, color vision, and native-device evidence: **open**.
- User selection of the production direction: **open and irreversible**.
- Production UI migration: **not started by design**.

Until the selection gate closes, autonomous work may continue on territory-neutral IA, parity mapping, workflow specifications, accessibility test infrastructure, and design-system acceptance criteria. It must not commit production UI to a territory.
