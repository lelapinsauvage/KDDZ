# Reliability, Offline, Retry, And Draft-Safety Audit

**Date:** 2026-07-10  
**Scope:** Production web runtime, service worker, browser storage, server actions, Prisma mutation boundaries, parent/native compatibility, and offline UX  
**Visual direction:** Territory-neutral  
**Production behavior changed:** No

## Question

Can Kiddz Online remain trustworthy through slow, interrupted, duplicated, and conflicting requests without exposing child data on shared devices, claiming success before the server confirms it, or breaking restored web/native contracts?

## Method

The audit combines:

- a reproducible source scanner: `pnpm tsx src/scripts/report-redesign-reliability.ts --summary`;
- direct inspection of the production service worker and generated worker bundle;
- browser verification of the production offline fallback at port 3003;
- direct inspection of child enrollment drafts, parent authentication, payments, medical updates, attendance, daily reports, messages, and logout behavior;
- the existing journey-state, authorization, cross-device, localization, and parity evidence;
- current primary guidance from [Serwist](https://serwist.pages.dev/docs/serwist/runtime-caching), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control), [Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/transactions), [Next.js](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations), and [Stripe](https://docs.stripe.com/api/idempotent_requests).

The scanner covers 755 production TypeScript/TSX files and all 39 action modules. Generated Prisma code, scripts, and design-lab fixtures are excluded.

The file-level multi-write metric is a triage signal, not proof that every operation in that file is non-atomic. Representative critical operations were traced manually before assigning findings.

## Reproducible Baseline

| Signal | Measured value | Meaning |
| --- | ---: | --- |
| Production source files | 755 | Scanner scope |
| Action modules | 39 | Mutation audit scope |
| `localStorage` reads | 14 | Persistent browser state is distributed |
| `localStorage` writes | 11 | Includes child draft and parent credentials |
| `localStorage` removals | 7 | Cleanup is partial and flow-specific |
| `sessionStorage` access | 0 | No shorter-lived fallback |
| IndexedDB access | 0 | No structured local outbox or draft store |
| Connectivity reads/listeners | 0 / 0 | Product does not know or explain connection state |
| Service-worker accesses | 4 | Concentrated in the parent portal |
| Background Sync access | 0 | No deferred sync implementation |
| Cache API accesses in app source | 0 | Runtime caching comes from Serwist defaults |
| `useOptimistic` calls | 0 | No explicit optimistic projection contract |
| Transition calls | 230 | Pending UI is common but not a delivery guarantee |
| Retry/idempotency language | 0 / 0 | No production retry contract |
| Prisma transaction calls | 32 | Some atomicity exists, unevenly |
| `revalidatePath` calls | 247 | Broad refresh behavior, not a mutation receipt |
| Mutation action files | 31 | Files with detected Prisma writes |
| Files with multiple writes | 30 | Broad compound-write surface |
| Multi-write files with no transaction call | 12 | Manual review queue |
| Schema version fields | 0 | No general optimistic-concurrency primitive |
| Idempotency/operation receipt model | 0 | No replay ledger |

Confirmed offline surface:

- Serwist `defaultCache` is active only in production.
- The parent portal registers `/sw.js` with root scope `/`.
- The worker immediately claims clients and skips waiting.
- The generated worker applies `NetworkFirst` caching to same-origin GET APIs, RSC payloads, HTML pages, and other same-origin GET requests for up to 24 hours.
- A generic `/offline` fallback exists and is browser-confirmed.
- The fallback says only that some features may be unavailable; it does not identify what is safe, saved, queued, blocked, or stale.

Confirmed persistent browser data:

- New-child enrollment autosaves the full form to the global key `child-enrollment-draft` every second.
- That payload can include names in two scripts, birth and identity data, addresses, parent contacts, medical details, pickup permissions, nursery history, fees, discounts, and financial remarks.
- The key is not organization-, branch-, user-, or session-scoped.
- Staff logout does not clear it; successful enrollment does.
- Parent login stores the bearer token, child ID, and child name in `localStorage`.
- Parent logout removes those three keys, but an XSS or another user of the same browser profile can reach them while they persist.

## Findings

### R01 - The service worker has a broader data scope than the product promise

**Severity:** P0 privacy and authorization

The worker is registered from a parent surface but controls the entire origin. Serwist's default production rules are asset-friendly defaults, not a Kiddz data-classification policy. They include authenticated-looking API, RSC, HTML, and catch-all same-origin GET caches.

A cached response is not re-authorized when replayed from disk. On a shared nursery browser, an old response can outlive logout, role change, branch change, or a child's record update unless every cache path and purge event is deliberately governed.

OWASP recommends restricting worker scope, maintaining a kill switch, and not caching sensitive responses. MDN distinguishes `no-store` from revalidation semantics. The worker must enforce Kiddz policy explicitly; framework defaults cannot own it.

**Target:** hashed static assets and an anonymous offline shell may be cached. Authenticated records, RSC payloads, APIs, exports, uploads, PDFs, messages, medical data, finance, and role-specific HTML are network-only until a separately approved encrypted offline architecture exists.

### R02 - Browser persistence currently crosses identity and tenant boundaries

**Severity:** P0 privacy

The child-enrollment draft is a complete sensitive record in a single origin-wide key. The next staff member, organization, or browser session can restore it before authorization is re-established. Parent bearer credentials also live in JavaScript-readable persistent storage.

OWASP explicitly warns that local machine access and one XSS can expose persistent browser storage. IndexedDB would improve structure and transactions, but not confidentiality by itself.

**Target:** sensitive drafts are server-owned, tenant-scoped, actor-scoped, encrypted at rest, access-controlled, expiring, auditable, and recoverable across approved devices. Web memory may hold an active form; persistent browser storage may keep only non-sensitive preferences and opaque references that are useless without a live authorized session.

Existing parent/native token fields remain compatibility contracts. New web parent authentication should move to an HttpOnly secure session without silently changing native tokens.

### R03 - The product does not distinguish disconnected, slow, failed, or stale

**Severity:** P1 trust and usability

There is no `navigator.onLine` read, connection listener, latency classification, sync state, last-confirmed time, or pending-work surface. The offline page appears only when navigation fails and uses generic copy.

`navigator.onLine` is only a hint and cannot prove server reachability. A real connection model combines:

- browser connectivity hint;
- a bounded authenticated health/read probe;
- mutation-specific response or timeout;
- last confirmed server revision;
- queued and conflicted operation state.

**Target:** tell users what happened to their work, not merely that the network is "offline." Use explicit states such as `Saving`, `Saved at 14:32`, `Connection interrupted - still on this device`, `Not submitted`, `Retrying`, `Needs review`, and `Server confirmed`.

### R04 - Transition pending state is being mistaken for optimistic architecture

**Severity:** P1 interaction integrity

The runtime contains 230 `useTransition`/`startTransition` calls and zero `useOptimistic` calls. A React transition can keep the UI responsive and expose pending state, but it does not:

- make a mutation retry-safe;
- prove the server committed;
- reconcile another user's update;
- preserve an operation across reload;
- create a durable audit receipt;
- decide when an optimistic projection is ethically acceptable.

**Target:** optimistic projection is opt-in per domain transition. Every optimistic action has a stable operation ID, reversible local projection, authoritative server response, visible pending state, timeout outcome, conflict behavior, and audit result.

### R05 - Duplicate submission can create duplicate real-world effects

**Severity:** P0 finance, attendance, messaging, and evidence

The schema has no idempotency receipt. Production source contains no idempotency contract. `createPayment` creates a new payment for every successful invocation. If the server commits but the response is lost, a manager cannot safely know whether pressing again duplicates the payment.

The same ambiguity applies to messages, attendance events, incident creation, batch reports, notifications, exports, and other create operations unless a domain uniqueness rule happens to absorb the replay.

**Target:** every retryable mutation carries an actor- and tenant-scoped idempotency key. The server persists request fingerprint, execution state, authoritative result, and expiry. Reusing a key with different input is rejected; replaying the same operation returns the original receipt.

Stripe's public API is a useful pattern because it separates safe replay from parameter changes. Kiddz owns its own domain semantics and cannot copy payment-specific expiry blindly.

### R06 - Compound records can be left partially updated

**Severity:** P0 medical and evidence

Transactions exist, but not consistently at operation boundaries. The clearest confirmed example is `updateMedicalForm`:

1. existing entries are deleted;
2. the parent form is updated and entries recreated;
3. removed attachments are deactivated;
4. active attachments are updated one by one;
5. new attachments are created.

These writes are not enclosed in one transaction. A failure after step one can erase entries while the action returns a generic error. File-level scanning also identifies alarms, employees, employee events, notification templates, parent users, assessments, organizations, branches, and compliance as manual review priorities.

**Target:** one business transition has one atomic database boundary unless a documented saga is required. External uploads occur before the transaction with quarantine/cleanup, or after it through an outbox; they are never mistaken for atomic database work.

### R07 - Revalidation is not a commit receipt

**Severity:** P1 state clarity

There are 247 `revalidatePath` calls. They help subsequent reads become fresh, but they do not identify:

- which operation committed;
- which version was produced;
- whether a duplicate was replayed;
- which downstream side effect remains pending;
- whether another actor overwrote the record;
- whether the visible client has received the new canonical state.

**Target:** mutation responses return a typed receipt containing operation ID, canonical object ID, resulting version/status, server time, audit-event ID, and follow-up state. Revalidation remains a rendering concern.

### R08 - There is no governed draft, outbox, or conflict lifecycle

**Severity:** P0 workflow reliability

Some domains have database drafts, one child flow has a browser draft, messages have sent state, and jobs have isolated duplicate protection. There is no shared contract for ownership, expiry, resume, handoff, cancellation, conflict, or correction.

**Target:** drafts and queued operations are first-class records with domain-specific retention and permission. A draft can be resumed only by an authorized actor in scope. A queued operation cannot claim completion. A conflict preserves both the submitted intent and current server state until resolved.

### R09 - Web, parent, and native clients need separate storage guarantees

**Severity:** P0 parity

The existing iOS/Android and `/ws/**` contracts must remain stable. A native app may use OS-protected keychain/keystore and encrypted local databases; a shared browser cannot be treated as equivalent. "Cross-device" cannot imply copying one storage design to every client.

**Target:** share operation IDs, versions, state machines, and server receipts across clients. Keep device storage, authentication, background execution, and purge policy platform-specific. Existing native field values are not localized or repurposed in place.

### R10 - Logout and access changes do not define a complete purge boundary

**Severity:** P0 privacy

Staff logout signs out the server session but does not clear the child draft, branch/year preferences, or service-worker caches. Parent logout removes parent keys but does not define cache cleanup. Role, branch, and child access can change while cached or local data remains.

**Target:** authentication loss, explicit logout, organization switch, role/scope reduction, device revocation, and emergency kill-switch each trigger the correct server invalidation and client purge. Non-sensitive preferences may survive only under a documented key namespace.

## Reliability Classification

Every operation must declare a class before implementation.

| Class | Meaning | Examples | Disconnected behavior |
| --- | --- | --- | --- |
| `A - Online confirmed` | Legal, financial, security, or irreversible transition | Payment, permission change, medical approval, final incident submission, export | Block commit; preserve authorized server draft; never show success |
| `B - Resilient server draft` | Sensitive work may be resumed but not finalized | Child enrollment, care report, rota edit, message composition | Keep active input in memory; autosave when reachable; show last server save |
| `C - Queueable operation` | Replay-safe, scoped transition with bounded conflict policy | Low-risk room observation, read receipt, explicitly approved message send | Store as protected platform operation; show queued until server receipt |
| `D - Safe cached reference` | Non-personal, versioned, read-only material | Static help, approved policy glossary, app shell | Allow explicit versioned cache and stale label |

No domain enters Class C merely because the user asked for offline tolerance. It needs idempotency, authorization-at-replay, version/conflict policy, protected storage, expiry, purge, and operator acceptance.

## Mutation Envelope And Receipt

### Client intent

```json
{
  "operationId": "uuid-v4",
  "operationType": "payment.create",
  "organizationId": "org_123",
  "branchId": "branch_456",
  "actorId": "user_789",
  "targetId": "child_123",
  "expectedVersion": 7,
  "payloadHash": "sha256:...",
  "clientCreatedAt": "2026-07-10T14:32:09Z"
}
```

The authenticated server derives actor, organization, and allowed branch scope. Client copies are comparison input, never authorization.

### Server receipt

```json
{
  "operationId": "uuid-v4",
  "state": "confirmed",
  "objectId": "payment_123",
  "objectVersion": 8,
  "auditEventId": "audit_123",
  "serverConfirmedAt": "2026-07-10T14:32:10Z",
  "replayed": false,
  "followUp": []
}
```

### Required server rules

1. Uniqueness is scoped by organization, actor/client, operation type, and operation ID.
2. The first accepted payload stores a canonical fingerprint.
3. Same key and same fingerprint returns the recorded state/result.
4. Same key and different fingerprint returns a typed conflict.
5. Authorization is checked both when accepted and when a queued operation is replayed.
6. Transactional business writes and receipt confirmation commit together.
7. External side effects use an outbox and their own provider idempotency key.
8. Receipt expiry follows domain and audit policy; finance and legal evidence are not deleted on a generic 24-hour timer.

## Shared State Machine

```text
editing
  -> saving
  -> saved_draft
  -> submitting
  -> confirmed

saving/submitting
  -> interrupted
  -> retrying
  -> confirmed | rejected | conflict | needs_review

confirmed
  -> correcting
  -> corrected
  -> superseded
```

Rules:

- `pending` and `queued` are visible durable states, not spinners.
- `interrupted` means the client does not know the server outcome.
- Only an authoritative receipt produces `confirmed`.
- `conflict` preserves both current server state and submitted intent.
- High-risk records are corrected or superseded, not silently overwritten.
- Closing a panel never cancels a server operation unless cancellation is explicit and confirmed.

## Service-Worker Contract

1. Replace `defaultCache` with a Kiddz-owned allowlist.
2. Cache only fingerprinted static assets, icons, fonts with approved licensing, and an anonymous offline shell.
3. Route authenticated HTML, RSC, APIs, PDFs, exports, uploads, storage, and compatibility endpoints through `NetworkOnly`.
4. Keep API/auth and all mutation methods network-only.
5. Never cache a response marked `no-store`; add explicit response classification where missing.
6. Use versioned cache names and delete retired versions on activation.
7. Purge protected caches on logout, auth expiry, scope reduction, organization switch, device revocation, and kill-switch message.
8. Keep the worker's scope no broader than required; root push/navigation requirements need explicit threat review.
9. Do not combine push notification delivery with broad record caching by accident.
10. Maintain an emergency worker-unregister/cache-purge release path.

## Workflow Contracts

### Attendance and live ratios

- Use server-owned attendance events and room-assignment facts.
- Key check-in/out by operation ID and domain uniqueness policy.
- An optimistic row may show `Sending`, never `Present`, until confirmed when ratio or safeguarding state depends on it.
- Recompute ratio from confirmed presence, assignment, qualifications, policy revision, and branch operational time.
- A conflict names the child, existing state, source actor/device, and next safe action.

### Daily care and reports

- Use actor/room/day-scoped server drafts with field-level revision.
- Never default factual care events as completed.
- Batch submission is one reviewed intent with child-level results and replay-safe operation IDs.
- Offline-capable native capture, if approved, stores encrypted operations and shows each unsynced child explicitly.

### Medical, incidents, and medicine

- Final submission and approval are Class A.
- Drafts are server-owned and autosaved when reachable.
- Parent form, entries, attachment metadata, status transition, and audit event commit atomically.
- File upload has quarantine, checksum, authorization binding, expiry, and orphan cleanup.
- Corrections preserve the original evidence and reason.

### Finance and funded hours

- Payment, allocation, invoice issue, refund, and funding claim are Class A.
- No optimistic monetary balance change.
- Every create/refund/allocate operation uses idempotency and exact money/currency input.
- A lost response produces `Checking payment status`, not a second create button.
- Downstream invoice/PDF generation is a named follow-up with its own state.

### Messages and parent communication

- Composition is a server draft.
- Send uses an outbox and stable operation ID.
- `Queued`, `Sent`, `Delivered`, `Read`, and `Failed` remain distinct.
- Retrying cannot duplicate a message or notification fan-out.
- Existing native message endpoints remain shape-compatible behind adapters.

### Rota, occupancy, and staffing

- Edits carry expected schedule/occupancy revision.
- Publishing is Class A with preflight and an explicit affected period.
- Conflicts show the changed staff/room facts rather than overwriting the schedule.

### Permissions, policy, and settings

- Always online-confirmed.
- Cache purge follows any scope reduction.
- Effective-dated policy updates produce a new revision and never rewrite historical calculations.

## Migration Plan

### Wave 0 - Stop adding ungoverned persistence

- Keep the scanner in reporting/CI.
- Ban new sensitive `localStorage`, default runtime-cache routes, and retryable creates without operation IDs.
- Snapshot parent/native payloads and current worker behavior.

### Wave 1 - Secure the current web boundary

- Replace Serwist defaults with an explicit static-only allowlist.
- Add cache classification headers and purge/kill-switch behavior.
- Move new parent web sessions to HttpOnly cookies while preserving native tokens.
- Stop creating new child PII drafts in persistent browser storage after a server-draft replacement exists.

### Wave 2 - Add receipts and versions

- Add operation receipt/idempotency schema and typed server helpers.
- Add version fields to mutable aggregate roots.
- Return operation/result/audit metadata from pilot server actions.

### Wave 3 - Build server drafts

- Migrate child enrollment, daily care, medical, message composition, and rota edits to scoped server drafts.
- Add expiry, ownership, handoff, recovery, and deletion policy.
- Import or safely retire the one legacy browser draft with user-visible review.

### Wave 4 - Make compound writes atomic

- Fix medical update first.
- Audit each operation in the 12 file-level hotspots, splitting independent operations from true aggregate mutations.
- Move external side effects to transactional outboxes.

### Wave 5 - Add connection-aware UX

- Implement one shared connectivity and sync status service.
- Add stable `Saving`, `Saved`, `Interrupted`, `Queued`, `Conflict`, and `Confirmed` components from semantic tokens.
- Apply consequence-specific optimistic projection only after server contracts exist.

### Wave 6 - Approve limited offline workflows

- Evaluate managed native devices and OS-protected storage first.
- Pilot one queueable low-risk room workflow with real practitioners.
- Prove purge, expiry, replay authorization, conflict, clock skew, duplicate delivery, and device-loss cases.

### Wave 7 - Remove compatibility only with evidence

Legacy tokens, payloads, browser draft recovery, and route contracts remain until parity fixtures and client release evidence allow retirement.

## Acceptance Fixtures

### Privacy and cache

1. Authenticated HTML, RSC, API, PDF, export, and upload responses never enter service-worker caches.
2. Logout and scope reduction leave no protected response or PII draft accessible to the next browser user.
3. Worker kill switch unregisters the worker and removes retired/protected caches.
4. Static assets continue to load offline without exposing a record shell from another user.

### Retry and idempotency

1. Drop the response after a successful payment commit; retry returns the original payment and receipt.
2. Reuse the same operation ID with changed amount or child; server rejects it.
3. Double-click, two tabs, reconnect replay, and native retry create one effect.
4. Expired-key behavior is explicit and domain-safe.

### Atomicity and conflict

1. Fail every step of medical update; no partial parent/entry/attachment state survives.
2. Two actors edit the same rota/report; the stale version receives a typed conflict.
3. Conflict resolution preserves submitted intent and current server truth.
4. Audit event and aggregate version commit with the business change.

### Connection UX

1. Slow, disconnected, server-error, authorization-loss, and stale-version states have different copy and actions.
2. Closing/reopening a surface preserves the authoritative operation state.
3. Reduced motion and screen readers receive the same status and focus return.
4. No queued or pending action is announced as complete.

### Cross-device

1. Web, iOS, and Android replay the same operation safely.
2. Existing native payload snapshots remain compatible.
3. Device revocation prevents queued replay and purges protected local data where supported.
4. Server time/version wins over device clock without discarding authored intent.

## Decisions

1. Offline tolerance is a data-integrity and privacy program, not a service-worker badge.
2. The web app will not persist child, medical, financial, or credential data in browser storage by default.
3. Serwist defaults are replaced by a Kiddz-owned cache allowlist before production redesign rollout.
4. High-risk actions are online-confirmed and never optimistically declared complete.
5. Retryable creates require idempotency receipts; mutable aggregates require explicit versions.
6. Drafts are authorized server records with ownership, expiry, and audit policy.
7. Revalidation refreshes views but does not replace mutation receipts.
8. Native compatibility evolves through adapters and versioned fields, not in-place localization or storage changes.
9. Missing delivery certainty is visible `Interrupted` or `Unknown`, never `Success`.

## Open Gates

1. Managed-device policy and whether nursery tablets are shared, supervised, or personally assigned.
2. First workflows allowed to queue offline and their legal/operator risk classification.
3. Parent web session migration and native token release matrix.
4. Draft retention, handoff, deletion, and emergency-access policy by jurisdiction.
5. Idempotency receipt retention and payload-hash treatment for sensitive data.
6. Aggregate boundaries and versioning granularity for attendance, care, medical, finance, rota, and messaging.
7. Upload quarantine/storage provider and orphan-cleanup guarantees.
8. Real poor-network tests on nursery hardware and representative iOS/Android versions.

Until these gates close, the audit defines architecture and executable fixtures. It does not claim that protected operational records are available offline, does not alter production caching or authentication, and does not remove any restored capability.
