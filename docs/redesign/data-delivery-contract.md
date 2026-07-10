# Kiddz Online Data Delivery And Collection Contract

**Date:** 2026-07-10
**Status:** Territory-neutral architecture contract
**Production behavior changed:** No

## Purpose

This document defines how Kiddz Online loads, filters, sorts, pages, selects, updates, prints, and exports operational collections without removing access to records or leaking records outside the user's effective scope.

The contract exists because `all` currently means several different jobs:

- show an interactive history;
- populate a child, employee, parent, class, or food selector;
- load the current branch/room roster for attendance or a calendar;
- build a comparison matrix;
- gather an explicit export;
- preserve a legacy screen that exposed all rows.

Those jobs must not receive one generic optimization. A hard `take` on an existing `pageSize: "all"` call can make a screen look faster while silently hiding a medical record, parent, payment, alarm, or child. The redesign must preserve complete reach and parity while changing when and how records travel.

The reproducible scanner is:

```bash
pnpm tsx src/scripts/report-redesign-data-delivery.ts --summary
```

It is a triage tool. Category and query findings require manual workflow review before implementation.

## Evidence

### Current source baseline

Across 755 production source files, excluding generated code, scripts, and design labs, the scanner finds:

| Signal | Current count |
| --- | ---: |
| Calls that explicitly request `pageSize: "all"` | 85 |
| Production files containing those requests | 49 |
| Interactive-collection candidates | 54 |
| Form-option-source candidates | 16 |
| Operational-working-set candidates | 10 |
| Explicit export requests | 5 |
| Files implementing an `all` page-size branch | 25 |
| Client filter/pagination pipeline candidates | 12 |
| Client pipelines exposing an all-rows mode | 10 |
| Prisma `findMany` calls | 423 |
| `findMany` calls without a literal top-level `take` | 395 |
| Cursor-based `findMany` calls | 0 |

Twenty-seven legacy verifier files contain 91 `pageSize`/`all` assertions. These tests are evidence that full reach or legacy presentation was restored deliberately. They are not permission to keep sending every record to every client forever, and they must not be deleted merely to make a new pagination implementation pass.

The most frequent full-dataset request is `getEmployees` at 25 calls, followed by `getChildren` at ten and `getMedicalForms` at seven. Alarm pages frequently request both notification and history collections in full.

### Current shared table behavior

`src/components/shared/data-table.tsx` is a capable client table, but its contract assumes all relevant rows are already present:

- TanStack client filtering, sorting, and pagination are always enabled;
- page-size `all` expands to `data.length`;
- selection uses TanStack's default row identity unless the caller supplies another table entirely;
- the header checkbox selects the current page but is labelled `Select all`;
- bulk actions receive only selected loaded row objects;
- print receives pre-pagination loaded rows;
- export serializes pre-pagination loaded rows;
- filter, sort, page, and selection state are not a server-owned URL contract;
- no prop distinguishes visible-page, all-filtered, or explicit-ID selection.

This component can remain a legacy adapter during migration. It cannot become the selected system's universal collection primitive without a server mode and explicit semantics.

### Runtime and workflow evidence

- Daily Reports requests every matching report, serializes all rows, then filters and paginates in an 808-line client.
- Accounting requests all payments and all children before rendering a child-by-month matrix.
- Today legitimately needs a complete current operational roster, but currently renders the entire roster and repeated controls at once.
- Parent web eagerly maps deep daily, finance, absence, message, food, holiday, and notification histories.
- Children already supports URL-owned server pagination in its action and page, showing that the repository has a migration foundation.
- Explicit Settings export performs browser-triggered full-dataset reads instead of a durable output job.

Related evidence:

- `performance-runtime-audit.md` for route readiness, DOM density, bundle/source breadth, and scale fixtures.
- `authorization-scope-audit.md` for effective-scope and fail-closed requirements.
- `reliability-offline-audit.md` for cache, receipt, retry, idempotency, and conflict rules.
- `accessibility-runtime-audit.md` for table semantics, target size, focus, naming, and reflow.
- `localization-runtime-audit.md` for server/client sorting, collation, dates, money, and writing systems.
- `journey-state-audit.md` for completion truth and audit requirements.
- `parity-domain-ledger.md` for preserved legacy and native obligations.

### External implementation guidance

- [TanStack Table pagination](https://tanstack.com/table/latest/docs/guide/pagination) supports manual server pagination and requires the caller to provide row/page count semantics.
- [TanStack Table row selection](https://tanstack.com/table/latest/docs/guide/row-selection) allows controlled selection state and stable row identity; the product must still define what selection means beyond loaded rows.
- [Prisma pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination) distinguishes shallow page-number offset pagination from stable cursor pagination for deep/changing datasets.
- [WAI table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) favors native table semantics for static tabular information.
- [WAI grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) is a composite interaction pattern, not a decorative role to add to every table. It requires a complete keyboard model when used.
- [WAI grid and table properties](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/) informs row/column count and position when only part of a larger collection is present.

## Non-Negotiable Rules

1. **Complete reach is preserved.** Pagination, search, grouping, and history windows may change delivery; no authorized record becomes unreachable.
2. **The server owns dataset truth.** Authorization, effective scope, filter, sort, count, cursor, aggregate, and mutation target are resolved server-side.
3. **Visible does not mean complete.** The UI names whether an action affects this page, selected records, or all matching records.
4. **A count is contextual.** Every count names scope, filter, freshness, and whether it is exact, estimated, or unknown.
5. **Selection is stable.** Record IDs and a query snapshot replace row indexes.
6. **Exports are outputs, not giant pages.** Large output work is authorized, durable, cancellable where safe, and downloadable when complete.
7. **Operational sets may be complete only inside a real boundary.** A current room roster can be complete; the organization history is not a room roster.
8. **No client receives records merely to hide them.** Branch, role, assignment, parent, medical, and financial scope are applied before serialization.
9. **Loading cannot change factual meaning.** Partial, stale, loading, and complete states are distinct.
10. **Legacy/native compatibility is adapted, not amputated.** Old routes and payloads continue through a compatibility layer until their consumers are migrated and verified.

## Dataset Classes

Every collection declares one class. The class determines delivery, selection, freshness, and scale behavior.

### 1. Interactive collection

Examples: Children, Daily Reports, medical forms, calls, payments, assessments, staff directories, alarms, sent messages.

Contract:

- server filter, sort, and page/window;
- URL-owned query state where the view can be revisited/shared;
- explicit total or `hasNextPage` semantics;
- stable row IDs;
- bounded row projection;
- detail loaded separately;
- print/export uses the server query, not loaded rows unless explicitly labelled `Current page`.

### 2. Form option source

Examples: child picker in a report, employee picker in an incident, parent/recipient picker in Messages.

Contract:

- initial selected option is always hydrated even when outside the first search window;
- empty query returns recent/relevant/assigned options, not every organization record;
- typeahead is server-authorized and debounced/cancellable;
- option projection contains only fields required to disambiguate safely;
- keyboard and screen-reader combobox behavior is complete;
- offline behavior is explicit and never substitutes a stale unauthorized directory.

### 3. Operational working set

Examples: today's room roster, branch attendance, current staff cover, one-day food calendar, one class heatmap.

Contract:

- the set can be complete only after branch/room/class/date/assignment scope is explicit;
- the response includes `asOf`, revision, expected count, and completeness state;
- unknown or partially loaded children/staff remain visible as unknown, not absent/present;
- grouping/progressive rendering may reduce DOM without changing the set;
- live updates reconcile by stable ID and revision.

### 4. Comparison grid

Examples: child-by-month accounting, rota, occupancy, staff cover.

Contract:

- row and column axes are independently scoped;
- server aggregates cells and totals;
- the visible row window is bounded;
- sticky headers preserve context;
- details load on demand;
- horizontal scroll belongs to the grid, not the page;
- accessible row/column counts and positions reflect the larger dataset when windowed.

### 5. History or feed

Examples: parent daily history, messages, audit events, alarms, child timeline.

Contract:

- cursor pagination with deterministic order and unique tiebreaker;
- recent/relevant window first;
- new events do not duplicate or reorder already-read history invisibly;
- unread/seen state is server-owned;
- jump-to-date/search is a server query, not a full client scan;
- archive reach remains complete.

### 6. Reference/configuration set

Examples: a small fixed status list, organization branches, active school years, configured assessment types.

Contract:

- full reads are allowed only with a written bounded-domain invariant;
- response selects minimal fields;
- scope and cache lifetime are explicit;
- growth crossing the invariant moves the source to a searchable option contract.

### 7. Explicit export/output

Examples: regulatory package, payment export, medical report bundle, roster spreadsheet.

Contract:

- server reauthorizes the query and fields at job start;
- the job stores canonical query/scope, requester, start/finish time, state, and output metadata;
- progress names stages without claiming records are complete early;
- large output streams or executes in background;
- retry is idempotent and does not create ambiguous duplicate artifacts;
- output has retention, expiry, audit, and revocation policy;
- downloaded content is localized/formatted only after canonical values are fixed;
- the existing export routes remain available through adapters until parity fixtures pass.

### 8. Background sweep

Examples: alarm generation, scheduled contract/assessment checks, migration verification.

Contract:

- batch/cursor processing with resumable checkpoints;
- organization/scope partitioning;
- idempotent generation keys;
- memory and transaction bounds;
- partial-failure reporting;
- no UI request waits for an organization-wide sweep.

## Canonical Query Envelope

The final names may adapt to repository conventions, but every server-owned collection needs equivalent semantics:

```ts
type CollectionQuery<Filter, Sort> = {
  scope: {
    organizationId: string;
    branchId?: string;
    roomId?: string;
    operationalDate?: string;
  };
  filter: Filter;
  sort: Sort[];
  window:
    | { mode: "offset"; page: number; pageSize: number }
    | { mode: "cursor"; after?: string; before?: string; limit: number }
    | { mode: "working-set"; boundary: string };
  snapshot?: string;
};

type CollectionResult<Row> = {
  rows: Row[];
  scope: {
    organizationId: string;
    branchId?: string;
    roomId?: string;
  };
  window: {
    mode: "offset" | "cursor" | "working-set";
    page?: number;
    pageSize?: number;
    nextCursor?: string;
    previousCursor?: string;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  count: {
    value?: number;
    kind: "exact" | "estimated" | "unknown";
  };
  snapshot: string;
  asOf: string;
  completeness: "complete" | "partial" | "stale";
};
```

Client-supplied organization IDs are never trusted as authorization. The server derives effective scope from session/capability/assignment and treats query scope as a requested narrowing only.

### Foundation implementation

`src/lib/collection-contracts.ts` now provides the territory-neutral types and runtime invariants for:

- requested versus resolved scope;
- offset, cursor, and working-set windows;
- exact, estimated, and unknown counts;
- complete, partial, and stale collection results;
- explicit-ID and all-matching selections;
- operation result accounting;
- bounded window normalization with an explicit `wasAdjusted` signal;
- stable ID normalization and selection/count/receipt validation.

`src/scripts/verify-collection-contracts.ts` covers valid and adjusted windows, mutually exclusive cursors, stable ID handling, invalid/valid selections, count invariants, and accepted/partial operation receipts. No production route consumes the types yet; adoption remains a complete-workflow migration so compatibility behavior cannot change accidentally.

`src/lib/collection-state.ts` adds the request-state reducer for future controllers. It preserves a usable result while refresh is pending, ignores success/failure from superseded request IDs, retains rows and marks them stale after refresh failure, distinguishes an initial blocking failure from a refresh warning, and honors server-reported stale completeness. `src/scripts/verify-collection-state.ts` proves those transitions. This is deliberately framework-neutral so React screens, server-action adapters, and native-facing clients can share the same truth model without importing presentation.

## Pagination Decision

### Offset/page-number pagination

Use when:

- users need to jump to a known shallow page;
- the collection changes slowly enough for page-number comprehension;
- an exact count is operationally useful and affordable;
- stable ordering includes a unique tiebreaker.

Candidate routes: Children, staff directory, medical forms, payments, assessments, calls.

### Cursor pagination

Use when:

- history is deep or changes while being viewed;
- next/previous continuity matters more than jumping to page 37;
- created/updated time plus ID provides deterministic order;
- the count is expensive or less important than `more`.

Candidate routes: Messages, alarms, child timeline, parent history, audit history, notifications.

### Working-set delivery

Use when the complete current scope is itself the task, such as one room's attendance. It is not represented as page 1 of an arbitrary list. It carries completeness and revision so the user can distinguish `all 30 expected children loaded` from `27 rows currently available`.

## Filter, Sort, Search, And URL Contract

- Canonical filter and sort keys are typed and allowlisted; raw client field names do not become arbitrary database order/filter input.
- Search normalizes input but preserves canonical stored values.
- Locale-sensitive display is not allowed to make server/client order disagree. Canonical sort and display collation rules are named.
- Filters that define the dataset live in URL search parameters on desktop list routes.
- Temporary presentation preferences, such as column width, may remain local and scoped.
- Changing a dataset filter resets an invalid cursor/page and explains any cleared selection.
- Empty, invalid, stale, or unauthorized URL state resolves visibly and fail-closed.
- A shared/saved URL never contains protected record content or bearer credentials.

## Selection Contract

Every selection control declares one of three modes:

### Visible-page selection

`Select 25 on this page` selects the stable IDs currently rendered. Moving pages preserves or clears them according to the workflow's explicit policy. The label never says only `Select all`.

### Explicit-record selection

The client stores stable IDs across pages. The server reauthorizes every ID at action time and returns accepted, denied, stale, and failed counts. Row indexes are prohibited as identity.

### All-matching selection

`Select all 2,431 matching records` stores a server query snapshot plus explicit exclusions, not 2,431 browser rows:

```ts
type CollectionSelection =
  | { mode: "ids"; ids: string[] }
  | {
      mode: "all-matching";
      queryToken: string;
      snapshot: string;
      excludedIds: string[];
    };
```

Before a consequential bulk action, the server returns an impact preview with count, scope, denied/stale records, consequence, and reversal/correction path. A stale snapshot requires review rather than silently targeting a new dataset.

## Bulk Action Contract

- Action availability is based on capabilities and row state, not merely a visible button.
- Mixed-state selection reports eligible/ineligible counts before commit.
- Medical, safeguarding, finance, permission, and destructive bulk actions require review and server confirmation.
- Mutation requests carry operation ID/idempotency key and expected revisions where applicable.
- Completion returns an operation receipt with succeeded, failed, skipped, denied, and stale targets.
- Partial success is not a generic success toast.
- Undo is offered only when the domain operation is truly reversible; otherwise use authorized correction/reversal.
- Audit records preserve query snapshot, actor, scope, intent, and result without copying unnecessary protected content.

## Count And Aggregate Contract

- The label names what is counted: `43 active children in Karakol Druz`, not `43 total`.
- Exact counts are used for compliance, selection impact, financial reconciliation, and exports when correctness requires them.
- Estimated counts are visibly marked and never drive legal/compliance completion.
- Unknown counts use `More results`/`hasNext`, not a fake zero.
- Aggregates are computed from the same authorization, filters, operational date, and revision as the collection.
- A dashboard total and drilldown cannot query different stores or scopes.
- Zero, no data, unauthorized, not configured, and not yet loaded are distinct states.

## Form Option Contract

The selected async picker must support:

- stable ID value and readable label;
- contextual disambiguation, for example child number, class, and branch;
- selected-value hydration by ID;
- server search with cancellation and stale-response protection;
- recent/assigned/relevant initial options;
- loading, empty, denied, offline, and error states;
- keyboard navigation, active-descendant or equivalent combobox semantics, and announced result count;
- creation only where the domain permits it;
- no full protected directory in client HTML or cache.

High-risk forms can lock an existing target after consequential data is entered, or require explicit review when the target changes.

## Comparison Grid Contract

Accounting, occupancy, and rota need a grid model rather than client-side list pagination:

- row window, column window, and aggregate summary are separate server queries when useful;
- visible cells reserve dimensions and use tabular numerals;
- current row/column headers remain visible;
- the accessible implementation chooses native table or a complete ARIA grid based on actual keyboard interaction;
- virtual/windowed rows expose total count and position when the accessibility stack supports it;
- focus is restored to a stable record/cell after detail closure or refresh;
- current edits remain pinned during reconciliation;
- CSV/PDF/export is generated from the canonical query, not the visible window.

## Freshness, Live Updates, And Conflict

- Every current-state collection includes `asOf` and a revision/snapshot token where stale decisions matter.
- A live insert is announced and placed according to stable sort; it does not move a pressed control.
- Updated rows reconcile by ID and revision.
- Deleted/denied rows leave a clear tombstone or removal notice when context matters.
- Selection against changed rows becomes stale and is reviewed before commit.
- Pagination caches are invalidated by organization, branch, role, assignment, and query revision.
- Offline snapshots are visibly stale and follow the protected-cache policy.
- The service worker cannot replay a protected collection after logout or scope loss.

## Authorization And Privacy

- The collection query starts after `requireOrg`/capability/effective-scope resolution.
- Record scope is applied in the database query, not by client filtering.
- Counts, search suggestions, empty states, and typeahead timing must not reveal unauthorized record existence.
- Parent projections remain child/guardian scoped and field minimized.
- Clinical and financial projections contain only fields needed for the current job.
- Export scope and fields are independently authorized.
- Cursor/query tokens are opaque, signed or server-owned, expiry-bound, and contain no trusted authorization decision from the client.
- Observability records route/query class, counts, durations, and result category without names, notes, medical content, message text, payment references, or attachment URLs.

## Accessibility And Responsive Behavior

- Native tables are the default for read/comparison; `grid` is used only with its complete composite keyboard model.
- Header associations, sort state, row count, visible row positions, selection state, and bulk-action context are programmatically available.
- Pagination controls are named and expose current position.
- Loading preserves table/list headings and geometry.
- Focus does not reset to the page start when filtering, paging, or mutating.
- Result count and material dataset changes are announced concisely.
- Mobile transforms comparison tables into summary records or a focused workspace; it does not squeeze columns.
- Tablet/mobile option pickers use large targets and do not require hover.
- Virtualization is accepted only after keyboard, screen-reader, zoom, selection, and focus restoration fixtures pass.
- Export/print completion is announced and remains available from the originating task.

## Legacy And Native Compatibility

Existing `pageSize: "all"` contracts migrate in two stages:

1. **Compatibility stage:** the existing action and legacy route continue to accept `all`; the new canonical query service supplies complete reach using the appropriate dataset class. Existing verifiers remain green.
2. **Canonical stage:** redesigned routes use bounded query envelopes, async options, working sets, or output jobs. New parity tests prove every legacy record/action remains reachable. Only then can old presentation-specific assertions be revised.

Installed native consumers retain versioned response shapes. Pagination metadata may be added compatibly or introduced under a versioned endpoint; an existing array response cannot silently become a partial array.

Legacy aliases continue to resolve to the canonical filtered state, record, or output workflow. A redirect cannot discard ID, date, branch, type, status, or action intent.

## Selected-System Component Contract

The final component library needs separate primitives rather than one universal `DataTable`:

### `CollectionController`

Owns URL query state, server request lifecycle, snapshot, page/cursor, count, stale/error/retry state, and privacy-safe timing.

### `DataTable`

Renders already-authorized rows and controlled sort/selection/pagination state. Supports manual server mode and stable `getRowId`. Does not fetch or export by itself.

### `RecordList`

Touch/compact projection of the same query and selection contract. State, consequence, source, and primary action remain visible.

### `AsyncRecordPicker`

Server-search option source with selected-value hydration and complete combobox behavior.

### `ComparisonGrid`

Windowed two-dimensional operational tool with explicit keyboard, focus, row/column context, and aggregate contracts.

### `SelectionBar`

Names selection mode and count, supports page/all-matching transitions, exposes exclusions, and requests consequence previews.

### `ExportJobAction`

Creates and tracks a durable authorized output receipt. It never serializes the loaded table rows unless explicitly configured as `Export current page`.

The existing shared table remains available for unchanged legacy surfaces during migration. Production pilot routes move one complete workflow at a time.

## Representative Fixtures

| Fixture | Data scale | Acceptance |
| --- | --- | --- |
| Children directory | 5,000 records, duplicate names, long names, multiple branches | Server search/page/sort, stable IDs, exact scope, direct record reach, export all matching |
| Daily Reports | 5,000 history rows, attachments, mixed draft/submitted | URL filters, server window, page and all-matching selection, durable bulk submit receipt |
| Current room attendance | 30 expected children, one late sync, one scope denial | Complete working-set truth, unknown state preserved, revision conflict surfaced |
| Medical forms | 10,000 records, restricted roles, mixed types/status | No cross-scope count/search leak, deterministic page order, detail lazy, audit preserved |
| Accounting grid | 1,000 children x 12 months, 5,000 payments | Bounded row window, server totals, stable focus, exact export, no page overflow |
| Messages | 10,000 messages with concurrent arrivals | Cursor continuity, unread truth, no duplicates, stable selection/read state |
| Parent history | Three children, multi-year domain histories | Current summary first, scoped cursor windows, native compatibility |
| Async child picker | 5,000 children, selected archived/current values | Selected value hydrates, search cancellable, no full directory shipped |
| Export | 100,000 authorized rows, interrupted connection | Durable job, progress, retry, expiry, audit, no giant browser response |
| Scope change | Branch switch, role loss, logout during loaded list | Cache cleared/invalidated, selection revoked, no stale protected replay |

## Migration Order

1. Add canonical query/selection/result types and privacy-safe timing without changing route behavior.
2. Add manual server mode and stable row IDs to the selected collection primitives.
3. Migrate Daily Reports as the first interactive-list proof: query, URL state, selection, bulk submit, print/export parity.
4. Migrate async child/employee option sources in the same workflow.
5. Migrate Accounting as the first comparison-grid proof.
6. Migrate Messages/alarms/parent history as cursor proofs.
7. Migrate current room attendance as the complete working-set proof.
8. Move Settings export to durable output jobs with receipts.
9. Roll the proven patterns across medical, assessment, staff, calls, absent reports, and remaining legacy surfaces.
10. Revise legacy assertions only after replacement parity evidence demonstrates complete reach.

## Release Gate

A collection migration is accepted only when:

- dataset class and effective scope are named;
- full reach is demonstrated at representative scale;
- query/filter/sort/window state is deterministic and authorized;
- visible-page, explicit-ID, and all-matching selection language is unambiguous;
- stable row identity survives sort, filter, page, live update, and refresh;
- counts and aggregates match the same snapshot/scope;
- bulk actions reauthorize, preview consequence, and return operation receipts;
- print/export semantics name current page, selected, or all matching;
- loading, empty, partial, stale, denied, offline, conflict, and error states exist;
- keyboard, screen-reader, zoom, mobile, and focus-return behavior passes;
- cache/logout/scope-change fixtures pass;
- legacy URLs, database behavior, audit trails, verifier intent, and native contracts remain intact;
- route/query/payload evidence meets `performance-runtime-audit.md` budgets.

## Current Decision

The redesign will not expose `All` as a universal page-size option. It will expose complete reach through the correct contract: server pagination for directories, cursors for history, complete scoped working sets for live operations, async search for selectors, bounded windows for grids, and durable jobs for outputs.

This is a delivery change, not a capability reduction. Every authorized record and legacy action remains reachable, and any migration that cannot prove that remains behind the compatibility adapter.
