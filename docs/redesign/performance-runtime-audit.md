# Kiddz Online Performance And Delivery Architecture

**Date:** 2026-07-10
**Status:** Territory-neutral runtime and source baseline
**Production visual UI changed:** No
**Build measured:** `WZpaVFGUMIcx9VwDs8l4F`

## Purpose

This audit defines how the redesign must stay fast as an operational system, not merely how it should score in one lab run. It separates four kinds of evidence that must never be conflated:

1. **Field experience:** real-user LCP, INP, and CLS at the 75th percentile, segmented by device and route family.
2. **Controlled lab traces:** cold and warm navigation under named network and CPU conditions.
3. **Authenticated route readiness:** wall-clock evidence that a real route reached its main workspace in the local production build.
4. **Static/build evidence:** source architecture and build artifacts that identify likely delivery, hydration, data, and rendering risks.

Only the last two exist today. This document does not manufacture Core Web Vitals from wall-clock navigation or infer per-route transfer from all files on disk.

The performance scanner is reproducible:

```bash
pnpm tsx src/scripts/report-redesign-performance.ts --summary
```

Run it against a fresh production build. The full form, without `--summary`, preserves file-level query and asset triage.

## Standards And Evidence

Primary guidance:

- [web.dev Core Web Vitals](https://web.dev/articles/vitals) defines the current field metrics and good thresholds: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile.
- [How Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds) supports percentile and device segmentation rather than one convenient average.
- [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading) informs client-component and library deferral.
- [Next.js data fetching](https://nextjs.org/docs/app/getting-started/fetching-data) informs parallel reads, streaming, and route-level loading boundaries.
- [Next.js font optimization](https://nextjs.org/docs/app/getting-started/fonts) informs self-hosted font loading and layout stability.
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist) informs bundle, image, caching, streaming, and production verification.
- [React Suspense](https://react.dev/reference/react/Suspense) supplies the rendering boundary contract; a fallback must preserve page identity and stable geometry.
- [Prisma pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination) distinguishes offset and cursor pagination.
- [Prisma relation queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries) supports explicit payload and relation-loading decisions.

Product evidence:

- `reliability-offline-audit.md` for service-worker, cache, retry, receipt, and conflict boundaries.
- `accessibility-runtime-audit.md` for reflow, focus, table, target, and complete-process requirements.
- `cross-device-synthesis.md` for route responsibility by surface.
- `journey-state-audit.md` for server-owned completion and recovery.
- `authorization-scope-audit.md` for data-scope requirements that pagination and caching must preserve.
- Authenticated Agent Browser checks on Dashboard, Today, Children, Accounting, Daily Reports, New Child, Calls, and Settings.
- Manual source inspection of dashboard loaders, Daily Reports, Accounting, Today, Child enrollment, and the parent portal.

## Evidence Boundaries

The authenticated runtime measurements below are local, warm, loopback navigations to a production build through the Agent Browser at an approximately 1274-pixel content viewport. They include browser-automation bridge overhead and may benefit from operating-system, browser, database, Next.js, and service-worker caches. They are useful for route-to-route comparison, not for claiming public-internet speed.

The browser runtime did not expose a valid Performance Timeline. Consequently:

- no LCP, INP, CLS, TTFB, FCP, long-task, or resource-byte claim is made;
- the 273-290ms tab-action observation is not reported as INP;
- DOM geometry samples are not reported as CLS;
- file totals under `.next` are not reported as per-route transfer;
- Prisma scanner findings are candidates until their semantic scope is inspected.

## Current Source And Build Baseline

### Application architecture

| Signal | Current evidence | Interpretation |
| --- | ---: | --- |
| Production source files | 755 | Excludes generated code, scripts, and design labs |
| App pages | 244 | Broad operational and compatibility surface |
| Client files | 192 | Many client islands even though only three pages declare `use client` directly |
| Route loading files | 70 | 224 pages inherit a route loading boundary |
| Explicit Suspense uses | 2 | Secondary data is rarely isolated inside a route |
| Dynamic imports | 3 | Large forms and optional tools are mostly eager in their owning client bundle |
| `Promise.all` calls | 198 | Parallelism exists and must be preserved where reads are independent |
| `useEffect` calls | 42 | Small enough for manual hydration/data-after-render review |
| Native `<img>` uses | 22 | Requires dimensions, loading, source, and security review |
| `next/image` uses | 21 | Optimization exists but is not the universal media contract |
| Prisma `findMany` calls | 423 | Broad data-access surface |
| `findMany` without a top-level `take` | 395 | Triage signal; date, branch, ID, export, and reference-list bounds still require manual classification |
| Cursor-based `findMany` | 0 | No reusable cursor contract exists yet |

The largest client files are operationally important, not decorative experiments:

| Client source | Bytes | Lines | Delivery implication |
| --- | ---: | ---: | --- |
| `children/child-form.tsx` | 109,415 | 2,641 | Steps render progressively, but validation, uploads, maps, finance, review, and every step ship together |
| `daily-reports/daily-report-form.tsx` | 70,309 | 1,732 | High-frequency care entry carries a large client implementation |
| Notification settings | 65,658 | 1,826 | Administrative editor needs route-local deferral |
| Legacy users | 59,048 | 1,689 | Dense compatibility administration should not affect the everyday shell |
| Classes client | 54,299 | 1,316 | Shared roster/class behavior needs smaller feature boundaries |
| Employee form | 52,726 | 1,330 | Wizard and attachment code should load by task stage |
| Holidays client | 46,332 | 1,262 | Calendar/editor dependencies should remain route local |
| Children page client | 45,915 | 1,315 | Search, table, bulk actions, exports, and mobile projection are one island |
| Legacy access settings | 44,323 | 1,230 | Compatibility tooling must remain isolated from core operations |
| Parent portal client | 43,962 | 1,240 | Multiple parent domains and deep histories hydrate together |

### Build artifacts

| Artifact set on disk | Files | Raw | Gzip | Meaning |
| --- | ---: | ---: | ---: | --- |
| All built JavaScript chunks | 536 | 7,723,607 B | 2,487,383 B | Total build inventory, not one navigation |
| App-route JavaScript chunks | 417 | 2,572,555 B | 860,895 B | Sum across all app routes |
| Shared/non-app JavaScript chunks | 119 | 5,151,052 B | 1,626,488 B | Shared and framework inventory; route attribution is still required |
| CSS | 6 | 342,139 B | 56,257 B | Largest file is 203,294 B raw / 33,433 B gzip |
| Fonts | 29 | 690,488 B | 690,971 B | Built-route inventory includes design labs; not all files necessarily transfer on one route |
| Selected public assets | 12 | 128,325 B | 51,099 B | Includes generated `sw.js` at 95,744 B raw / 20,990 B gzip |

The largest shared JavaScript chunk is 684,445 bytes raw / 282,736 bytes gzip. Its module ownership must be resolved with a route-aware analyzer before any deletion or split is proposed.

Library source reach is also broad: Lucide appears in 172 files, TanStack Table in 41, React Hook Form in 19, Zod in 18, Radix in 19, Recharts in eight, and React PDF in six. This is not proof that all code ships together. It is a requirement to keep these imports route local and measure the final route graph.

## Authenticated Runtime Baseline

### Route readiness

`Ready` means navigation completed and the route's main workspace was visible. It is not LCP.

| Route | First observed ready | Stable repeat samples | Runtime note |
| --- | ---: | --- | --- |
| Dashboard | 1,355ms | 834, 827, 844ms | Stable warm route after initial visit |
| Today | 748ms | Not repeated in this pass | Largest sampled document height and interaction surface |
| Children | 717ms | Not repeated in this pass | Page width reached 1,544px at this viewport |
| Accounting | 1,546ms | 738, 760, 758ms | Large eager child-by-month matrix |
| Daily Reports | 3,801ms after one load-event timeout | 726, 1,332, 761ms | Variable readiness and unusually high non-script asset count require a cold trace |
| New Child | 665ms | Not repeated in this pass | Large client form but only the current step mounts |
| Calls | 816ms | Not repeated in this pass | Table route, page width reached 1,442px |
| Settings | 642ms | Not repeated in this pass | Broad capability index |

The audited production tab emitted zero captured console warnings or errors after route sampling.

### Runtime density

| Route | DOM elements | Elements in `main` | Document height | Interactive elements | Inline SVG | Tables |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Dashboard | 796 | 426 | 1,581px | 51 | 78 | 0 |
| Today | 2,316 initially | 1,089 initially | 4,210px | 266 | 245 | 0 |
| Children | 1,969 | 765 | 1,308px | 329 | 198 | 2 |
| Accounting | 2,540 | 2,136 | 3,409px | 164 | 53 | 1 |
| Daily Reports | 968 | 511 | 1,506px | 102 | 117 | 1 |
| New Child | 642 | 219 | 1,083px | 77 | 60 | 0 |
| Calls | 533 | 123 | 794px | 52 | 61 | 1 |
| Settings | 589 | 225 | 792px | 49 | 56 | 0 |

Today retained the same 4,210px document height and 4,158px main height while total elements moved from 2,316 at the initial sample to 1,452 at 250ms and 750ms. Dashboard added ten elements without changing geometry; Daily Reports remained stable. This is coarse post-navigation DOM churn evidence, not layout-shift evidence. A PerformanceObserver-based CLS trace is still required.

Asset-request counts further distinguish the routes: Dashboard observed 62 resources, Today 55, Children 64, Accounting 60, Daily Reports 94, New Child 60, Calls 59, and Settings 77. Daily Reports included 49 resources outside the script, stylesheet, and font categories. URL/byte attribution was not available in the browser capability, so the cause remains a trace question rather than an image claim.

## Confirmed Workflow Risks

### P01 - Eager list ownership

Daily Reports calls `getDailyReports({ pageSize: "all" })`, serializes every matching report to the client, then searches, filters, sorts, selects, and paginates in an 807-line client component. The visible ten-row page therefore does not bound server work, RSC payload, serialization, or hydration input.

**Required change:** URL-owned server filtering/sorting/pagination, explicit total/selection semantics, and an export path separate from the interactive list. Preserve bulk draft submission and legacy IDs.

### P02 - Accounting matrix grows with the nursery

Accounting requests all payments, the complete summary, branches, classes, and all children in parallel. The client builds a child-by-school-year-month matrix and detail drawers in one island. With the current fixture, the main region already contains 2,136 elements.

**Required change:** server-owned query windows, branch/class/year scope, row-window or paginated child sets, aggregate endpoints, and lazy detail history. The matrix remains a comparison tool; it must not be replaced by decorative cards.

### P03 - Today renders the entire decision surface

Today maps the entire filtered child roster and every alert at once. Repeated status icons and actions contribute to 266 interactive elements and 245 inline SVG nodes. The source also contains broad `transition-all` and width animation that the motion contract already prohibits.

**Required change:** keep current room state and urgent work immediately visible, group and progressively reveal long rosters, minimize repeated icon DOM, and animate only stable compositor properties. Never hide unsafe, unknown, or unconfirmed attendance behind pagination.

### P04 - Large forms are progressive in DOM but monolithic in delivery

Child enrollment correctly mounts only the current wizard step, preserving a manageable 642-element runtime. However, all six steps, map logic, upload logic, finance entries, draft persistence, validation, and review live in a 109KB client source. Daily Report and Employee forms have the same delivery shape.

**Required change:** retain one form state and draft contract while splitting stage UI and optional dependencies into stable route-local modules. Prefetch only the likely next step after the current step is usable.

### P05 - Parent history is an unbounded companion experience

The parent portal maps complete daily, finance, absence, message, food, holiday, and notification arrays inside one 1,240-line client island. Prior runtime evidence showed 213 daily reports rendered eagerly.

**Required change:** a current-child summary first, domain tabs or routes with server windows, and explicit history pagination. Preserve the existing parent-safe projection and installed native contracts.

### P06 - Query bounds are inconsistent

The scanner found 423 `findMany` calls and 395 without a top-level `take`. The largest file-level candidates are Dashboard (24), legacy users (20), alarms (19), contract-alarm generation (15), Messages (13), Classes (12), notification templates (12), Attendance (11), legacy access (11), and assessment-alarm generation (10).

Manual inspection shows why automatic deletion would be dangerous: Dashboard uses many parallel, organization/date/year/child-scoped sets to derive compliance, missing-record, and drilldown truth. Other calls use `id in [...]`, one operational day, or small configuration domains. Conversely, Daily Reports and Accounting explicitly request `pageSize: "all"` for interactive screens.

**Required change:** classify each call as bounded operational set, small reference set, aggregate, background job, explicit export, or unbounded interactive list. Add an intentional bound, cursor/window contract, or written bounded-domain invariant. Do not add arbitrary `take` values that silently remove records.

### P07 - Streaming is mostly route-wide

Seventy loading files cover 224 pages, but production source contains only two explicit Suspense boundaries and three dynamic imports. Route identity can appear, yet slower secondary modules generally do not reveal independently.

**Required change:** stream secondary evidence, history, detail, and export preparation behind geometry-stable boundaries. Safety status, page identity, active context, and the primary action stay in the first usable region.

### P08 - Build ownership is not route-attributed

Total build artifacts are measurable, but the current audit cannot say which route transfers or executes the largest shared chunks. The font inventory includes all built routes, including design labs.

**Required change:** add route-aware bundle attribution and cold network traces before final token, type, chart, PDF, or motion-library rollout. Final product routes must not pay for design labs, PDF tools, maps, rich editors, or optional charts unless used.

### P09 - Media has no single acceptance contract

Production source contains 22 native images and 21 `next/image` uses. Daily Reports showed the highest total request count, but available evidence cannot attribute bytes. Attachments, remote legacy photos, parent media, and PDF assets have different privacy and caching needs.

**Required change:** every media role defines dimensions/aspect ratio, source policy, placeholder, lazy/eager priority, compression, authorization, cacheability, failure state, and download behavior. Protected child media never enters a public or stale service-worker cache.

### P10 - Service-worker warmth can hide cold cost

The generated root-scoped worker contains broad runtime routes identified in `reliability-offline-audit.md`. Warm local navigation can therefore conceal network, stale-state, and authorization problems.

**Required change:** measure with service worker disabled, empty cache, warm cache, offline, stale revision, and post-logout fixtures. A fast stale or overbroadly cached response fails.

### P11 - No field or server trace closes the loop

There is no verified real-user CWV pipeline, route-specific bundle budget, server query trace, RSC payload budget, or slow-query acceptance fixture.

**Required change:** performance is a release signal with route family, role, device class, build, connection type, and privacy-safe organization scale. Instrumentation must not include child, parent, staff, medical, message, or financial content.

## Target Delivery Architecture

### 1. Stable shell and page identity

The first response exposes:

- one shell and one brand anchor;
- active organization/branch, role projection, and operational date;
- one H1 and route purpose;
- current safety/compliance state when the route owns it;
- the primary action or a truthful reason it is unavailable.

Navigation, fonts, icons, and notification plumbing remain small and common. Domain editors, charts, PDF generation, maps, uploaders, and legacy-admin tooling remain route local.

### 2. Server-first route slices

- Read and authorize on the server.
- Fetch independent critical reads in parallel.
- Fetch secondary panels in separate server components with stable Suspense fallbacks.
- Send the smallest typed client model needed for interaction.
- Keep filtering, sorting, pagination, and scope in the URL when they define the dataset.
- Never send protected records to the browser merely to hide or filter them client-side.

### 3. Deliberate client islands

Client boundaries own a real interaction: filter controls, selection, a form stage, a live roster operation, or a disclosure. They do not wrap whole pages by default. Shared client state is limited to one workflow boundary and preserves server revision, pending receipt, and recovery state.

### 4. Scale-aware data contracts

Every interactive collection returns:

- effective authorization scope;
- query/filter/sort contract;
- bounded rows or groups;
- total or `hasNextPage` only when semantically affordable;
- stable cursor or page key;
- server revision/as-of time where current state matters;
- selection semantics for visible, filtered, or all matching rows.

Offset pagination is acceptable for shallow admin lists requiring page numbers. Cursor pagination is preferred for deep histories, feeds, messages, alerts, and frequently changing collections. Exports execute as authorized background/output workflows, not `pageSize: "all"` browser screens.

### 5. Progressive operational density

- Safety, current attendance, ratio state, assigned urgent work, and primary actions are never delayed behind a convenience panel.
- Long rosters use grouping, section windows, or progressive rendering while preserving counts and unknown state.
- Tables retain semantic headers and keyboard behavior; virtualization is used only when its accessibility and selection model is verified.
- Large comparison grids expose a bounded row window and sticky context without page-level overflow.
- Histories open at the recent/relevant window and can reach the full archive.

### 6. Stable geometry and purposeful motion

- Server and client fallbacks reserve final layout geometry.
- Images reserve dimensions.
- Counters use stable numeric space.
- Row actions never appear by resizing the row.
- Motion uses transform/opacity, remains interruptible, and follows the reduced-motion contract.
- Live updates reconcile in place or announce a deliberate insertion; controls never move under the pointer.

### 7. Privacy-safe observability

Record only:

- route family and canonical action name;
- anonymous role/capability class;
- coarse organization-size band;
- device and connection class;
- build/version;
- duration, payload, query count, retry, and result category;
- Web Vital value and attribution that contains no record content.

Never record names, IDs exposed to support staff without need, note text, medical detail, message content, attachment URLs, payment references, or form values.

## Budgets And Gates

### Field budgets

At the 75th percentile, segmented at minimum by mobile and desktop:

| Metric | Good target | Release treatment |
| --- | ---: | --- |
| LCP | <= 2.5s | Core route family must meet target; regressions need ownership and rollback |
| INP | <= 200ms | High-frequency attendance, care, search, and finance actions are tracked separately |
| CLS | <= 0.1 | Safety state, live updates, images, fonts, tables, and motion receive attribution |

The program also reports p50 and p95 for diagnosis. A green average cannot hide a poor 75th percentile.

### Controlled lab budgets

Exact byte limits are calibrated after route attribution exists. Until then, the following are implementation gates:

- Cold and warm traces use named hardware, CPU, network, service-worker, cache, data-scale, role, and route fixtures.
- The shell and route identity render before secondary data.
- Every primary press paints feedback in the next frame; completion remains server-owned where required.
- No long task above 50ms is ignored on a high-frequency core flow; attribution and mitigation are required.
- Route-specific client JavaScript, RSC payload, images, fonts, CSS, and third-party code are reported separately.
- New dependencies must show the routes and interactions that pay for them.
- A design-lab, PDF, map, chart, or rich-editor dependency in an unrelated route is a build failure.

### Data budgets

- Interactive list reads are bounded by a named page/window/group size; `all` is reserved for proven small reference data or explicit server-side export/background work.
- Default interactive window: at most 50 records on comparison-heavy desktop and at most 25 on compact/touch projections, unless a measured workflow fixture proves another number.
- Database reads select only fields required by the projection.
- Expensive totals and aggregates are computed server-side, cached only within the authorization/freshness contract, and invalidated by source revision.
- Query count, database duration, returned-row count, and serialized RSC bytes are captured per route family without record content.
- No arbitrary cap may silently omit safety, compliance, financial, medical, or audit records.

### DOM and interaction budgets

- A standard 50-child fixture targets no more than 1,200 live DOM elements for the first usable operational workspace.
- More than 50 simultaneously visible records requires a documented pagination, progressive-render, grouping, or tested virtualization decision.
- Repeated row icons and hidden controls are counted; hidden DOM is not free.
- A route above 2,000 live elements requires an explicit scale trace and remediation decision before pilot release.
- Initial and post-hydration geometry is stable; DOM churn alone is investigated but not mislabeled as CLS.

### Media and type budgets

- The selected production typography loads only required families, scripts, weights, and subsets for the active route.
- Fonts use stable metrics/fallbacks and do not delay page identity.
- Each image declares dimensions or aspect ratio, source policy, priority, and failure state.
- Roster/history media below the initial window is lazy.
- Original attachments are not fetched to render a thumbnail.
- Protected assets obey the reliability cache/logout contract.

### Motion budgets

- Routine product motion targets compositor-only transform/opacity.
- No `transition-all` enters selected shared components.
- Repeating motion stops when offscreen, hidden, backgrounded, reduced, or no longer meaningful.
- Core flows are profiled under CPU slowdown; 60fps is a target, not an assumption.
- Motion never delays input, server confirmation, focus, or a safety-state update.

## Workflow Acceptance Fixtures

| Workflow | Scale fixture | Performance proof |
| --- | --- | --- |
| Today/readiness | 6 rooms, 120 children, mixed unknown/present/absent, live staff changes | Safety state and next action first; room expansion remains responsive; live update does not shift controls |
| Attendance | 30-child room, mixed states, interruption, retry, conflict | Explicit selection remains usable; one confirmation receipt; no duplicate write; recovery preserves states |
| Daily Reports | 5,000 report history, 30-child current room, photos and attachments | Server windowing; current search/filter in URL; recent row media lazy; export separate from list |
| Children | 5,000 children across branches, long names, photos, archived records | Authorized server search/page; stable selection; no page overflow; record open is not blocked by table hydration |
| Child enrollment | Six steps, map, photo, attachments, finance entries, restored draft | First step loads without later-step dependencies; next step prefetch is measured; draft and validation survive split boundaries |
| Accounting | 5,000 payments, 1,000 children, multi-year history | Server aggregates and bounded matrix rows; detail history lazy; numeric comparison remains keyboard-accessible |
| Messages | 10,000-message history, unread state, attachment | Cursor window; durable read state; send acknowledgement immediate; upload progress named |
| Parent portal | 3 children, multi-year reports/payments/messages | Current child summary first; domain history windowed; native payload compatibility preserved |
| Reports/export | Large authorized date range | Background/durable output; progress and cancellation policy; browser never receives the entire dataset to format |
| Offline/reconnect | Empty cache, warm cache, stale cache, offline, logout, role loss | No protected leakage; drafts distinguish local/server truth; retry/idempotency/conflict receipts verified |

## Migration Waves

### Wave 0 - Instrument before claiming improvement

1. Add privacy-safe field CWV reporting.
2. Add route-aware client/RSC/CSS/font/image attribution.
3. Add server route/action/query timing and row-count summaries.
4. Create cold/warm/service-worker-disabled fixtures and representative data scales.
5. Store baseline and budget deltas by build.

### Wave 1 - Bound proven eager experiences

1. Daily Reports server pagination/filter/sort and explicit export contract.
2. Accounting scoped matrix window and lazy detail history.
3. Parent portal domain history windows.
4. Children authorized server search/pagination consistency.
5. Message and alert cursor review.

### Wave 2 - Split high-value client islands

1. Child enrollment stage modules while preserving one form/draft contract.
2. Daily Report form sections and optional attachment/media tools.
3. Employee form stages.
4. Administrative editors and legacy tools isolated from the shell.
5. Route-local PDF, map, chart, and upload dependencies.

### Wave 3 - Stream the target UX

1. Shell, context, safety state, and primary action first.
2. Secondary evidence and history behind stable boundaries.
3. Progressive rosters and bounded comparison grids.
4. Live updates reconciled without control movement.
5. Motion and typography profiled on target hardware.

### Wave 4 - Enforce and regress

1. CI scanner diff and route bundle budgets.
2. Data-scale browser journeys.
3. Field CWV release dashboards.
4. Slow-query and long-task ownership.
5. Service-worker, logout, stale-data, and offline gates.

## Release Gate

A redesigned core route cannot replace production presentation until:

- its route family has a cold and warm trace under named conditions;
- field measurement is wired without protected content;
- server queries and returned rows are bounded or explicitly justified;
- route JavaScript, RSC, CSS, font, image, and third-party ownership is visible;
- loading and live updates preserve geometry, focus, and current state;
- long lists and histories pass representative scale fixtures;
- service-worker/cache state cannot make stale or unauthorized data look fast;
- accessibility, parity, database, legacy alias, and native contracts still pass;
- any budget exception names an owner, reason, expiry, and remediation path.

## Current Decision

The current build is usable enough for discovery, but it does not yet have the evidence required to claim a fast redesign. Warm local readiness is generally sub-second after first visit, while Daily Reports is variable and several routes eagerly ship or render far more data than their first viewport needs. The redesign will therefore treat instrumentation, bounded data, server-first projection, progressive rendering, and route-local dependencies as design-system architecture.

This decision is territory neutral. Daylight, Signal, or Carebook may change visual expression after selection; none may change these delivery, privacy, parity, or measurement gates.
