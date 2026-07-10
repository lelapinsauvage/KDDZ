# Kiddz Online Territory Accessibility Validation

**Date:** 2026-07-10
**Status:** Prototype accessibility hardening passed; production conformance remains open
**Scope:** `/design-lab/territories` only

## Purpose

This record validates the three creative-territory prototypes before the direction-selection gate. It separates measured browser evidence, source-token evidence, and known limits so prototype quality is not mistaken for full WCAG conformance.

The work does not select a territory, migrate production UI, alter permissions, change database behavior, modify native contracts, or remove a legacy route.

## Surfaces Tested

Every territory was tested against the same four views:

- Daylight: Today, Children, Daily care, and Safety review.
- Signal: Today, Children, Daily care, and Safety review.
- Carebook: Today, Children, Daily care, and Safety review.

The shared views retain identical information and behavior across territories, allowing visual and semantic differences to be compared without hiding missing capability.

## Findings and Corrections

### Contrast

The first Today-only pass detected no failures in Daylight or Signal and 13 visible-text failures in Carebook. Carebook's muted sidebar text measured 4.48:1 and its accent labels measured 3.75:1. An expanded four-view pass then exposed ten shared low-contrast status labels in every Children view: safe text measured 4.08:1 and forecast text measured 3.62:1.

Corrections:

- Carebook muted text changed from `#746d65` to `#706961`.
- Carebook accent changed from `#df4f2b` to `#c23f24`.
- Safe and forecast text tokens were darkened in each territory while their light status surfaces were retained.
- A separate `--accent-text` token now distinguishes display/action color from text on a tinted surface.
- Daylight's readiness eyebrow now uses opaque ink on the orange brand field.

Post-correction runtime result at 1440 x 900:

- 12 of 12 territory/view combinations exposed zero detected visible-text contrast failures.
- `report-redesign-territory-accessibility.ts` passes 28 required source-token pairs at 4.5:1 or higher.
- The lowest accepted source pair is Daylight white-on-accent at 4.50:1. Final palette work should add margin rather than treating the threshold as a target.

### Target size

The first expanded desktop pass exposed 16px native checkboxes, 30px row actions and pagination, and 22px text actions. The first expanded mobile pass exposed inherited 32-38px search, action, review, and pagination controls.

Corrections:

- Checkboxes use a compact 16px visual mark inside a real 32px desktop or 44px mobile hit area.
- Desktop row actions, pagination, and compact text actions meet a 32px dense-pointer floor.
- Mobile search, filters, bulk actions, pagination, primary, secondary, text, review, and disabled controls meet the 44px Kiddz touch contract.
- Daily-care checkboxes now have explicit child-specific accessible names.

Post-correction runtime result:

- 1440 x 900: zero visible controls below 32px across all 12 combinations.
- 390 x 844: zero controls below 44px across all 12 combinations.
- 320 x 568: zero controls below 44px across all 12 combinations.

### Mobile shell and reflow

The original fixed mobile navigation could cover the last visible room or action. The mobile workspace now has explicit topbar, scroll-region, and navigation rows. The main region owns vertical scroll and the navigation remains in flow.

Measured results:

- At 390 x 844 and 320 x 568, document height equals viewport height and the main region is the only long vertical scroll container.
- All 24 mobile territory/view combinations have no page-level or main-region horizontal overflow.
- Main and navigation rectangles do not overlap.
- Sticky Daily-care actions remain within the main region and clear the navigation in all three territories after browser-driven scrolling.
- A 720 x 450 reflow-equivalent pass produced no page-level horizontal overflow in the three Today compositions.

The 720 x 450 result approximates the available CSS viewport at 200% zoom on a 1440 x 900 display. It is not evidence of actual browser zoom behavior.

### Drawer keyboard behavior

The responsive sidebar is now a modal navigation drawer when open:

- focus moves to `Close navigation`;
- `Tab` and `Shift+Tab` wrap inside the drawer;
- the workspace is `inert` and `aria-hidden` while the drawer is open;
- the drawer exposes `role="dialog"`, `aria-modal="true"`, and the name `Main navigation`;
- `Escape` closes it and restores focus to `Open navigation`;
- the visual scrim is not a second focus stop.

This is a targeted keyboard contract check, not a screen-reader dialog announcement test.

### Reduced motion

The stylesheet retains the real `prefers-reduced-motion: reduce` media query. View/detail entrance animation is removed and remaining transitions collapse to `0.01ms`.

For deterministic browser verification, `?motion=reduce` applies the same prototype behavior through `data-reduced-motion="true"`. Measured Daylight output reported no view animation and `0.01ms` sidebar, row, and icon transition duration.

The query hook exists only to make the source contract reproducible. It does not replace testing with the operating system preference on real hardware.

### Structure and runtime health

- All 12 desktop and all 24 mobile/narrow combinations expose exactly one main H1.
- No visible unnamed buttons were detected.
- The complete axe-core steady-state, worst-case, and interactive-state evidence is recorded in `territory-semantic-validation.md`.
- No territory-specific warning or error was present in the Agent Browser dev log after the final pass.
- The source reporter confirms visible focus styling, desktop/mobile target rules, system reduced motion, and the deterministic reduced-motion hook.

## Reproducible Source Check

Run:

```bash
pnpm exec tsx src/scripts/report-redesign-territory-accessibility.ts
```

The reporter fails when a required contrast pair or source contract falls below the prototype gate. It also reports raw pixel font-size declarations. The paired type scale, long-label, RTL, and deterministic 200% evidence is recorded separately in `territory-localization-validation.md`.

## Decision Impact

The hardening pass does not change the provisional direction order:

1. Daylight remains the recommended foundation because it combines the strongest Kiddz ownership with the fastest readiness read.
2. Signal remains the reference for dense alignment, source, and timing grammar.
3. Carebook now passes the prototype minimum, but its serif/editorial hierarchy and warmer canvas retain more localization, large-text, and repeated-action risk.

Carebook's original accessibility score was not gate-valid because its visible contrast failures were found after scoring. The scorecard records that pre-fix failure instead of pretending the original score was evidence. The post-fix result keeps Carebook eligible for comparison but does not inflate its score.

## Evidence Boundary

Still open:

- actual browser zoom at 200% and 400%;
- VoiceOver, NVDA, and other assistive-technology task completion;
- Windows high-contrast and forced-colors behavior on real hardware; the source and deterministic prototype contracts pass;
- real OS reduced-motion testing and field motion comfort;
- real tablet/mobile safe areas, keyboards, touch, and native wrappers;
- production translation coverage, platform Arabic font rendering, mixed-script assistive-technology behavior, and actual browser zoom;
- color-vision simulation beyond contrast ratios;
- real-user task observation;
- field performance and animation frame timing.

Automated prototype semantics are now complete, with every axe incomplete result manually dispositioned in `territory-semantic-validation.md`. The remaining items stay selection, design-system, pilot, and final hardening gates. This document proves that the isolated prototypes now meet their defined pre-selection accessibility floor; it does not claim WCAG conformance for the product.
