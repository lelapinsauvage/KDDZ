# Kiddz Online Territory Localization And Type Validation

**Date:** 2026-07-10
**Status:** Prototype stress contract passed; production localization remains open
**Scope:** `/design-lab/territories` only

## Purpose

This record tests whether Daylight, Signal, and Carebook remain operable when labels expand, the writing direction changes, typography reaches a deterministic 200% scale, and color is removed as the primary state signal.

It is selection evidence, not a claim that the production application is localized. The production locale, time-zone, money, schema, PDF, native, and translation obligations in `localization-runtime-audit.md` remain unchanged.

## Stress Fixtures

The territory lab accepts reversible query fixtures:

| Query | Purpose |
| --- | --- |
| `?stress=long` | Replaces 28 governed shell/workflow labels with deliberately expanded English copy. |
| `?stress=rtl` | Applies nested `lang="ar"`, `dir="rtl"`, Arabic governed labels, mixed Latin names, and mixed Arabic/Latin numbers. |
| `?text=200` | Swaps all 23 named type sizes to a deterministic 200% text-only scale. |
| `?contrast=forced` | Applies the same semantic system-color contract as the real forced-colors media rule for deterministic inspection. |

Queries can be combined. The most severe checked combination was `?stress=rtl&text=200&contrast=forced` at 320 x 568.

## Source Contract

Typography now composes from 23 named size tokens instead of 75 raw pixel declarations. Every size has a default `rem` value and a paired 200% value. This preserves the prototype's default appearance while making text scaling explicit and inspectable.

Directionality now uses logical inline properties throughout the territory stylesheet:

- `margin-inline-*`, `padding-inline-*`, `border-inline-*`, and `inset-inline-*` replace physical left/right rules;
- text alignment uses `start` and `end`;
- the responsive drawer opens from the inline-start edge;
- directional arrows mirror in RTL while expanded chevrons continue to point down;
- Arabic uses a system writing-script fallback and safer heading line height.

The reproducible reporter verifies this contract:

```bash
pnpm exec tsx src/scripts/report-redesign-territory-localization.ts
```

It fails for physical inline properties, raw pixel type declarations, incomplete type-scale pairs, missing long/RTL copy, non-Arabic RTL labels, missing nested language/direction, missing RTL drawer/icon behavior, or missing real/deterministic forced-color rules.

## Runtime Matrix

The final Agent Browser pass covers the same four views in every territory: Today, Children, Daily care, and Safety review.

| Matrix | Combinations | Result |
| --- | ---: | --- |
| 1440 x 900: long, RTL, and 200% text | 36 | Passed |
| 390 x 844: long, RTL, and 200% text | 36 | Passed |
| 320 x 568: long, RTL, and 200% text | 36 | Passed |
| 320 x 568: long + 200%, RTL + 200% + forced colors | 24 | Passed |
| 390 x 844: deterministic forced colors across all views | 12 | Passed |
| **Total measured combinations** | **144** | **Passed** |

Every combination was checked for:

- exactly one main H1;
- no interactive target below 32px on desktop or 44px on mobile;
- no critical heading, action, navigation, or essential-state clipping;
- no document or main-region horizontal overflow;
- no mobile main/navigation overlap;
- expected nested `lang` and `dir` values.

The final browser warning/error log was empty.

### Built-production proof

The same source was compiled with `pnpm build`, served through `next start` on port 3003 with build ID `Mk4vZYHPaVphd2uF3w3tH`, and checked again through Agent Browser rather than relying only on the development server:

- Daylight Today at 1440 x 900 passed the 32px target floor, single-H1, critical-text clipping, document/main overflow, and navigation-overlap checks.
- Carebook Safety review at 320 x 568 with `?stress=rtl&text=200&contrast=forced` passed the 44px target floor, single-H1, critical and essential-state clipping, document/main overflow, and bottom-navigation separation checks.
- The narrow result exposed `lang="ar"`, `dir="rtl"`, `data-text-size="200"`, and the deterministic forced-color hook; computed root colors resolved to Canvas/CanvasText and the active destination to Highlight treatment.
- The production browser warning/error log was empty.

This is a focused built-bundle smoke proof, not a second claim of the complete 144-combination matrix.

### Captures

| Evidence | Artifact |
| --- | --- |
| Expanded English desktop | `territories/daylight-long-copy-desktop.png` |
| Arabic RTL mobile | `territories/daylight-rtl-mobile.png` |
| 200% type Safety review | `territories/carebook-text-200-mobile.png` |
| Deterministic forced colors | `territories/daylight-forced-colors-mobile.png` |

## Failures Found And Corrected

The first pass exposed failures that the default English prototype hid:

1. Long mobile page identity labels were silently ellipsized.
2. At 200% text, a long Carebook Safety heading could force the main region wider than the viewport.
3. Signal's observed/unknown column and Carebook's child-count column were too narrow at 200% text.
4. At 320px and 200% text, Children status pills needed a vertical projection and the compact topbar needed wrapped identity.
5. Carebook's 320px room grid needed a tighter semantic column allocation.
6. RTL expanded chevrons initially rotated upward.
7. Arabic inherited Latin display/editorial families and line heights.
8. The first deterministic forced-color hook was declared before territory overrides, so computed Signal/Carebook colors remained branded even though the rule existed.

Corrections are scoped to the stress condition where possible. Normal desktop and mobile density remains unchanged.

## Forced-Color Evidence

The real `@media (forced-colors: active)` contract maps canvas, text, border, action, focus, and semantic statuses to system colors. State marks gain explicit current-color borders, and active/primary controls use Highlight and HighlightText.

The deterministic hook was checked through computed styles in all three territories after the cascade-order correction:

- root canvas resolves to white Canvas and black CanvasText in the current environment;
- the Daylight readiness field becomes a bordered Canvas surface;
- the active mobile destination resolves to system Highlight treatment;
- geometry, targets, headings, and overflow remain valid across all 12 workflow combinations.

This proves the CSS contract and cascade. It is not Windows high-contrast or forced-colors assistive-technology evidence.

## Direction Impact

The result does not change the provisional recommendation:

1. **Daylight** remains the strongest foundation. Its concentrated expressive field converts cleanly to a neutral bordered surface, and its hierarchy survives expanded English, Arabic, and 200% text.
2. **Signal** remains the strongest dense grammar. Its semantic columns required one targeted large-text widening, then passed every matrix.
3. **Carebook** remains viable but carries the greatest type risk. Its editorial scale exposed the most severe long-word and narrow-grid failures and required writing-system font overrides. The corrections work, but the selection score should retain this residual implementation cost.

No territory score is inflated by remediation. The evidence strengthens Daylight's recommendation and makes the cost of Carebook's editorial hierarchy more explicit.

## Evidence Boundary

Still open:

- actual browser zoom at 200% and 400%;
- user-configured browser default font sizes;
- Windows forced colors and high contrast on real hardware;
- VoiceOver, NVDA, TalkBack, and mixed-script announcement/order;
- production translation architecture and complete Arabic copy;
- Arabic shaping/font rendering across supported operating systems;
- locale-aware dates, times, money, plurals, collation, and time zones;
- PDF, email, export, parent, legacy, iOS, and Android localization;
- real operator testing in supported languages.

The stress hooks exist only in the isolated design lab. They do not alter production localization behavior, database data, permissions, native contracts, or legacy compatibility.
