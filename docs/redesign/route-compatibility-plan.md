# Kiddz Online Route Compatibility Plan

**Date:** 2026-07-10
**Status:** Territory-neutral contract verified; production navigation unchanged
**Code contract:** `src/lib/redesign-route-compatibility.ts`
**Verifier:** `src/scripts/verify-redesign-route-compatibility.ts`

## Purpose

The redesigned information architecture cannot become a second application layered beside the restored product. It must give every existing staff route, legacy PHP alias, deep link, native endpoint, print/export entry, and authorized contextual link one deliberate path into the new structure.

This plan separates three facts that must not be conflated:

1. The desired user-facing domain and label.
2. The route that safely exists today.
3. A future target root that may still be an unvalidated hypothesis.

No production navigation or route changed in this slice. In particular, `/rooms`, `/team`, `/finance`, and `/reports` are not created or advertised as live roots.

## Verified Route Baseline

The executable census currently finds 332 App Router page/handler routes across staff web, public auth, parent, API, native compatibility, and design-lab surfaces. The staff `(app)` group contains the previously recorded 244 route entries. The route contract covers all eight proposed staff IA domains and 28 critical legacy entry aliases; the 1,713-row parity matrix remains the exhaustive preservation source.

| User-facing domain | Desired root | Availability | Safe current landing | Current route families |
| --- | --- | --- | --- | --- |
| Today | `/today` | Live, not yet the universal manager home | `/dashboard` | `/dashboard`, `/today`, `/alarms` |
| Children | `/children` | Live | `/children` | Children, daily/absence reports, medical, assessments |
| Rooms | `/rooms` | Planned | `/classes` | `/classes`, `/branches`, `/food` |
| Team | `/team` | Planned | `/employees/staff` | `/employees/**` |
| Messages | `/messages` | Live | `/messages` | `/messages/**`, `/calls/**` |
| Finance | `/finance` | Planned | `/accounting` | `/accounting/**` |
| Reports | `/reports` | Planned root; child routes are live | `/reports/monthly` | Monthly and branch monthly reports |
| Settings | `/settings` | Live | `/settings` | `/settings/**`, `/users/admin/**` |

`Planned` means the route must not exist yet. The verifier fails if a planned root appears without this contract being reviewed and promoted.

## Compatibility Classes

### Current routes

Current modern routes remain authoritative until a complete replacement flow passes parity, authorization, browser, accessibility, performance, and operator gates. A new shell may relabel `/classes` as `Rooms` before the underlying route is renamed.

### Legacy aliases

Legacy `.php` entry points use one of three strategies:

- `redirect`: resolve server-owned identity and land on one modern route.
- `render-canonical`: render the same canonical page implementation without creating a second UX.
- `request-delegate`: preserve an output/download request whose response behavior is not ordinary page navigation.

The typed registry currently protects critical aliases across the home, child dossier, attendance, calls, accounting, room/branch, staff, messaging, reports, and settings workflows. It does not replace the parity matrix or existing focused legacy verifier suite.

### Native and parent contracts

`/ws/*.php`, `/[legacyPath]/ws/[endpoint]`, and `/api/parent/**` are request/response contracts, not visual route aliases. The separate `/parent/**` web projection is also outside the staff IA. These surfaces retain parser-safe fields, status conventions, identity translation, authentication, and failure behavior independently of staff navigation. Native/API requests never redirect into a redesigned screen, and all four families are classified separately from staff route analytics.

### Output routes

PDF, print, export, attachment, and monthly-report handlers remain output contracts. A visual route rename cannot change response type, filename, column order, scope, authorization, or return context.

## Identity and Query Rules

### Server-owned identity translation

Legacy `id`, `fid`, `brid`, staff, parent-user, message, and payment identifiers are resolved on the server through the existing legacy identity helpers. The browser must never guess that a numeric/encrypted legacy ID is a modern UUID.

Resolution outcomes are fixed:

- Valid and authorized: land on the canonical record or operation.
- Missing or malformed: use the existing safe list fallback or not-found behavior.
- Existing but unauthorized: use the same forbidden/non-disclosure behavior as direct modern navigation.
- Never reveal whether an out-of-scope child, family, staff member, message, invoice, or health record exists.

### Allowlisted context

Compatibility routes preserve only context that the destination understands. The core vocabulary is:

- Scope: `branch`, legacy `brid`, class/room identifiers.
- Time: `from`, `to`, `year`, `month`, and existing legacy date-filter names.
- Search/filter: bounded `q` and explicitly mapped legacy table filters.
- Source: a non-sensitive source/work-item category, never an arbitrary return URL.
- Record identity: resolved into a path segment or a named modern parameter.

Unknown parameters, auth material, arbitrary callbacks, and raw internal IDs are not forwarded by default. Search values use the existing bounded normalization. Any new parameter requires a typed registry change plus a focused test.

### Context round trips

Branch, live/history mode, date range, school year, filters, selection, and source work item must survive a valid contextual round trip when the destination supports them. A branch switch with a draft remains a save/discard/cancel decision; route migration does not weaken that rule.

## Browser History Contract

- A legacy deep link settles on one modern destination. It must not create an alias/canonical redirect loop.
- Back returns to the real previous external or product location, not to a client redirect that fires again.
- Filter, sort, and view-density changes use URL replacement when they refine the same view.
- Opening a record, work item, or consequential step uses history navigation so Back restores list position, filters, and selection.
- Closing a contextual panel restores focus and does not create an extra dead history entry.
- Forward restores the same authorized state or a clear stale/not-available state; it never silently substitutes another record.
- Login callbacks accept only sanitized same-origin product paths and preserve the original deep-link intent.

These are acceptance requirements. Existing aliases are not declared fully validated for browser-history behavior until the browser matrix below is executed against the pilot build.

## Authorization Contract

Route compatibility does not grant capability. Every current route, future target, alias, search result, queue link, request delegate, export, and mutation must reach the same server-owned tenant, role, assignment, relation, capability, and transition decision.

Navigation visibility is a projection of authorization, not its implementation. A hidden route remains protected when opened directly or through a legacy alias. `All branches` remains read-oriented oversight; writes require a concrete authorized branch.

## Analytics Contract

`observeRedesignRoute()` provides a territory-neutral observation with only:

- canonical IA domain or `null`;
- route class: target, current, legacy alias, native delegate, or outside staff IA;
- allowlisted analytics key.

It removes query strings and dynamic record IDs by construction. It does not emit child, parent, staff, branch, message, health, invoice, or organization identity. Unknown paths become `other`; native/parent requests become `native-parent` rather than being misreported as staff navigation.

This classifier is not wired to a vendor or network transport. Sampling, consent/legal basis where applicable, retention, access, deletion, aggregation thresholds, and provider approval remain part of the performance/analytics pilot gate.

## Migration Stages

### Stage 0: Observe and freeze

- Keep current routes and aliases live.
- Use the typed registry in tests and planning only.
- Reject any target root that points into `/design-lab`.
- Keep the parity matrix and native parser tests authoritative.

### Stage 1: Selected-direction pilot

- Implement one complete vertical workflow on existing safe routes.
- Add the selected shell and labels without renaming route families.
- Verify direct URL, search, work queue, contextual link, browser Back/Forward, login return, and permission denial against the same record state.
- Record affected parity rows, native contracts, data sources, mutations, outputs, and aliases.

### Stage 2: Introduce a target root

A planned root can become live only when:

1. Operator label and first-click evidence accepts the destination.
2. Every current child route has a canonical mapping.
3. Authorization fixtures agree for manager, practitioner, clinical, administrator, and parent boundaries.
4. Alias and direct-link browser tests pass with allowed query context.
5. Privacy-safe route analytics are approved and instrumented.
6. Native, output, and database behavior remain unchanged or have a separately accepted migration.
7. The typed contract changes from `planned` to `live` in the same reviewed slice as the new root.

### Stage 3: Change navigation ownership

- Point shell navigation, global search, work queue, and contextual links to the accepted target.
- Keep current roots and `.php` aliases as compatibility entries.
- Compare error, forbidden, not-found, completion, and backtracking rates by canonical domain without transmitting record identity.

### Stage 4: Consolidate implementation

- Remove duplicate visual implementations only after all entry paths use the same canonical workspace.
- Keep externally consumed/native aliases indefinitely where required.
- Retire a web alias only with usage evidence, stakeholder approval, documentation, a safe response, and parity-matrix closure.

## Pilot Browser Matrix

For every migrated core flow, test at minimum:

| Entry | Required proof |
| --- | --- |
| Current navigation | Correct domain, scope, record, state, and primary action |
| Direct modern URL | Same authorization and state as navigation |
| Legacy `.php` alias | Correct identity translation and allowlisted query context |
| Global search | Same canonical object and preserved source context |
| Work queue | Same canonical object, owner/consequence context, and return state |
| Contextual child/room/staff link | No competing detail implementation |
| Login return | Sanitized same-origin return to the requested authorized state |
| Browser Back/Forward | Filters, selection, scroll/focus, and context restored without loops |
| Unauthorized alias/direct route | Same non-disclosure result |
| Native/API request | Unchanged parser-safe response contract |

Run the matrix at desktop, compact desktop, tablet, and mobile projections with browser console/network review. Consequential flows also require stale, offline/retry, partial, and failure evidence.

## Automated Verification

`pnpm exec tsx src/scripts/verify-redesign-route-compatibility.ts` currently proves:

- eight unique staff IA domains;
- live target roots and current landings exist in the App Router tree;
- planned roots do not exist prematurely;
- every current root is represented;
- all 28 critical alias sources and destination templates exist;
- alias sources are unique case-insensitively;
- identity-bearing aliases declare accepted input keys;
- no target, landing, or alias enters `/design-lab`;
- dynamic IDs and query values do not survive in route observations;
- native root, legacy-install, parent API, and parent web surfaces remain separate delegates.

Focused ESLint and full TypeScript checks pass alongside the verifier. Production route behavior remains unchanged because no current route imports this registry.

`pnpm exec tsx src/scripts/verify-redesign-navigation-contracts.ts` now independently proves seven capability/scope fixtures across administrator, manager, teacher, nurse, and doctor projections. It covers organization read-all, assigned branches/rooms/reviews, an imported explicit deny, pending setup, missing/conflicting policy default-deny, unknown-branch non-disclosure, and concrete-only write contexts. The IA lab consumes the same projector. This closes the route plan's shell-fixture evidence, not production route authorization.

A signed-out production smoke at `localhost:3003` additionally confirmed that `/index.php` becomes the sanitized `/login?callbackUrl=%2Findex.php` return intent, `/children.php?q=synthetic` preserves its same-origin path/query in the login callback, and browser Back/Forward restores those two callback states without console warnings or errors. This verifies the unauthenticated boundary only; authenticated alias resolution remains in the pilot matrix because the visible demo credentials are not valid in the current database.

## Open Evidence

- Manager and practitioner card sorting and first-click tests.
- Final validation of `Rooms`, `Team`, `Reports`, and calls under Messages.
- Production authorization integration and allowed/denied route-loader, query, mutation, export, alias, API, and native evidence; capability-derived shell fixtures are complete.
- Native staff and parent navigation comparison on real clients.
- Pilot browser-history matrix with real authorized records and sanitized evidence.
- Approved analytics transport and governance, if analytics are enabled.
- Complete alias-by-alias linkage from the parity matrix during each rollout wave.

## Decision

The route compatibility and analytics architecture is accepted as the reversible baseline for pilot planning. It closes the planning portion of the IA route-migration gate, but it does not authorize route renames or production navigation changes. The first selected-direction pilot should ship on safe current routes, then promote one planned root only after its complete domain mapping and browser evidence pass.
