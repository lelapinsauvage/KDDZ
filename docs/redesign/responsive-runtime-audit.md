# Kiddz Online Responsive Runtime Audit

**Status:** Verified current-state evidence
**Last updated:** 2026-07-10
**Primary product posture:** Desktop first, intentionally adapted for tablet and mobile

## Purpose

This pass establishes how the current product behaves below the original 1440 x 900 baseline. It is not an argument to make the redesign mobile first. It identifies where the manager's desktop workspace, tablet floor workflows, and mobile companion experience need different composition rather than one shrinking layout.

## Method And Privacy

- Tested in the authenticated in-app browser against the running local application.
- Exact test viewports: 1280 x 800 compact desktop, 1024 x 768 tablet/compact desktop, and 390 x 844 mobile.
- Routes: Dashboard, Today, Children, Accounting, Daily Reports, and Settings.
- A temporary same-origin iframe harness created the exact viewport dimensions inside the in-app browser.
- `X-Frame-Options` was temporarily changed locally from `DENY` to `SAMEORIGIN` for the harness and restored to `DENY` before documentation or commit.
- The temporary harness was removed.
- One short-lived admin audit user was signed out and deleted with its sessions and accounts; a database check returned zero remaining audit users.
- Screens containing child, parent, staff, medical, or financial identities were measured structurally but not saved as screenshots.
- `responsive-baseline-metrics.json` contains geometry and interaction counts only.

The `smallTouchTargets` metric counts visible links, buttons, fields, selects, textareas, and button-role elements with either dimension below 44 CSS pixels. It is an ergonomic signal for floor use, not by itself a WCAG conformance verdict.

## Preserved Evidence

- `baseline/dashboard-compact-1280.jpg`
- `baseline/dashboard-tablet-1024.jpg`
- `baseline/dashboard-mobile-390.jpg`
- `baseline/settings-mobile-390.jpg`
- `responsive-baseline-metrics.json`

## Executive Finding

The product has breakpoints, but not a responsive operating model. Desktop modules are hidden, narrowed, stacked, or allowed to overflow; their hierarchy and task sequence remain unchanged. This is most damaging where the user needs quick floor work or dense record management:

- Dashboard becomes a very long stack on mobile but still leads with static totals.
- Today becomes more than 9,000 CSS pixels tall on mobile and retains nearly 200 interactive elements.
- Children and Accounting create page-level horizontal overflow on compact desktop and tablet.
- Fixed mobile navigation consumes content space without consistently reserving a safe bottom inset.
- Chart geometry narrows without protecting labels or meaning.

The redesign needs a desktop manager workspace, a tablet room workspace, and a mobile daily companion built from the same domain objects but composed around different jobs.

## Route Findings

### Dashboard

| Viewport | Document height | Root overflow | Visible interaction signal |
| --- | ---: | ---: | --- |
| 1280 x 800 | 1,581 px | 0 px | 41 interactive elements; 24 below 44 px |
| 1024 x 768 | 1,581 px | 0 px | 37 interactive elements; 21 below 44 px |
| 390 x 844 | 3,602 px | 0 px | 29 interactive elements; 8 below 44 px |

At 1024 the sidebar collapses to a 48-pixel icon rail and the main area widens, but donut labels and legends are clipped inside the chart panels. The cards technically fit while their data does not.

At 390 the first viewport remains dominated by Total Branches, Total Classes, and Total Children. Live readiness and action-needed work move far below the fold. The mobile document is more than four viewport heights long before deeper modules are considered.

**Requirement:** Recompose rather than stack. Compact desktop preserves the operational hierarchy and chart legibility; mobile begins with the role's live state and next action, not organization totals.

### Today

| Viewport | Document height | Interactive elements | Below 44 px |
| --- | ---: | ---: | ---: |
| 1280 x 800 | 5,420 px | 204 | 203 |
| 1024 x 768 | 5,420 px | 200 | 200 |
| 390 x 844 | 9,085 px | 192 | 183 |

Today has no page-level horizontal overflow, but vertical stacking makes the room workflow exceptionally long. At mobile width it exceeds ten viewport heights, while the interaction count remains almost unchanged. The screen adapts geometry without reducing decision load or establishing a batch-first rhythm.

**Requirement:** Tablet and mobile Today must organize by room state, incomplete work, and exceptions. Batch operations, a stable child status row, and a review/confirm step replace hundreds of equally weighted controls.

### Children

| Viewport | Root overflow | Out-of-bounds interactive elements | Below 44 px |
| --- | ---: | ---: | ---: |
| 1280 x 800 | 270 px | 53 | 152 of 163 |
| 1024 x 768 | 48 px | 45 | 143 of 153 |
| 390 x 844 | 29 px | 77 | 130 of 145 |

The main desktop table extends past the viewport even at 1280. Collapsing the sidebar at 1024 does not fully recover the width. Mobile still exposes a narrowed version of the dense record surface, leaving more than half of its interactive elements partly outside the viewport.

**Requirement:** Keep desktop comparison power inside a bounded data workspace with internal column scrolling, frozen identity, column presets, and a visible overflow cue. Mobile switches to search, saved views, summary rows, and record preview; it does not reproduce the full table.

### Accounting

| Viewport | Document height | Root overflow | Below 44 px |
| --- | ---: | ---: | ---: |
| 1280 x 800 | 3,409 px | 270 px | 153 of 154 |
| 1024 x 768 | 3,409 px | 48 px | 146 of 146 |
| 390 x 844 | 3,886 px | 0 px | 133 of 138 |

Desktop and tablet inherit the wide-table overflow pattern. Mobile removes root overflow mostly by stacking, but retains the full financial information burden and a nearly four-thousand-pixel document. This does not solve reconciliation or make the next finance action clearer.

**Requirement:** Desktop finance uses one bounded ledger, persistent balance context, and action-oriented exceptions. Mobile prioritizes family lookup, overdue work, payment confirmation, and receipt delivery; historical ledger detail opens on demand.

### Daily Reports

Daily Reports is the strongest responsive list in this sample: it creates no root overflow and remains approximately one viewport tall at all three sizes. However, 32 of 33 interactive elements at 1280 and all 19 at 1024 fall below the 44-pixel floor-use target.

**Requirement:** Preserve the compact information model while introducing explicit touch-density modes, stronger state labels, and a room-first batch entry path.

### Settings

Settings has no root overflow, but mobile converts the flat capability directory into a 1,601-pixel sequence of equally weighted cards. The first viewport shows legacy administration destinations without grouping by scope, risk, or frequency. Fixed bottom navigation overlaps the lower card region.

**Requirement:** Desktop groups settings into organization, people/access, operations, communication, data, and legacy administration. Mobile uses the same groups as drill-in lists and reserves safe-area space above fixed navigation.

## Shell Findings

### Compact desktop and tablet

- The 270-pixel sidebar becomes a 48-pixel icon rail at 1024.
- Main content correctly receives the recovered width.
- The dense top bar remains a compressed desktop bar rather than choosing the controls needed for the current task.
- Icon-only navigation loses recognition support and depends heavily on tooltips.
- Page content can still overflow because tables and chart canvases keep desktop assumptions.

### Mobile

- Main content correctly starts at x = 0 beneath the 52-pixel header.
- A fixed bottom navigation appears, but page height and screenshots show content continuing beneath it.
- The shell reduces navigation labels, yet the route content itself usually keeps desktop information hierarchy.
- Important controls compete in the top bar while contextual scope is displaced into page content.

## Responsive Product Model

### Wide desktop: 1440 and above

- Manager operating workspace with persistent navigation, branch/date context, action queue, and inspectable live state.
- Multi-column composition is allowed when each region remains independently legible.
- Dense tables retain comparison and bulk action power.

### Compact desktop: 1280

- Same manager hierarchy with fewer simultaneous secondary panels.
- No page-level horizontal scrolling.
- Charts either keep a minimum viable plot area or switch to a ranked text/list representation.
- Secondary metadata moves into drawers or inspect panels, not below every row.

### Tablet: 1024 and similar landscape widths

- Room and manager workflows use a simplified rail or contextual sidebar.
- Touch target baseline is 44 x 44 for primary floor interactions.
- Split view is used only when both panes remain useful; otherwise detail becomes a sheet or full view.
- Tables select task-specific columns and keep any necessary horizontal scroll inside the table boundary.

### Mobile: approximately 390

- Role-specific companion, not the desktop dashboard stacked vertically.
- Home begins with current room/child/branch state, urgent exception, and one primary action.
- Search, scan, quick attendance, incident capture, message, and payment confirmation are first-class.
- Historical analysis, configuration, and broad comparison remain reachable but progressively disclosed.
- Bottom navigation reserves safe-area and content inset; keyboard and sheets cannot cover the active action.

## Component Requirements

1. Every fixed-format chart defines minimum plot and label space plus a non-chart fallback.
2. Every table defines compact-desktop columns, tablet columns, mobile summary fields, and overflow behavior.
3. Forms define desktop grid, tablet sectioning, mobile sticky action, draft recovery, and keyboard behavior.
4. Cards do not merely stack; each card family defines when it collapses, merges, becomes a row, or disappears behind progressive disclosure.
5. Toolbars define priority tiers so lower-value actions move into menus before labels truncate.
6. Fixed headers, rails, sheets, and bottom navigation reserve content insets and safe areas.
7. Touch density is a documented mode rather than a global font-size increase.
8. Responsive states preserve branch, room, child, date, filters, unsaved work, and scroll/selection continuity.

## Acceptance Criteria

A responsive flow is not accepted until:

- the primary action and critical state are visible without page-level horizontal scrolling;
- no interactive control is partially outside the viewport;
- fixed navigation does not cover content or form actions;
- charts preserve labels and meaning or intentionally change representation;
- data tables contain their own overflow and expose a mobile record model;
- 200% zoom and large text do not create overlapping or unreachable controls;
- keyboard, touch, and screen-reader order follow the visual hierarchy;
- reduced motion and offline/sync state remain visible at every size;
- the flow is verified in the in-app browser at desktop, compact desktop/tablet, and mobile dimensions;
- personal records are not captured in committed visual evidence unless explicitly approved and redacted.
