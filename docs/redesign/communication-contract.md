# Accountable Communication Contract

**Date:** 2026-07-11
**Status:** Reversible territory-neutral Wave 4 foundation
**Production behavior changed:** No
**Executable contract:** `src/lib/redesign-communication-contracts.ts`
**Verifier:** `src/scripts/verify-redesign-communication-contracts.ts`
**Prototype:** `/design-lab/communication`

## Question

Can Kiddz make direct, class, and broadcast communication fast without treating a message row as proof of channel delivery, a read flag as a reply, a shared campaign thread as a safe family conversation, or deletion as an acceptable audit strategy?

## Confirmed Current Record

The current system restores broad legacy and native capability:

- direct staff-to-staff and staff-to-parent messages;
- parent-to-admin and parent-to-teacher messages;
- class and selected-child broadcasts;
- teacher recipients and legacy admin-copy fan-out;
- Web, Mobile, SMS, WhatsApp, and Admin-only intent;
- legacy message natures and their alarm/event/holiday side effects;
- inbox, sent, thread, reply, read/unread, resend, delete, filter, print/export-adjacent behavior;
- `/message_portal.php`, `/message_portal_class.php`, `/message_portal_single.php`, `/alarmsMsg.php`, and related aliases;
- `/ws/messagesList.php`, `/ws/message.php`, and `/ws/sendMessage.php` parser-safe native contracts;
- parent web and authenticated/legacy-compatible parent APIs;
- provider-neutral push, SMS, and WhatsApp attempts with saved audit summaries where configured.

The following limitations are source-confirmed:

1. `Message` contains sender, recipient, content, thread, one mutable `isRead` flag, and legacy delivery JSON. It does not model publication acceptance, immutable content revision, recipient snapshot, channel job, delivery receipt, bounce, read timestamp, reply obligation, correction, archive, or participant membership.
2. Class and bulk sends group copies for multiple parents under one `MessageThread`. Before the follow-up privacy hardening, parent list/thread loaders could authorize one participating row and then load every row sharing that thread. Parent/native list previews, payload mapping, dedupe, and read reset are now filtered to the resolved active parent relationship; ambiguous unauthenticated multi-parent opens return the parser-safe empty thread. Staff-side campaign visibility still needs an explicit capability policy.
3. Direct send creates a thread, primary row, admin copies, provider attempts, and audit updates across separate writes. Class send also separates database creation from external delivery. Bulk selected-child send has a stronger transaction for thread, rows, and legacy side effects, but provider delivery remains a later step by design.
4. External channel outcomes live inside `Message.legacyData`; they are summaries rather than first-class recipient/channel attempts with retry lineage.
5. `isRead` can be toggled back to unread and has no read timestamp or device/principal receipt. It is attention state, not delivery, reply, acknowledgment, or source resolution.
6. Current delete and bulk delete hard-delete message rows for a sender or recipient. No reason, archive event, retention policy, or shared-history protection is recorded.
7. Reply inherits the original delivery-channel intent and creates another row, but there is no explicit requested-response deadline, follow-up owner, escalation, or resolution receipt.
8. Legacy message natures can create alarms, receipts, events, and holidays. A redesign cannot detach composition from those side effects without exact parity mapping.
9. Parent/native list and thread payload shapes are parser-sensitive and intentionally preserve numeric legacy thread IDs, string fields, empty fallbacks, unauthenticated legacy POST behavior where restored, and read-on-open semantics.
10. Calls are already mapped to the Messages domain by `calls-communication-placement.md`, but remain their own `CallLog` source and lifecycle. This contract does not merge call records into message rows.

## Locked Target Model

### Campaign Is Not Conversation

A `CommunicationPublication` groups one accepted content revision and one frozen audience snapshot for staff reporting. It never grants conversation access.

Every recipient receives a distinct `CommunicationConversation` with:

- one parent/family relationship;
- one linked child or explicitly governed family scope;
- explicit participant identities;
- ordered immutable messages;
- participant-specific archive state;
- relation-scoped read and reply mutations.

No parent query can widen from one participating conversation to every row in the campaign.

### Source Set

Audience review requires one complete, non-regressing source set:

- organization and concrete branch;
- active parent account directory;
- active child/family relationship and scope;
- requested channel policy;
- available channel endpoints;
- consent and suppression state;
- content policy and approval rule;
- actor capability and assignment.

Changing any audience source after review invalidates send until the complete audience is rebuilt. The interface cannot silently keep a stale recipient count.

### Draft

A server draft stores:

- immutable revision number;
- subject and body;
- communication category;
- requested channels;
- reply-required flag and deadline;
- author and timestamp.

Saving a draft creates no recipient conversation, delivery row, alarm side effect, notification, or completion claim.

### Audience Review

Audience review resolves explicit selected directory members into:

- eligible recipients;
- child/family relationship;
- consented and available channels;
- explicit exclusions with reason;
- exact content and source revisions;
- reviewer and timestamp.

`WEB` is an explicit channel, not an assumed synonym for a message row. Inactive accounts, inactive relationships, and recipients with no eligible channel are excluded without pretending they were contacted.

### Approval

Routine content may proceed without a second approver where policy allows. Policy, urgent, clinical, safeguarding, financial, or other governed categories require a typed approval rule. Approval binds the exact content revision and audience revision; later edits invalidate it.

### Send Acceptance

One atomic transaction creates:

1. immutable publication acceptance;
2. frozen recipient identities;
3. one isolated family conversation per recipient;
4. one initial message per conversation;
5. one outbox job per recipient and eligible channel;
6. required reply/follow-up obligations;
7. parity-mapped legacy nature side effects;
8. actor, time, source, policy, and idempotency receipts.

Failure leaves no partial publication. Provider calls happen after transaction acceptance through the outbox.

### Delivery, Read, Reply, and Resolution

These facts never collapse:

| Fact | Meaning | Does not prove |
| --- | --- | --- |
| Accepted | Server persisted publication and outbox | Provider delivery, reading, reply |
| Delivered | One recipient/channel returned a durable success receipt | Other channels, reading, reply |
| Failed | One recipient/channel attempt failed | Publication rollback or total failure |
| Read | Named recipient opened a specific message | Agreement, acknowledgment, reply |
| Replied | Parent appended a message to the isolated conversation | Staff review unless policy says so |
| Follow-up resolved | Required response condition received its named evidence | Other source work is complete |

Retry selects failed channel attempts only, increments attempt lineage, and cannot duplicate successful channels, publications, conversations, side effects, or replies.

### Correction

A correction requires reason, actor, time, and replacement content. It:

- preserves the original message and delivery/read/reply evidence;
- reuses the frozen original audience unless an explicit new campaign is created;
- appends a new message revision to each original conversation;
- creates new channel delivery obligations;
- never edits or deletes the original content in place.

### Archive and Retention

Archive hides a conversation for one authorized principal and records an event. It does not delete shared content. Void, legal hold, retention, subject-access export, redaction, and erasure require approved policy and cannot be inferred from the current hard-delete behavior.

## Role Projection

### Nursery manager

May receive, subject to capability and concrete scope:

- content and audience revisions;
- exclusions and channel eligibility;
- aggregate and recipient delivery evidence;
- required replies, ownership, due time, and escalation;
- correction and complete audit history.

### Practitioner

Receives only assigned child/family conversations and permitted compose/reply actions. It does not receive the broadcast audience, excluded families, provider errors, parent account IDs, or manager audit data.

### Parent

Receives only conversations bound to its active relationship. It never receives:

- another parent or child identity;
- campaign audience or exclusion counts;
- internal source revisions;
- staff approval detail;
- provider error codes or endpoint data;
- internal audit actors or side-effect records;
- staff drafts or unpublished corrections.

## Offline and Interruption

- Composition is a resilient server draft.
- Send, approval, correction publication, and external delivery are online-confirmed operations.
- No interface claims success while delivery certainty is unknown.
- A read receipt may become queueable only under approved protected-device policy and exact replay authorization.
- Parent reply may queue only after a product, privacy, device-loss, expiry, and conflict policy is approved; default behavior remains online-confirmed.
- Retrying after interruption uses idempotency keys and fresh authorization.

## Compatibility Migration

1. Add campaign, draft revision, audience snapshot, conversation participant, message revision, outbox, delivery attempt, read receipt, follow-up, correction, archive, and audit storage beside current tables.
2. Backfill recipient-specific conversation identity from each current sender/recipient pair. Preserve `MessageThread` and legacy numeric thread identity as compatibility grouping, not authorization.
3. Place adapters behind existing staff, parent, and `/ws/*.php` routes. Preserve current parser-safe fields, empty fallbacks, and numeric legacy IDs.
4. Map every legacy message nature to atomic domain side effects before moving composition. Do not remove alarm, event, holiday, staff-copy, parent receipt, or channel intent.
5. Parent/native shared-thread projection now resolves one active parent relationship and filters before preview, dedupe, payload mapping, and read reset. Preserve this regression gate while introducing first-class conversation participants; define staff-side campaign visibility separately through capability policy.
6. Dual-write current message rows and new lifecycle receipts during a measured pilot. Compare recipient counts, thread projections, side effects, delivery summaries, and native payloads.
7. Replace hard delete with participant archive and governed void/retention behavior only after policy approval and parity acceptance.
8. Keep Calls as a linked communication type with its own record source, drafts, attachments, print/export, and legacy aliases.

## Deterministic Evidence

The verifier proves:

- all 12 lifecycle states;
- no draft, recipient, publication, or delivery before source confirmation;
- complete and non-regressing sources;
- versioned content with explicit channels and response deadline;
- inactive account/relation exclusions;
- consented and available channel resolution;
- approval bound to content and audience;
- stale audience rejection and refresh;
- atomic publication, conversation, and outbox creation;
- separate recipient conversations for a broadcast;
- exact idempotency and changed-input rejection;
- partial delivery and failed-only retry without resetting success;
- read without reply resolution;
- relation-scoped parent reply;
- participant archive without history deletion;
- append-only correction with frozen audience and new delivery obligations;
- manager, practitioner, and parent privacy projections;
- capability denial.

Checkpoint verification passes all 18 redesign suites, 16 message/parent/native/legacy-side-effect/Calls parity contracts, the 343-route/30-critical-alias registry, focused ESLint, full TypeScript, diff hygiene, and the production build. Agent Browser passes 36 role/state/viewport combinations with zero axe findings, overflow, unnamed controls, undersized controls, or role leakage; the nine-step manager lifecycle and linked-parent reply pass with focus return, live announcements, and empty warning/error logs. The follow-up database regression proves a two-family shared legacy thread returns only the resolved family's row and preview, resets only that family's unread state, and fails closed to the existing empty payload when an unauthenticated multi-parent request has no relationship hint. Credentialed native send/reply/open/read-reset and parser suites remain green. `/design-lab/communication` emits statically; only the documented middleware, CSS `@page`, dynamic-auth prerender, and PostgreSQL SSL-mode migration warnings remain.

## Open Gates

- Staff-side shared-thread visibility, campaign-audit capability, and explicit participant policy; parent/native relationship isolation is now enforced and regression-covered.
- Approved communication categories, approval matrix, consent/suppression rules, quiet hours, and emergency overrides.
- Parent/family versus child-specific conversation policy.
- Legacy message-nature side-effect mapping under one transaction/outbox.
- Production provider credentials, webhook signing, bounce handling, and delivery deadlines.
- Reply ownership, due-time, escalation, acknowledgment, and closure policy.
- Archive, void, retention, redaction, erasure, legal hold, and export policy.
- Production persistence, source adapters, authorization, transaction, outbox, and backfill design.
- Representative broadcast scale and provider rate/partial-failure behavior.
- Operator and parent usability validation, assistive technology, real devices, and installed native clients.
