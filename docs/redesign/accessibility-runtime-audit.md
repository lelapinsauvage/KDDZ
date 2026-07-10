# Accessibility And Input-Method Runtime Audit

**Date:** 2026-07-10  
**Scope:** Production web source, authenticated core routes, desktop/320px reflow, keyboard/dialog behavior, forms, tables, charts, motion, contrast, and design-system release gates  
**Visual direction:** Territory-neutral  
**Production behavior changed:** No

## Question

Can the selected Kiddz design system make complete nursery workflows perceivable, operable, understandable, and robust for keyboard, screen-reader, touch, zoom, reduced-motion, color-vision, and interruption needs without hiding operational depth or weakening parity?

## Method

The audit combines:

- an AST-backed source scanner: `pnpm tsx src/scripts/report-redesign-accessibility.ts --summary`;
- authenticated Agent Browser measurements on Dashboard, Today, Children, Accounting, Daily Reports, New Child, Calls, and Settings;
- desktop runtime at 1274 CSS px, 320px reflow checks at a 314px content viewport, and a partial 640px/200%-zoom-equivalent pass;
- direct empty-form validation, global-search dialog, focus-return, heading, landmark, table, chart, and target-size checks;
- direct inspection of shared Button/Input primitives and the global reduced-motion/focus fallback;
- token-pair contrast calculations using the current production palette;
- current primary guidance from [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI form labels](https://www.w3.org/WAI/tutorials/forms/labels/), [WAI form validation](https://www.w3.org/WAI/tutorials/forms/validation/), [WAI status messages](https://www.w3.org/WAI/WCAG22/Techniques/failures/F103.html), the [ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility/).

One short-lived local admin audit user was used only to render structural runtime state. It was signed out and deleted with its sessions/accounts; database verification returned zero audit users. No operational record was created or changed, and no personal-record screenshots were captured.

Automated/source findings are candidates until runtime or manual inspection confirms them. The audit does not present a heuristic count as a WCAG failure by itself.

## Source Baseline

The scanner covers 756 production source/style files, including 533 TSX files. Generated code, scripts, and design-lab fixtures are excluded.

| Signal | Count | Interpretation |
| --- | ---: | --- |
| Page files | 244 | Route inventory; 237 delegate or omit a local H1 and require runtime validation |
| Native buttons | 93 | Direct semantic controls |
| Shared `Button` uses | 697 | Primary target-size and naming migration surface |
| Native form controls | 46 | Direct-label review surface; custom primitives are reviewed at call sites |
| Dialog content instances | 73 | Focus/label/return testing surface |
| Explicit live regions/status roles | 4 | Small compared with dynamic workflow breadth |
| Toast calls | 289 | Toasts cannot replace inline and programmatic state proof |
| Error associations | 2 | `aria-invalid`, `aria-errormessage`, and `aria-describedby` are rare |
| Hidden accessible-text uses | 29 | Existing naming pattern to preserve |
| Tooltip instances | 57 | Tooltips help sighted pointer users but are not accessible names by default |
| Focus-visible classes | 67 | Shared and local focus styling exists |
| Focus-outline suppression | 19 | Requires pairing verification; shared primitives add rings/fallbacks |
| `transition-all` | 57 | Motion/property/performance review surface |
| Repeating animation classes | 70 | Mostly loaders/skeletons; meaning must remain non-motion |
| Reduced-motion media queries | 1 | Global rule shortens all transitions/animations and disables skeleton animation |
| Positive `tabIndex` | 0 | Good baseline |
| `autoFocus` | 0 | Good baseline; dialogs set focus through primitives |
| Images missing `alt` candidate | 0 | Good source baseline |
| Unnamed button candidates | 74 | Includes confirmed icon-only table/filter actions; resolve per component |
| Direct unlabeled native-control candidate | 1 | Confirmed child-dashboard select; custom-control labels remain runtime work |
| Non-interactive click handlers | 4 | Confirmed calendar/event/class upload interactions require semantic controls |
| Product targets below 44px candidate | 216 | Shared Button sizes are 24-40px; geometry is runtime-confirmed widely |

The scanner intentionally treats dynamic text as a possible name and excludes hidden file inputs and spread-prop UI primitives. It therefore favors a reviewable candidate set over inflated certainty.

## Runtime Baseline

### Desktop core routes

| Route | H1 / heading levels | Visible controls | Unnamed candidates | Under 24px | Under Kiddz 44px | Page overflow | Other evidence |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Dashboard | 1 / `1,3,3,3,3,3` | 43 | 3 chart groups | 1 | 25 | No | No skip link/live region; three tabbable Recharts groups have no name |
| Today | 1 / `1` | 162 | 0 by runtime name heuristic | 45 | 161 | No | 135 visible SVGs, none exposed as named graphics |
| Children | 0 | 161 | 11, including 5 controls and 6 buttons | 41 | 150 | 1544px in 1274px viewport | Unnamed table; no page H1 |
| Accounting | 1 / `1` | 155 | 2, including search input | 58 | 154 | 1544px in 1274px viewport | Unnamed table; tablist needs contextual name review |
| Daily Reports | 1 / `1` | 93 | 52: 8 controls, 30 links, 14 buttons | 2 | 92 | 1412px in 1274px viewport | Unnamed table and dense icon-row actions |
| New Child | 1 / `1,3,4` | 61 | 16 form controls | 8 | 53 | No | Visible labels are not programmatically associated with many controls |
| Calls | 1 / `1,3` | 43 | 1 search input | 3 | 42 | 1442px in 1274px viewport | Unnamed table |
| Settings | 1 / `1` | 40 | 0 | 1 | 23 | No | Best structural baseline of the sampled routes |

All eight routes had one `main`, one header/banner, one footer/contentinfo, and at least one navigation region. None exposed a visible skip link or persistent live/status region. No sampled table had a caption or programmatic name.

The runtime name heuristic does not count placeholder text or a selected option as an associated label. It does count button/link text and explicit ARIA/native labels. This aligns the metric with the requirement that labels remain meaningful after a user enters data.

### 320px reflow

| Route | Content width / scroll width | Result | Unnamed | Under 44px |
| --- | --- | --- | ---: | ---: |
| Dashboard | 314 / 314 | Passes page reflow | 5 | 9 |
| Today | 314 / 342 | Fails page reflow | 2 | 141 |
| Children | 314 / 413 | Fails page reflow | 13 | 130 |
| Accounting | 314 / 314 | Page reflows; dense content still needs bounded-tool review | 4 | 134 |
| Daily Reports | 314 / 413 | Fails page reflow | 54 | 67 |
| New Child | 314 / 374 | Fails page reflow | 18 | 37 |
| Calls | 314 / 314 | Passes page reflow | 3 | 20 |
| Settings | 314 / 314 | Passes page reflow | 2 | 7 |

At 320px, Accounting's visible H1 disappeared even though the desktop route had one. This is a semantic breakpoint regression, not only a layout choice.

A 640px pass, equivalent to viewing a 1280px layout at roughly 200% geometric zoom, showed no page overflow on Dashboard, Today, Children, or Accounting. The pass timed out while loading later routes and therefore does not close the 200% gate. New Child already fails the stricter 320px check.

## Contrast Baseline

Current token pairs were calculated using WCAG relative luminance:

| Pair | Ratio | Current use/risk |
| --- | ---: | --- |
| Primary `#1caf9a` / white | 2.75:1 | Fails normal button text and 3:1 non-text boundary/focus use |
| Primary / dark sidebar `#364150` | 3.77:1 | Passes 3:1 graphics/large text; not normal text |
| Accent text primary / accent tint `#e8f8f5` | 2.51:1 | Fails normal text and non-text state differentiation |
| Destructive `#d64635` / white | 4.39:1 | Slightly below 4.5:1 normal-text target |
| Warning `#c29d0b` / white | 2.59:1 | Fails normal text where this pairing is used |
| Info `#327ad5` / white | 4.30:1 | Slightly below 4.5:1 normal-text target |
| Muted foreground `#505f72` / white | 6.52:1 | Pass |
| Sidebar text `#b4bcc8` / sidebar | 5.41:1 | Pass |
| Learning `#7c3aed` / white | 5.70:1 | Pass |

The shared Button uses white on primary, so its 2.75:1 failure is confirmed. The global focus fallback uses primary against white at 2.75:1; component rings use the same color at partial opacity and cannot be assumed to pass. Final territory tokens require automated pair/state testing, not visual approval alone.

## Findings

### A01 - Accessible names and labels are not component invariants

**Severity:** P0 operability

Confirmed examples include:

- icon-only clear-filter, view, edit, delete, and pagination actions with no name;
- Children filters and row controls that appear unnamed at runtime;
- child-enrollment inputs whose visible `Label` text is adjacent but not connected by `htmlFor`/`id`;
- date, select, search, and option controls that rely on placeholder or visual position;
- four `div` click targets without native semantics, keyboard support, or role.

Placeholders disappear as users type and are not a replacement for persistent associated labels. A Tooltip is not a replacement for a control name.

**Target:** shared APIs require a visible label or explicit accessible name. Icon buttons require `label`; fields generate stable label/hint/error IDs; click behavior uses native Button/Link/Input/Label semantics.

### A02 - Form validation is visible but not announced or focused

**Severity:** P0 task completion

On empty New Child step one, activating Next displayed five errors. Runtime then showed:

- focus remained on the Next button;
- the first invalid field did not receive focus;
- no visible control had `aria-invalid`, `aria-describedby`, or `aria-errormessage`;
- no error summary or live region existed;
- the page did not expose a programmatic count or route to the errors.

This contradicts the design-system acceptance contract and WAI form guidance.

**Target:** retain input, add an error-summary heading/live announcement, focus the summary or first invalid field according to form size, associate every message with its field, and preserve authored values through correction.

### A03 - Page entry and heading hierarchy are inconsistent

**Severity:** P1 navigation

No sampled route had a skip link. Dashboard jumps from H1 directly to H3. Children has no visible H1. Accounting loses its H1 at 320px. Some card labels are generic containers instead of headings, so screen-reader heading navigation cannot reproduce the visual hierarchy.

**Target:** one visible H1 identifies every page in every breakpoint; section levels do not skip without structural reason; a first-focus skip link targets a stable `main` ID; record/dialog titles are correctly scoped.

### A04 - Shared control sizes conflict with the product target

**Severity:** P1 touch, motor, and operational speed

The shared Button defaults to 36px, with named sizes from 24px to 40px. Runtime confirms widespread undersizing: Today has 161 of 162 visible controls below 44px at desktop; Accounting 154 of 155; Children 150 of 161; Daily Reports 92 of 93; Calls 42 of 43.

Some controls may meet WCAG's 24px floor or spacing exception. They still fail the locked Kiddz 44px operational target and increase error risk for practitioners using touch or working under interruption.

**Target:** default and frequent actions expose a 44px hit area. Dense desktop glyphs may render smaller only inside a minimum 32px hit area with safe spacing and an equivalent 44px touch projection, as already defined by the acceptance contract.

### A05 - Reflow failures are page-level, not bounded tools

**Severity:** P1 low vision and compact use

Children, Daily Reports, New Child, and Today exceed the 320px viewport. At desktop width, Children, Accounting, Daily Reports, and Calls also produce page-level horizontal overflow. The current tables are not always isolated as labelled, keyboard-scrollable bounded regions.

**Target:** page chrome and primary workflow reflow to 320px. Genuine two-dimensional tools live in a named region with its own scroll affordance, keyboard access, sticky-context safety, and non-table summary projection.

### A06 - Charts expose visual output without governed alternatives

**Severity:** P1 comprehension

Dashboard exposes three Recharts groups as tab stops without accessible names. Chart titles and summaries are generic containers rather than a consistent figure/heading/summary contract. Today has 135 visible SVGs, largely icons, with none exposed as named graphics; icon hiding/naming is not governed centrally.

**Target:** every truthful chart has a figure name, concise insight, exact data table/list, keyboard-safe interaction, non-color state encoding, and a reason to exist. Decorative icons are hidden; semantic icons contribute through the parent control name, not duplicate speech.

### A07 - Dialog entry works, but focus return is not reliable

**Severity:** P1 keyboard continuity

Global Search opens as a named dialog and correctly focuses its search combobox. Escape closes it. After closure, focus returned to `body`, not the Search trigger. This forces a keyboard user to rediscover context.

**Target:** every dialog/drawer records a valid trigger or explicit next target, traps focus while open, closes on Escape when safe, restores focus after animation/unmount, and handles a removed trigger through a documented fallback.

### A08 - Current brand/action color is not accessible enough

**Severity:** P0 visual access

Primary white-on-teal text and teal focus on white fail current targets. Several status pairs are marginal or failing. Color also carries substantial chart/status meaning.

**Target:** the selected territory palette is generated as semantic state pairs with tested text, icon, border, focus, hover, active, selected, disabled, and chart combinations. Color never stands alone; no final token is accepted without light/dark/high-contrast and color-vision fixtures.

### A09 - Dynamic status depends heavily on visual toasts

**Severity:** P0 state integrity

The source contains 289 toast calls but only four explicit live/status regions. No sampled core route exposed a persistent live region at rest. The reliability audit already established that success must update the source object and remain durable.

**Target:** one shared status architecture separates inline field error, page/workflow status, background operation log, urgent alert, and optional toast. Live regions exist before messages are inserted, use appropriate politeness, avoid repeated noise, and never announce an unconfirmed operation as complete.

### A10 - Motion reduction exists globally but motion APIs remain ungoverned

**Severity:** P1 vestibular/cognitive comfort and performance

The global `prefers-reduced-motion` rule is a real strength: it shortens transitions/animations and removes skeleton animation. However, 57 `transition-all` and 70 repeating animation uses make property scope and intent difficult to audit. Generic hover scaling and translation are baked into shared Button/card patterns.

**Target:** final components animate only transform/opacity or named safe properties, use the accepted motion contracts, preserve meaning with zero geometry motion, and do not make loading comprehension depend on spin/pulse.

### A11 - Dense tables lack an accessibility contract

**Severity:** P1 data operations

Children, Accounting, Daily Reports, and Calls each expose an unnamed table. Row action names, selection state, sort state, filters, overflow, and bulk-action context are inconsistent. Several routes contain dozens of unnamed row links/buttons.

**Target:** DataTable requires caption/label, column headers, sort announcements, selection labels/count, named row actions, keyboard-scroll region, sticky-header focus safety, and a responsive record-summary projection.

### A12 - Responsive semantics change with visibility

**Severity:** P1 robustness

Accounting has an H1 at desktop and none at 320px. Compact layouts can hide labels, section identity, and alternate actions even when the visible arrangement appears acceptable.

**Target:** breakpoints may change composition, not accessible name, role, state, reading order, source context, or workflow consequence. Responsive tests compare the accessibility tree, not only pixels.

## Existing Strengths

1. Core routes use `main`, navigation, header, and footer landmarks.
2. Sampled images had alt attributes; the scanner found no missing-alt candidate.
3. No positive tab order or uncontrolled `autoFocus` was detected.
4. Shared components provide visible focus-ring styling and a global focus fallback.
5. Global Search uses a named dialog, focuses its input, and closes on Escape.
6. A global reduced-motion media query applies broadly.
7. Existing `sr-only`, Tooltip, Radix dialog/menu, and semantic Button patterns provide migration primitives.
8. Settings is a comparatively clean structural baseline among sampled routes.

These strengths are starting points, not proof that a complete process conforms.

## Required Shared Components

### `PageFrame` and `PageHeader`

- stable `main` target and first-focus skip link;
- exactly one visible H1 at every breakpoint;
- active branch/date/history context;
- page-level status/error-summary slot;
- primary action and responsive alternative retain the same name/consequence.

### `Field`, `FieldGroup`, and `ErrorSummary`

- generated stable IDs;
- persistent visible label;
- required/optional meaning;
- hint, units, format, and example separated from placeholder;
- `aria-invalid`, described error, and first-error/error-summary focus policy;
- Latin/Arabic/RTL, autocomplete, input-purpose, and 200%-zoom fixtures.

### `IconAction`

- required accessible label and optional Tooltip from the same string;
- decorative icon hidden;
- 44px default hit target;
- pending/disabled reason and durable result;
- no unlabeled `asChild` escape path.

### `StatusRegion`

- pre-existing polite/assertive/log region as appropriate;
- deduplication and interruption policy;
- operation ID/status linkage;
- text plus icon/shape, never color alone;
- reduced-motion presentation.

### `DataTable` and `RecordList`

- required caption/label and summary;
- sortable-header state and announcements;
- named selection and row actions;
- keyboard-scroll containment;
- bounded desktop table and semantic compact projection;
- loading/empty/partial/error/offline/conflict states.

### `DataFigure`

- required question and truthful data source;
- figure name and concise current insight;
- exact list/table alternative;
- colorblind-safe series encoding;
- keyboard-safe detail and reduced-motion transition;
- prohibited when a number/list communicates the job better.

### `ContextDialog` and `ContextDrawer`

- ARIA pattern semantics;
- initial-focus strategy by content/consequence;
- focus trap and Escape behavior;
- explicit return target/fallback;
- mobile sheet and desktop dialog preserve state and reading order.

## Migration Plan

### Wave 0 - Measure and prevent regression

- Keep the scanner in reporting and classify candidates by shared primitive/domain.
- Add automated accessibility tests for the design labs and selected pilot routes.
- Record 320px, 200%, reduced-motion, and keyboard fixtures before visual migration.

### Wave 1 - Fix shell and semantic foundations

- Add skip link/main target and one PageHeader contract.
- Correct heading hierarchy and responsive H1 persistence.
- Replace primary/focus/status tokens only after territory selection and contrast tests.
- Raise shared target dimensions without removing dense desktop capability.

### Wave 2 - Fix fields and validation

- Introduce Field/ErrorSummary primitives.
- Migrate New Child first because it exercises long forms, steps, Arabic, file upload, drafts, and high-risk data.
- Preserve values and focus through error correction and step navigation.

### Wave 3 - Fix tables, filters, and icon actions

- Migrate Children, Daily Reports, Calls, Accounting, and shared DataTable.
- Name every search/filter/row/pagination action.
- Bound horizontal tools and provide compact record projections.

### Wave 4 - Fix live operational status and charts

- Introduce StatusRegion tied to operation receipts.
- Replace chart tab stops with the DataFigure contract or remove the chart when unnecessary.
- Apply non-color and exact-data alternatives to attendance, ratio, finance, and compliance state.

### Wave 5 - Complete core workflows

- Verify Today, attendance/ratios, child profile, care, medical, rota, occupancy, finance, and compliance as complete processes.
- Test allowed/denied, loading, validation, conflict, interruption, confirmation, correction, and history states.

### Wave 6 - Assistive technology and real-device hardening

- VoiceOver with Safari on macOS and iOS/iPadOS.
- NVDA with Chrome and Firefox on Windows.
- Full Keyboard Access/Switch Control where native surfaces apply.
- 320px reflow, 200% browser zoom, system text scaling, high contrast/forced colors, reduced motion, color-vision simulation, and representative touch hardware.
- Operator testing with practitioners who use keyboard, zoom, or assistive technology where available.

## Acceptance Fixtures

### Shell and navigation

1. First Tab reveals a visible skip link that moves focus to `main`.
2. Every route has one H1 at desktop, tablet, mobile, and 320px.
3. Branch, role, date, and historical mode are announced once and remain inspectable.
4. Sidebar collapse, route transition, back/forward, and session expiry preserve sensible focus.

### Forms

1. Every control has a persistent associated label after data entry.
2. Empty/invalid submit announces error count and focuses the summary/first field.
3. Each field exposes invalid state, instruction, and error relationship.
4. Correcting one field removes only its error without erasing other input.
5. Long English, Arabic, mixed script, 200% zoom, and text-spacing overrides do not clip or overlap.

### Dialogs and overlays

1. Open moves focus to the correct internal target.
2. Tab/Shift-Tab remain inside; Escape closes when safe.
3. Close returns focus to the trigger or documented fallback.
4. Nested dialog/menu/tooltip status is not duplicated or trapped.
5. Sticky bars and sheets never obscure focused content.

### Tables and charts

1. Screen readers announce table purpose, headers, sort state, selection, and row action target.
2. Horizontal table regions are named and keyboard scrollable without moving the page in two dimensions.
3. Every chart question can be answered from an exact text/table alternative.
4. Series and states remain distinguishable without color.
5. Chart updates announce one concise result, not every animation frame.

### Status and mutation

1. Saving, queued, interrupted, conflict, failed, confirmed, and corrected are programmatically distinct.
2. Pending work is never announced as success.
3. Toast dismissal never removes the only proof or recovery action.
4. Repeated background updates are deduplicated and do not interrupt reading continuously.

### Visual and motor

1. Final token matrix passes text/non-text/focus contrast in every state/theme.
2. Frequent controls expose 44px targets; dense exceptions meet the documented contract.
3. Focus is visible, at least the required area/contrast, and unobscured.
4. Drag interactions have keyboard and single-pointer alternatives.
5. Reduced motion removes geometry/bounce/peripheral movement while preserving state.

### Responsive and zoom

1. Complete processes pass at 1440, 1280, 1024, 768, 390, and 320px.
2. 200% zoom preserves content/function; 400%-equivalent reflow passes at 320px.
3. Tables/schedules are the only bounded two-dimensional exceptions and expose an alternate summary.
4. Breakpoints preserve name, role, value, order, status, and primary consequence.

## Decisions

1. Accessibility is a component/API invariant and complete-process gate, not final QA.
2. WCAG 2.2 AA is the conformance floor; Kiddz keeps its stricter 44px operational target.
3. The selected brand palette cannot retain current teal pairings that fail contrast.
4. Placeholders, tooltips, icons, position, and color do not replace labels or names.
5. Toasts supplement durable inline/source state; they do not own completion.
6. Responsive redesign may change composition but not semantics or capability.
7. Charts require a real operational question and exact alternative; otherwise use text/list.
8. Global reduced motion is preserved and strengthened with component-level intent.
9. Source scanners, Agent Browser, automated rules, screen readers, and real users provide different evidence; none alone proves conformance.

## Open Gates

1. Final territory colors, font/script coverage, and dark/high-contrast themes.
2. Which dense desktop actions qualify for the target-size exception.
3. Screen-reader/device matrix supported at first launch.
4. Operator terminology and error/help copy for England, Ireland, and Lebanese/Arabic workflows.
5. Chart questions retained after the selected Today/dashboard redesign.
6. Whether tables use native markup, grid interaction, or separate editing surfaces per workflow.
7. High-contrast/forced-color and OS text-size requirements for native clients.
8. Accessibility ownership, regression budget, and release sign-off process.

Until these gates close, this audit defines the remediation architecture and fixtures. It does not claim current conformance, alter production presentation, or remove any restored workflow.
