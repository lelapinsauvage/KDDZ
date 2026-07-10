# Kiddz Online Territory Semantic Validation

**Date:** 2026-07-10
**Status:** Automated prototype semantic gate passed; manual and assistive-technology gates remain open
**Scope:** `/design-lab/territories` only

## Purpose

This record adds rendered automated semantics to the territory selection evidence. It tests the same realistic Today, Children, Daily care, and Safety review surfaces without selecting a direction or changing production UI, data, permissions, legacy routes, or native contracts.

Deque documents axe-core as an automated accessibility engine and states that it finds about 57% of WCAG issues on average. A clean run is therefore a defect-discovery result, not a conformance claim. Axe also returns `incomplete` results when it cannot decide automatically; every incomplete result below has an explicit manual disposition.

Primary method sources:

- [Deque axe-core repository](https://github.com/dequelabs/axe-core)
- [axe-core API and result guidance](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)

## Reproducible Harness

The territory lab accepts `?audit=axe`. The query dynamically loads pinned development dependency `axe-core@4.12.1`; normal territory URLs do not request the axe chunk.

The harness:

- runs WCAG 2.0 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA, and axe best-practice tags;
- records violations and incomplete results rather than suppressing uncertainty;
- waits 300ms for the 180ms prototype entrance transition to reach its final color and geometry;
- identifies every result by territory, view, stress mode, text mode, contrast mode, and actual viewport;
- publishes compact JSON to `#kiddz-territory-axe-audit` for Agent Browser inspection;
- exposes an audit-only, non-focusable trigger for rescanning same-view mutation states;
- remains absent from normal product routes and does not call a database or production mutation.

## Automated Matrix

### Default steady states

| Viewport | Territories x views | Violations | Incomplete |
| --- | ---: | ---: | ---: |
| 1440 x 900 | 12 | 0 | 0 |
| 390 x 844 | 12 | 0 | 0 |
| **Total** | **24** | **0** | **0** |

The matrix covers Today, Children, Daily care, and Safety review in Daylight, Signal, and Carebook.

### Worst-case content and platform state

All 12 territory/view combinations were scanned at 320 x 568 with Arabic RTL, deterministic 200% text, and deterministic forced colors enabled together.

- Violations: **0**.
- Eleven surfaces: **0 incomplete**.
- Signal Children: one `color-contrast` incomplete for the one-character visual filter count `2`; axe reported that the text was too short to classify.

Manual resolution for that count:

- the button has the localized accessible name `خيارات التصفية: 2`;
- computed text and border resolve to black;
- computed button and count surfaces resolve to white;
- the existing forced-color source contract maps the same control to Canvas, CanvasText, and system border roles.

This is a resolved automation limit, not a reported contrast violation.

### Interactive states

Eighteen additional scans cover, in every territory:

1. Open mobile navigation dialog.
2. Qualified-cover resolution.
3. Children bulk selection.
4. Daily-care validation error.
5. Submitted daily-care result.
6. Completed manager review and payment allocation.

All 18 states expose **zero violations**.

Manual-review results:

- Each open drawer returns one `bypass` incomplete because the valid background `main` and H1 are intentionally `inert` and `aria-hidden` while the modal dialog owns interaction. The closed page passes the bypass rule; the open dialog is named `Main navigation`, contains the only active navigation, traps focus, and restores focus on close.
- Daylight's resolved-cover scan returns four `color-contrast` incompletes on the sticky topbar after browser automation scrolls the action into view. Axe reports that the topbar text is partially obscured and cannot determine its background. The same topbar passes in the unscrolled steady-state scan, and its computed/source pairs pass the territory contrast contract.

Neither manual-review case is represented as an automated pass or ignored defect.

## Defects Found And Corrected

1. Four Signal room controls used `role="row"` on native buttons, which is not an allowed role for the element. They now remain native buttons and expose one explicit room-state name containing room, attendance, staffing, ratio, and next-change context.
2. Signal totals and Children saved views attached `aria-label` to generic `div` elements without a naming role. Both are now named groups.
3. The responsive drawer attached `role="dialog"` to an `aside`, which axe rejected. The container is now a generic element with the same conditional dialog semantics.
4. Signal's mobile drawer inherited a translucent desktop sidebar surface. Live content visibly bled through its wordmark, branch control, navigation, and Settings row. The responsive modal drawer now uses an opaque territory surface.
5. Early color scans sampled entrance opacity and produced contradictory contrast counts. The harness now serializes runs, waits for settled presentation, and includes viewport in its evidence signature.
6. The filter-count control now exposes one localized accessible name instead of mixing Arabic copy with an English audit suffix.

## Direction Impact

The result keeps all three territories eligible and does not change the provisional order:

1. Daylight remains the recommended foundation.
2. Signal remains the strongest dense operational grammar after its invalid row semantics were removed.
3. Carebook remains viable with the previously documented type, localization, and repeated-action cost.

The fixes belong to the shared prototype quality floor. They do not justify retroactively increasing a territory score.

## Built-Production Proof

The final source was compiled with `pnpm build`, served through `next start`, and checked again against build ID `-UIyl2Oyxs087q-FTsXCQ`:

- Daylight Today at 1440 x 900: 36 axe rules passed, zero violations, zero incomplete results.
- Signal Today at 1440 x 900: 36 axe rules passed, zero violations, zero incomplete results.
- Signal Children at 320 x 568 with Arabic RTL, 200% text, and forced colors: 38 rules passed, zero violations, and the same manually resolved one-character badge incomplete.
- Signal's production mobile drawer is opaque and visually separates all dialog content from the inert page beneath it.
- The production browser warning/error log is empty.

This is focused built-bundle proof, not a second claim of the complete development matrix.

## Evidence Boundary

Still open:

- actual browser zoom at 200% and 400%;
- VoiceOver, NVDA, TalkBack, and platform accessibility-tree task completion;
- real Windows forced colors, OS reduced motion, and color-vision simulation;
- real devices, native wrappers, safe areas, virtual keyboards, and platform Arabic rendering;
- production routes, authenticated permission variants, production translations, PDFs, email, export, parent, iOS, and Android surfaces;
- nursery operator testing, including practitioners who use keyboard, zoom, or assistive technology.

This artifact proves the isolated territories meet their automated pre-selection semantic gate. It does not claim product-wide WCAG conformance.
