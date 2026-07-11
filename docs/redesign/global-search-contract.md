# Kiddz Online Global Search and Command Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral contract; production query and shell migration open
**Prototype:** `/design-lab/ia`
**Contract:** `src/lib/redesign-search-contracts.ts`

## Question

Can search make the restored product's breadth reachable without exposing a child, staff member, task, route, or write action outside the user's current capability and effective scope?

## Current Product Audit

The current shell has a useful command dialog, but its trust boundary is incomplete:

- `globalSearch` requires an organization and filters entity rows by organization ownership, but it does not consume assigned branch, room, child, or review scope.
- Children and four staff tables are queried independently, with no deterministic result order or cross-role identity contract.
- Static pages, workflows, quick actions, and empty-state suggestions render without a server-owned capability decision.
- Recent record names, routes, and raw search strings are stored in origin-wide `localStorage`. A shared browser, organization switch, or reduced role can retain sensitive names and stale destinations.
- Debouncing reduces requests but does not identify or cancel stale responses. An older result can replace a newer query.
- Errors are collapsed into the same visual state as zero authorized matches.
- Result counts and suggestions are not governed by the same scope decision as the protected destination.

This audit does not remove the current dialog or claim that an observed fixture is production authorization. It establishes the migration requirements.

## Executable Contract

### Request boundary

Every request carries:

- a unique request ID;
- the raw query and bounded result limit;
- one effective-scope revision;
- organization, scope kind, readable branches/rooms/records, writable branches, and one concrete write context;
- exactly one capability decision per candidate capability;
- server-owned candidates or a server query that produces the same candidate shape.

Production must reject stale request IDs or responses on the client and recompute capability and record scope on the server. Client filtering is presentation, never authorization.

### Candidate boundary

Every candidate declares:

- kind: owned work, record, action, or destination;
- canonical label, detail, path, domain, and same-origin route;
- organization and branch/room/record scope;
- required capability;
- read or write mode;
- search keywords, suggestion eligibility, and explicit priority.

Candidate IDs are unique. Routes are same-origin paths. Missing or conflicting capability policy fails closed.

### Scope rules

- Organization scope may read authorized candidates across the named organization.
- Assigned-branch scope sees only candidates in the active readable branch context.
- Assigned-room scope sees only named rooms and their records.
- Assigned-record scope sees only named records.
- Pending setup exposes no protected result.
- A write action appears only when its branch matches both the user's writable branches and the current concrete write context.
- `All branches (read-only)` never exposes a write action, even to an administrator.

No response exposes a hidden or denied result count. `moreAvailable` is computed only from authorized matches.

### Query and ranking rules

- Empty query returns bounded, authorized, non-sensitive suggestions. It does not replay raw search history from browser storage.
- One normalized character returns `TOO_SHORT`; protected records require at least two characters.
- Unicode is normalized with diacritic-insensitive matching while authored display text is preserved.
- Exact label, label prefix, word prefix, all-token match, and general containment have explicit descending relevance.
- Operational priority and kind weight break relevance ties; label and stable ID provide deterministic final ordering.
- Results are grouped as Owned work, Records, Actions, and Destinations after authorization and scope projection.

## Interaction Fixture

The IA lab consumes the projector instead of searching a role-prefiltered array:

1. Manager suggestions lead with urgent/forecast work and observed attendance.
2. `payment` returns the in-scope allocation task and Finance destination.
3. Teacher `payment` returns zero without revealing a hidden count.
4. Teacher `attendance` returns one owned task, one in-scope child, the observed-attendance action, and Children.
5. Administrator `All branches (read-only)` can find cross-branch work but cannot find `Register a child`.
6. Selecting a result closes search, opens the canonical domain/path, announces the change, and focuses the canonical-path heading.
7. `Control/Command + K` opens search; Escape closes it and returns focus to the trigger.

## Browser Evidence

Agent Browser verified 12 focused states across `1280 x 800`, `390 x 844`, and `320 x 568`:

- manager closed, suggested, and `payment` states;
- teacher denied `payment` and grouped `attendance` states;
- administrator all-branches denied `register` and cross-branch `leo` states;
- mobile suggested, `alma`, one-character, `payment`, and source-continuity states.

Every measured state retained one H1, no horizontal overflow, no unnamed visible control, no undersized visible target, and zero axe violations or unresolved findings after fixes. Browser validation also closed the previously unimplemented `Command/Control + K` affordance, role-group semantics, two contrast defects, short-query layer evidence, and post-selection focus loss. A 390px viewport capture confirmed the grouped dialog reflows without clipping or hiding canonical paths.

## Additive Production Migration

1. Replace organization-only entity search with one server endpoint that derives effective capability and record scope from the authenticated session.
2. Use cancellable request IDs and scope revisions; ignore stale responses after query, role, branch, assignment, or organization changes.
3. Project pages, saved views, work, records, and actions from server-owned capability decisions. Static client arrays cannot grant reach.
4. Remove raw sensitive query/record recents from origin-wide `localStorage`. If recents are approved, store server-owned actor/tenant-scoped opaque references with expiry and reauthorization.
5. Query canonical people identity or explicitly deduplicate role records before ranking.
6. Return structured unavailable/error states without making authorization failures enumerable.
7. Preserve every authorized legacy destination through the route compatibility registry and carry source context into canonical routes.
8. Run direct URL, search, work queue, and alias access through the same server authorization decision before migrating the shell.

## Parity Boundary

This slice changes only territory-neutral contracts and the IA design lab. It changes no production search query, shell dialog, route, action, Prisma model, database row, permission, export, legacy alias, native payload, or restored capability.

The current production dialog remains available until the server endpoint, privacy migration, capability projection, stale-response handling, route continuity, and representative-scale fixtures pass together.

## Open Gate

- Define canonical person identity across teacher, nurse, doctor, manager, parent, and user stores.
- Implement server effective-scope resolution for search, including record relations and imported explicit denies.
- Approve a privacy policy for recents on shared and managed devices.
- Add representative 5,000-child, 1,000-staff, duplicate-name, Arabic/Latin, stale-response, organization-switch, and role-reduction fixtures.
- Validate search terminology, ranking, and empty suggestions with managers and practitioners.
- Prove screen-reader, 200% zoom, IME, RTL, keyboard, and physical-device behavior in the selected visual system.

## Decision

Use this contract for the selected-direction shell and command launcher. Search is a protected server projection with a concrete scope and capability decision, not a client-side convenience index.
