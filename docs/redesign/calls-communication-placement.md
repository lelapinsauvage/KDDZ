# Calls Communication Placement

**Status:** Reversible territory-neutral IA contract
**Production behavior changed:** No
**Contract:** `src/lib/redesign-call-workflow-contracts.ts`
**Verifier:** `src/scripts/verify-redesign-call-workflow.ts`

## Decision

Calls belong to the global **Messages** domain because they are auditable parent/staff communication records. This changes findability, not data ownership:

- cross-child listing, creation, drafts, filtering, and export live at `Messages / Calls`;
- a branch entry opens the same collection with a server-resolved branch filter;
- a child's communication history keeps a contextual Calls view under the child;
- all three surfaces resolve to the same `CallLog` records and mutations;
- current `/calls`, `/bcalls.php`, `/call.php`, `/calls.php`, and `/child_calls.php` entry points remain live.

The production sidebar and route tree are unchanged. This contract is evidence for a future selected-direction pilot, not a route migration.

## Current Record

`CallLog` preserves legacy Form 6 data with child, direction, date, optional time/contact/phone/subject/reason/remarks/staff, creator, attachments, legacy identities/data, and `isDraft`. `CallDirection` is `INCOMING`, `OUTGOING`, or `MISSED`.

Current actions support:

- organization-scoped global, branch, class, child, direction, draft, date, and text filtering;
- child-context history and standalone detail;
- create, edit, submit, hard delete, print, and export;
- active attachments and migrated call-cause lookup;
- draft saving with child identity only; submitted validation requires direction, date, time, cause, subject, and staff;
- legacy identity and Form 6 payload preservation.

The restored parity verifier remains authoritative for legacy columns, filters, page sizes, print/export, attachments, drafts, detail, and route bridges.

## Work-State Integrity

Only server-owned state may create a Today/work-queue item.

| Source state | Actionable | Today eligible | Reason |
| --- | --- | --- | --- |
| `CallLog.isDraft = true` | Yes | Yes | The report is saved, incomplete, and can route back to one canonical record. |
| `CallLog.isDraft = false` | No | No | It is submitted history unless another explicit workflow exists. |
| `CallLog.direction = MISSED` | No | No | Direction alone does not prove callback intent, owner, due time, or resolution. |

The IA fixture therefore uses **Finish Alma's parent call report**, opening `Messages / Calls / Drafts / Alma Reyes`. It deliberately does not invent a “return missed call” task.

If callback workflow is later required, it needs explicit server fields or a related work object for owner, requested action, due time, status, resolution, actor, timestamps, and audit history before appearing in Today.

## Authorization Target

Current call actions require organization membership and an organization-owned child, but they do not enforce a named call capability or assigned branch/room scope. Navigation visibility is not authorization.

The production pilot must introduce one effective decision path for:

- `calls.read`;
- `calls.create`;
- `calls.update`, with explicit own-draft versus elevated any-record rules;
- `calls.submit`;
- `calls.void`;
- `calls.export`.

Every read, mutation, direct route, search result, queue item, export, and legacy alias must use the same concrete organization/branch/room/child scope. All-branches oversight stays read-only unless a concrete branch is selected. Submitted communication should be voided with a reasoned audit event instead of silently hard-deleted.

## Compatibility Additions

The route registry now records all four critical legacy call entries:

| Legacy entry | Canonical behavior | Identity/context |
| --- | --- | --- |
| `/calls.php` | Render `/calls` | None |
| `/bcalls.php` | Render `/calls` with branch/filter context | `brid` plus allowlisted collection filters |
| `/call.php` | Render `/calls/[id]`, or `/calls` when no form id exists | `fid` call identity; `id` legacy child guard |
| `/child_calls.php` | Resolve child and open `/children/[id]/calls` | legacy child `id` |

No alias enters the design lab. Server-side identity conversion and non-disclosure behavior remain required.

## Evidence Boundary

The executable contract proves source shape, live routes, route registry coverage, one truthful draft work predicate, and six target capabilities. It does not prove operator terminology, production capability enforcement, assigned-scope behavior, real-record history restoration, destructive-action migration, or database counts. The local database was unavailable during this source audit, so no runtime aggregate is claimed.

Before production navigation changes, run manager and practitioner first-click testing, authenticated allowed/denied route and mutation tests, branch/child deep links, export-scope tests, browser history, 200% zoom, screen-reader checks, and stale/failure recovery.
