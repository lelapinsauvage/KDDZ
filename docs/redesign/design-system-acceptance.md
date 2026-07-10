# Kiddz Online Design System Acceptance Contract

**Date:** 2026-07-10  
**Status:** Territory-neutral quality contract  
**Final visual tokens:** Blocked on creative-territory selection

## Purpose

This document defines the behavior, accessibility, performance, responsive, and quality requirements every redesigned Kiddz surface must satisfy. It deliberately does not select final colors, typefaces, illustration, or signature motion. Those decisions belong in the future `brand-design-constitution.md` after the creative-territory gate closes.

The system is not a component gallery. Components are accepted only when they support the canonical workflows and parity obligations documented in:

- `information-architecture.md`;
- `core-workflow-blueprints.md`;
- `journey-state-audit.md`;
- `authorization-scope-audit.md`;
- `cross-device-synthesis.md`;
- `localization-runtime-audit.md`;
- `reliability-offline-audit.md`;
- `accessibility-runtime-audit.md`;
- `territory-evaluation.md`.

## Standards and Evidence

Primary standards:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the web accessibility conformance target at Level AA.
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) informs continuity, spatial meaning, and reduced-motion judgment; it does not supply copied visual tokens.
- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) supplies current implementation checks for semantics, focus, forms, animation, state, content, and performance.
- [web.dev INP](https://web.dev/articles/inp), [LCP](https://web.dev/articles/lcp), and [CLS](https://web.dev/articles/cls) supply field performance thresholds.

Product evidence overrides imitation. Apple, Notion, Things, Headspace, Stripe, Flighty, and competitor references contribute principles and patterns; none becomes a skin. Automatically extracted brand-style summaries are prompts for inspection, not authoritative specifications.

## Conflict Resolution

When guidance conflicts, use this order:

1. Child safety, privacy, legal, medical, financial, and authorization integrity.
2. Preserved parity, database, native, and legacy contracts.
3. Accessibility and user control.
4. Correct workflow state and recovery.
5. Comprehension and speed for the target role.
6. Performance and device capability.
7. Selected Kiddz brand constitution.
8. Reference-product convention.
9. Decorative preference.

Visual novelty never wins against a higher item.

## System Architecture

### Layer 1: Brand foundations

Selected after territory review:

- brand palette and expressive combinations;
- display typography and wordmark relationship;
- illustration and character rules;
- signature motion moments;
- imagery and art direction;
- voice and campaign expression.

### Layer 2: Semantic product foundations

Stable across territories:

- canvas, surface, raised surface, overlay, and scrim;
- primary, secondary, muted, disabled, inverse, and link text;
- default, strong, subtle, focus, selected, and disabled borders;
- safe, unknown, warning, urgent, critical, waiting, forecast, draft, submitted, failed, corrected, and closed states;
- role, room, branch, child, staff, medical, finance, and communication categorical colors where needed;
- density, spacing, shape, elevation, icon, type, and motion roles.

### Layer 3: Component tokens

Components consume semantic roles, never raw brand values:

- control height and target;
- horizontal and vertical padding;
- surface, border, text, icon, focus, hover, active, selected, and disabled state;
- radius and elevation;
- motion duration, easing/spring, transform origin, and reduced variant.

### Layer 4: Product patterns

Patterns compose components around workflow contracts:

- readiness and live room state;
- owned work and resolution;
- explicit attendance;
- room care batch entry and child exception;
- critical child/safety record;
- ratio forecast and qualified cover;
- financial allocation and correction;
- evidence preflight and export;
- record workspace, history, and source provenance.

## Token Contract

Token names must describe function, not appearance. `color.status.critical.surface` is valid; `color.red.100` may exist only as a private palette primitive. Components may not bind directly to palette primitives.

### Required token groups

```text
color.canvas.*
color.surface.*
color.text.*
color.border.*
color.focus.*
color.action.*
color.status.<state>.*
color.category.<domain>.*
type.family.*
type.scale.*
type.weight.*
type.line-height.*
space.*
size.control.*
size.icon.*
radius.*
shadow.*
motion.duration.*
motion.easing.*
motion.spring.*
z-index.*
```

### Token rules

- Light and dark themes share semantic names and state meaning.
- High contrast may override palette values without changing hierarchy.
- Status colors include surface, text, border/icon, and focus-safe combinations.
- No state depends on one isolated color value.
- Raw hex, spacing, radius, shadow, duration, or z-index values are prohibited in production feature components unless a documented exception is approved.
- Theme values live in one source and are exposed to CSS and TypeScript without manual duplication.
- Token changes require visual regression evidence on a representative table, form, Today view, safety state, finance state, and mobile projection.

## Color and Surface

### Operational canvas

- Approximately 90% of the ordinary manager workspace remains white or near-white by visual area.
- Color concentrates on the one state, action, warning, or completion that deserves immediate attention.
- A full color field is reserved for a singular readiness or brand moment, not repeated across every module.
- Dense tables and long forms remain neutral; status uses compact semantic marks, surfaces, and text.
- Critical red is reserved for immediate harm, unsafe operation, destructive consequence, or failed high-risk obligation.
- Warning/forecast is distinct from critical and from unknown.
- Green means confirmed safe/completed only, never generic positivity.
- Blue does not become an automatic SaaS default; it must be selected intentionally as action, focus, category, or territory color.

### Prohibited color behavior

- Rainbow equality across dashboard cards.
- Colored left borders as the primary state device.
- Gradients, color blobs, glow, or bokeh as generic decoration.
- Low-contrast pastel text.
- Meaning communicated only by hue.
- Reusing critical color for marketing emphasis.
- Fabricated chart colors without a categorical or quantitative scale.

## Typography

### Product text

- UI typography prioritizes legibility, numeric comparison, language coverage, and density.
- Inter or a system-grade sans remains the default product hypothesis until final font testing.
- Brand/display typography may appear in wordmark, opening brief, empty/guidance moments, and carefully selected headers; it does not enter dense tables, long forms, medical facts, or ledgers by default.
- No negative letter spacing. Letter spacing remains zero unless a tested script-specific requirement demands otherwise.
- Numeric columns, times, ratios, money, and changing counts use tabular figures.
- Heading and body sizes come from named roles, not viewport-width formulas.
- Line length, wrapping, truncation, and long-word behavior are defined per component.

### Required type roles

- Display/brand.
- Page title.
- Section title.
- Object title.
- Body.
- Secondary body.
- Label.
- Metadata.
- Numeric display.
- Numeric table.
- Code/identifier where required.

### Internationalization

- Arabic/RTL and Latin text receive tested family fallbacks, line height, and mixed-number behavior.
- Names and user-entered text are never uppercased mechanically.
- Dates, numbers, currency, and relative time use locale-aware formatters.
- English synthetic copy does not fix production widths.
- Components are tested with 30-50% longer labels and the longest supported person/place names.

## Spacing, Shape, and Elevation

### Spacing

- A 4px base supports compact alignment; common layout rhythm uses multiples of 8px.
- Every spacing value maps to the scale.
- Component internal spacing is stable across hover, loading, error, and selected states.
- Density modes change a coordinated set of row height, padding, type, and icon sizes; they do not shrink touch targets below policy.

### Shape

- Product cards and bounded tools use a maximum 8px radius unless the selected identity documents a narrow exception.
- Pills are reserved for statuses, compact filters, segmented choices, and true capsule controls.
- Circular shape is reserved for avatars, status dots, and familiar icon actions.
- Page sections are unframed; cards do not sit inside cards.

### Elevation

- Level 0: canvas and inline surfaces.
- Level 1: bounded tool/card and sticky control.
- Level 2: menu, popover, picker.
- Level 3: modal, drawer, command palette.
- Level 4: exceptional system takeover only.

Elevation combines border, surface, and a restrained shadow. Shadow never substitutes for hierarchy, and large blurred shadows are prohibited.

## Iconography and Assets

- Use Lucide icons where an appropriate symbol exists.
- Familiar icon actions remain icon-only with accessible names and tooltips when meaning is not universally obvious.
- Do not manually draw replacement SVG icons for standard actions.
- Icon size, stroke, optical alignment, filled/outline selection, and semantic color are documented.
- Product visuals reveal real rooms, records, people, documents, or state when inspection matters.
- Illustration appears in brand/guidance contexts, not over medical, financial, compliance, or dense operational facts.
- Images declare dimensions/aspect ratio and loading priority to prevent layout shift.

## Control Acceptance

Every control documents:

- purpose and prohibited use;
- anatomy;
- variants and sizes;
- default, hover, active, focus-visible, selected, disabled, loading, success, error, and offline states;
- keyboard and screen-reader behavior;
- touch target and pointer behavior;
- content rules;
- responsive behavior;
- motion and reduced motion;
- analytics and audit events where relevant.

### Buttons

- One primary action per working surface.
- Icon buttons use familiar symbols and accessible labels.
- Button labels state the action and affected object (`Allocate EUR 240`, not `Continue`).
- Disabled state is used only when the reason is visible or discoverable.
- Loading begins after activation, keeps dimensions stable, prevents duplicate commit, and exposes status text.
- Destructive and irreversible actions use confirmation, typed consequence, undo, or correction based on risk.

### Segmented controls, tabs, and filters

- Segmented controls select among 2-5 mutually exclusive modes.
- Tabs switch peer views of one object; they do not replace global navigation.
- Filters describe inclusion and show active count.
- Filter/search/sort/pagination state is deep-linkable when returning or sharing matters.
- Horizontal scrolling controls retain a visible selected state and keyboard access.

### Forms

- Labels remain visible; placeholders are examples, not labels.
- Factual observation fields begin unset unless a server fact exists.
- Defaults are allowed for preferences and configuration, not invented child, medical, attendance, or financial facts.
- Required state, format, unit, and reason are adjacent to the field.
- Errors identify the problem and next valid action beside the source.
- Submission focuses or scrolls to the first error while retaining all input.
- Paste remains allowed.
- Autocomplete, input type, input mode, spellcheck, and name are intentional.
- Unsaved navigation warns and offers save/discard/cancel.
- Draft status includes saved time, scope, sync state, and conflict.

### Legal, medical, financial, and destructive forms

At least one must be true before final commit:

- the action is reversible through an authorized correction/reversal;
- input is checked with an opportunity to correct;
- a review/confirm step exposes affected records and consequence.

Kiddz generally requires both checked input and a visible result preview for finance, submitted incidents, permission changes, and evidence exports.

### Tables and record lists

- Tables are used for comparison; cards are not used to avoid column design.
- Headers are explicit, sticky only when useful, and associated programmatically.
- Numeric columns align and use tabular figures.
- Row actions do not resize the row on hover.
- Selection has a shared hit target and persistent bulk-action region.
- Sort direction, filters, pagination, and row count are visible and URL-preserved where needed.
- Horizontal scrolling is bounded to the table, not the page.
- Mobile converts to a summary list or one-record workspace; it does not squeeze every desktop column.
- Lists above roughly 50 visible items use pagination, progressive rendering, or carefully tested virtualization. Accessibility and selection behavior determine the mechanism.

### Cards

A card is accepted only when the object is independently actionable, its state boundary matters, or it benefits from a self-contained preview. Static totals, equal dashboard categories, and page-section framing are not cards.

### Charts

A chart is accepted only when:

- a named trend, distribution, forecast, or comparison question exists;
- source data, time range, units, and freshness are real;
- zero, empty, partial, long-label, and dominant-value states remain legible;
- data has a table/text alternative;
- the user can drill into source records or act on the finding.

Decorative/fake charts and generic dashboard bars are prohibited.

## Product Pattern Acceptance

### Readiness

- One sentence answers safe, unsafe, or unknown now.
- Room/source evidence sits immediately below or adjacent.
- Forecast is visibly different from current unsafe state.
- Confirmation is a server-owned event with actor/time/source revision.

### Owned work

- State, consequence, time, owner, source, and next action are present.
- Item lifecycle supports unassigned, assigned, in progress, waiting, failed, corrected, and closed.
- Completion updates the source object and queue.
- Information-only events do not masquerade as actionable work.

### Record workspace

- Identity and critical restrictions precede history.
- Current status and next action precede archival fields.
- Source, freshness, author, and revision are inspectable.
- Tabs represent peer views of the same record.
- Contextual return preserves search, filters, selection, scroll, branch, and date.

### High-risk review

- Source facts are visually distinct from proposed change and derived result.
- Consequence is explicit before commit.
- Success appends history and preserves downstream waiting obligations.
- Correction does not erase the original record.

## State Pattern Matrix

Every page, component, and workflow documents these states before acceptance:

| State | Required behavior |
| --- | --- |
| Initial | Page identity and stable layout appear immediately |
| Loading | Structural placeholder preserves dimensions and meaning; no generic full-page spinner |
| Empty | States what is empty, scope/date, and a useful action only when one exists |
| Partial | Names missing source/freshness and avoids false totals |
| Unknown | Names the missing fact and owner/action |
| Draft | Shows persisted scope, saved time, revision, and resume |
| Validation error | Appears beside source, preserves input, and focuses first error on submit |
| Permission denied | Explains safe reason category and return path without leaking record existence |
| Server failure | Preserves input/context and offers retry or safe escalation |
| Offline | Shows read/queued capability, unsynced scope, and conflict policy |
| Conflict | Shows server/local revisions and authorized resolution |
| Waiting | Names dependency, elapsed time, and next escalation/cancel rule |
| Success | Comes from server result and updates source object |
| Corrected/reversed | Preserves original, actor, reason, and new revision |
| Closed | Keeps result/evidence discoverable and removes only active-work treatment |

Status messages are exposed programmatically without forcing focus. Toasts may supplement but never replace inline source-state proof.

## Motion Contract

### Motion jobs

- Maintain spatial continuity between list and record.
- Show what changed after a user action.
- Indicate acceptance, waiting, failure, correction, or closure.
- Preserve context across drawer, panel, and responsive transitions.
- Add brand warmth in low-frequency expressive moments.

Motion never exists to make a static dashboard look busy.

### Motion levels

| Level | Use | Typical range |
| --- | --- | ---: |
| Instant | Press, focus, toggle, row feedback | 70-120ms |
| Routine | Menu, inline state, compact disclosure | 120-180ms |
| Meaningful | Submit result, queue-to-source handoff, panel | 180-280ms |
| Spatial | Navigation/shared-element continuity | 240-420ms, spring where justified |
| Expressive | Brand intro or rare milestone | Explicitly storyboarded; never blocks work |

Ranges are starting points, not hardcoded values. Perceived distance, object size, repetition, and consequence determine the final token.

### Performance rules

- Default to `transform` and `opacity`.
- Never use `transition: all`.
- Do not continuously animate width, height, grid tracks, margin, padding, top, left, border, gradient, mask, filter, or large shadows.
- Measure once and use FLIP-style transforms for layout-like continuity.
- Batch DOM reads before writes; no repeated layout measurement during animation.
- Do not drive animation from scroll events or polling.
- Blur is limited to a small, short, isolated effect; large or continuous blur is prohibited.
- `will-change` exists only during the active animation and on a limited surface.
- Do not mix CSS, Web Animations, Motion, and view-transition systems inside one component without an explicit ownership decision.
- Animations are interruptible; controls respond while motion is running.

### Springs

- Springs are reserved for direct manipulation, shared-element settling, compact completion, and expressive brand moments.
- High-frequency data entry uses critically damped or non-spring feedback.
- Overshoot never changes perceived numeric/state truth.
- Spring implementation animates compositor properties and is tested under CPU slowdown.

### Reduced motion

- `prefers-reduced-motion: reduce` removes translation, scale, parallax, and overshoot that are not essential.
- State order, source update, focus movement, and success/error meaning remain unchanged.
- Reduced motion may retain a short opacity change when it improves comprehension.
- No essential information depends on movement direction or animation completion.

## Accessibility Contract

### Conformance target

- WCAG 2.2 Level AA for complete processes, not isolated pages.
- 4.5:1 minimum contrast for normal text and 3:1 for large text and non-text UI boundaries where the criterion applies.
- Color is never the only state or instruction.
- Reflow works at 320 CSS px without two-dimensional page scrolling, except genuinely two-dimensional tools such as bounded tables/schedules.
- Text resizes to 200% without loss of content or function.

### Target policy

- WCAG AA 24px minimum is the compliance floor.
- Kiddz product target is 44 x 44 CSS px for touch and frequent operational controls, matching the enhanced target where practical.
- Dense desktop table controls may use a smaller visual glyph only when the interactive hit area remains at least 32px, spacing is safe, and an equivalent 44px action is available for touch projections.
- Checkboxes/radios and their labels share one hit target.

### Keyboard and focus

- Every workflow is completable with keyboard alone.
- Focus order follows visual/reading order and never enters hidden off-canvas content.
- Focus is visible, unobscured by sticky/fixed UI, and returned after modal/drawer closure.
- Skip link reaches main content.
- Menus, tabs, comboboxes, dialogs, grids, and listboxes follow the relevant ARIA interaction pattern or use native controls.
- Escape closes the topmost dismissible layer without losing work.
- No keyboard trap.

### Screen reader

- Landmarks and heading hierarchy identify shell, page, sections, forms, lists, and records.
- Icon-only controls have accessible names; decorative icons are hidden.
- Loading, validation, saved, submitted, waiting, failed, and completed status is announced without stealing focus.
- Table headers, selection counts, sort state, and bulk-action context are programmatically available.
- Dynamic room/ratio changes expose concise live announcements, not every visual animation step.

### Cognitive and interruption support

- Active context, date mode, role projection, current object, and unsaved/sync state remain visible.
- Instructions use concrete nursery language and one action per sentence.
- Drafts and progress can be resumed after interruption.
- Destructive, legal, medical, and financial actions expose review/correction.
- Time pressure is communicated without countdown animation unless policy requires exact expiry.

## Responsive Contract

### Viewport bands

- Wide desktop: 1440 and above.
- Compact desktop: approximately 1280.
- Tablet landscape: approximately 1024.
- Tablet portrait: approximately 768.
- Mobile: approximately 390, with 320 reflow verification.

These are acceptance bands, not hard device detection. Components respond to available space and container constraints.

### Rules

- Desktop prioritizes comparison, planning, reconciliation, and evidence review.
- Tablet prioritizes one room/record with branch context and touch targets.
- Mobile prioritizes capture, confirm, message, urgent work, and draft resume.
- Secondary context compresses before state, consequence, source, or primary action.
- Tables become summary lists or bounded scroll; page-level horizontal overflow fails.
- Fixed bars respect safe-area insets and reserve content space.
- Text and controls never overlap, clip, or resize the layout on hover/loading.

## Performance Contract

Field targets at the 75th percentile, segmented by mobile and desktop:

- INP: 200ms or less.
- LCP: 2.5s or less.
- CLS: 0.1 or less.

Product-specific targets:

- Route shell and page identity appear without waiting for secondary data.
- Frequent local feedback begins in the next frame.
- Optimistic UI is used only when a reliable rollback/idempotency contract exists.
- Live data updates do not shift controls under the pointer.
- Large lists use pagination/progressive rendering/virtualization based on measured need.
- Images and media reserve dimensions.
- Critical fonts avoid invisible text and excessive weight downloads.
- Motion is profiled under CPU slowdown and on representative tablet/mobile hardware.
- Offline/service-worker behavior is tested against sensitive-data and stale-state policy.

Performance budgets become CI checks after baseline instrumentation is added. Lab-only scores do not replace field measurement.

## Component Release Gate

A component cannot enter the shared production library until it has:

1. Named product use and prohibited use.
2. Semantic-token-only styling.
3. All interactive, loading, empty, error, offline, conflict, success, and disabled states that apply.
4. Keyboard and screen-reader behavior.
5. Touch, desktop, and reduced-motion behavior.
6. Long text, localization, and numeric evidence.
7. Visual regression coverage in light/dark/high-contrast where supported.
8. Unit/interaction tests for state logic.
9. Agent Browser evidence at required viewport bands.
10. Performance review for animation, list size, image, and layout stability.
11. A parity/workflow reference proving it solves real product work.

## Screen Release Gate

A redesigned screen cannot replace production presentation until:

- affected parity rows, aliases, native contracts, and database sources are named;
- role/capability fixtures cover allowed and denied access;
- happy path and every applicable state-pattern row are implemented;
- direct URL, search, queue, and contextual navigation land consistently;
- browser back/forward preserves meaningful state;
- desktop, tablet, mobile, 320 reflow, and 200% zoom pass;
- keyboard, focus, screen reader, contrast, and target checks pass;
- reduced motion and no-motion meaning pass;
- production build, console, network, and error-boundary checks pass;
- source object and audit history update from the server result;
- correction/retry/waiting semantics exist for high-risk work;
- no unrelated production capability or visual surface regresses.

## Prohibited System Patterns

- Generic shadcn-style assembly presented as a brand.
- Equal card grids for unrelated categories.
- Nested cards and floating page-section cards.
- Fake or decorative charts.
- Decorative gradients, blobs, glows, or random shapes.
- Colored left borders as primary status language.
- Excessive pill controls.
- Full-page spinners that hide page identity.
- Toast-only success or error.
- Client-only completion flags.
- Prefilled factual observations.
- Hidden authorization treated as security.
- Destructive replacement of versioned records.
- Motion on every card/row or scroll-driven decoration.
- Layout animation on large operational surfaces.
- Hardcoded locale/date/currency strings in production flows.
- Final visual tokens chosen before the creative-direction gate.

## Open Work

- Select the creative territory and create `brand-design-constitution.md`.
- Test final palette contrast in light, dark, and high-contrast themes.
- Test product/display typography across Latin, Arabic/RTL, long names, and 200% zoom.
- Decide whether to add a motion library after prototype evidence; the current repository has no Motion dependency.
- Add automated accessibility and visual-regression infrastructure.
- Add field Web Vitals instrumentation and budgets.
- Build component fixtures for the complete state matrix.
- Validate touch, screen reader, reduced motion, offline, and CPU performance on real devices.

This contract is sufficient to start territory-neutral component-state fixtures and workflow wireflows. It is not permission to style or migrate production screens before selection and parity gates close.
