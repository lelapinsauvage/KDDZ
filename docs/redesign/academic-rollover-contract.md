# Kiddz Online Accountable Academic Rollover Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral foundation
**Surface:** `/design-lab/academic-rollover`
**Implementation:** `src/lib/redesign-academic-rollover-contracts.ts`
**Verifier:** `src/scripts/verify-redesign-academic-rollover-contracts.ts`

## Purpose

An academic-year rollover changes the active operating context, child and teacher assignments, child identifiers, historical records, and legacy archive pointers together. It is an infrequent administration flow with a large blast radius. A successful database transaction is necessary, but it is not enough to call the change recoverable or complete.

This contract keeps planning, dry-run preflight, impact review, backup capture, restore verification, approval, execution, validation, rollback, and audit separate. It is synthetic and additive: it specifies and proves the required behavior without replacing the restored production action, changing the database, or claiming that a production restore drill exists today.

## Current Product Audit

The restored implementation already preserves meaningful legacy behavior:

- `/settings/new-year` and `/newyear.php` expose year dates, optional imports, mandatory imports, teacher assignments, child assignments, and generated child numbers.
- `createNewAcademicYear` validates organization-owned selected classes, teachers, and children.
- `createDatabaseSqlDump` attempts `pg_dump` and can emit a structured SQL fallback.
- The snapshot is uploaded under `legacy-archives/newyear/...` before the database mutation.
- One transaction deactivates the old year, creates the new active `SchoolYear`, upserts `LegacyYearDatabase`, reassigns teachers, records `ChildHistory`, and updates children.
- The legacy `ArchiveAndCreate` source contract and `/exportdb.php` route remain covered by parity verification.

The current trust gaps are explicit:

- organization membership is checked, but a dedicated high-risk rollover capability is not;
- no immutable source-revision manifest prevents executing a plan after roster, class, branch, policy, schema, or legacy-adapter drift;
- no dry run proves duplicate child numbers, branch transfer approval, class capacity, or a deliberate policy for unselected active children;
- the uploaded artifact has no persisted checksum or immutability proof;
- a fallback dump can be accepted without an approved recovery-engine decision;
- no isolated restore proves checksum, schema version, row counts, foreign keys, and sampled invariants;
- one actor can currently proceed without distinct operator and data-custodian approvals;
- no organization-scoped rollover lock prevents concurrent execution;
- no durable operation record separates transaction acceptance from post-cutover validation;
- no verified rollback receipt proves restoration of the prior active year and row counts;
- optional import names are preserved in metadata more clearly than their imported domain effects are proven.

## Canonical Objects

| Object | Responsibility | Required evidence |
| --- | --- | --- |
| `AcademicRolloverSession` | One organization-scoped operation | status, revision, organization, source set, immutable history |
| `RolloverSourceRevision` | Locks every planning input | source identity and monotonic revision |
| `AcademicRolloverPlan` | Versioned proposed transition | years, dates, children, teachers, classes, numbers, optional domains, unselected-child policy |
| `RolloverPreflight` | Read-only consequence calculation | blockers, counts, affected classes/branches, exact source revisions |
| `RolloverBackupArtifact` | Candidate restoration artifact | approved engine, database identity, private object key, bytes, SHA-256, immutability, schema version |
| `RolloverRestoreProof` | Evidence that the artifact can restore | isolated target, checksum/schema/rows/FKs/sample checks, time |
| `RolloverApproval` | Human authorization bound to immutable evidence | type, distinct actor, plan revision, verified backup ID, time |
| `RolloverExecutionReceipt` | Atomic cutover acceptance | lock, source revisions, previous/new year, changed counts, actor, time |
| `RolloverValidationReceipt` | Post-cutover invariant result | active-year, assignment, history, adapter, unrelated-row checks |
| `RolloverRollbackReceipt` | Proven recovery from the verified artifact | execution, backup, checksum, prior-year and row-count results |
| `RolloverAuditEvent` | Append-only accountability | event, actor, revision, time, consequence |

## Source Manifest

Planning is withheld until all required sources resolve together:

1. active academic year;
2. active child roster and current assignments;
3. active teacher roster and current assignments;
4. target classes, branches, and capacity inputs;
5. child-number namespace;
6. schema version;
7. legacy year/archive adapter;
8. effective rollover/import policy.

The exact source revisions used by preflight are bound to approvals and execution. A newer or missing revision invalidates the gate. The system must show which source changed and preserve the plan for review; it must not silently recalculate and continue.

## Lifecycle

| State | Meaning | Allowed next proof |
| --- | --- | --- |
| `SOURCE_GAP` | One or more required sources are missing or unconfirmed | confirm complete source manifest |
| `PLAN_DRAFT` | Versioned intent exists only in working memory/persistence | save plan and run read-only preflight |
| `PREFLIGHT_BLOCKED` | At least one deterministic conflict remains | save a new plan revision and rerun |
| `IMPACT_REVIEW` | Dry run is clean; consequences are visible | confirm exact impact |
| `BACKUP_PENDING` | Impact is accepted but no recovery artifact exists | capture approved immutable backup |
| `BACKUP_UNVERIFIED` | Artifact exists but recovery is unproven | complete isolated restore drill |
| `APPROVAL_REQUIRED` | Recovery is proven but approvals are incomplete | collect distinct bound approvals |
| `READY_TO_EXECUTE` | Current plan, sources, recovery, and approvals agree | acquire organization lock and execute |
| `EXECUTION_ACCEPTED` | Atomic transaction committed | run post-cutover validation |
| `VALIDATION_FAILED` | At least one required invariant failed | restore the verified checksum |
| `ROLLBACK_CONFIRMED` | Previous state was restored and checked | retain complete audit evidence |
| `COMPLETED` | All post-cutover invariants passed | retain complete audit evidence |

No state is inferred from button clicks. Each state is derived from durable evidence. Retrying the exact command is idempotent; reusing an idempotency key with changed input is rejected.

## Preflight Rules

Preflight is read-only and must make zero production changes. It blocks at least:

- duplicate proposed child numbers;
- child transfer to another branch without explicit approval;
- teacher transfer to another branch without explicit approval;
- target class capacity exceeded by the proposed assignment;
- active children excluded without a deliberate retain/deactivate policy;
- missing, regressed, or changed source revisions;
- invalid or overlapping dates;
- target-year identity collision;
- optional domain selected without a supported importer and validation rule.

The impact review names selected and unselected children, selected teachers, classes and branches affected, optional domains, and the policy applied to every unselected record. Counts are consequences, not approval evidence.

## Recovery Standard

The approved production engine for this contract is `pg_dump`. The existing fallback SQL export remains useful for compatibility and manual inspection, but it cannot authorize an irreversible rollover until a separately approved restore test demonstrates equivalent recovery.

Backup capture must persist:

- private immutable object identity;
- source database identity without exposing credentials;
- byte length and SHA-256 checksum;
- engine and schema version;
- capture actor/time and bound plan revision.

Verification restores that exact checksum into an isolated target. Completion requires checksum equality, expected schema version, expected row counts, valid foreign keys, and sampled domain invariants. Merely uploading or downloading the file is not verification.

## Authorization And Privacy

| Role | May do | Must not receive |
| --- | --- | --- |
| Administrator/operator | plan, preflight, capture, approve, execute, rollback, inspect full evidence | database credentials or decrypted secrets |
| Rollover coordinator | inspect sources, assignments, blockers, and impact; revise plan | object keys, checksum, database identity, approval actors, execution/audit secrets |
| Data auditor/custodian | verify recovery, approve, validate, inspect audit | child/teacher names, assignment IDs, unnecessary profile data |

Every command requires its named server-side capability and organization scope. UI hiding is not authorization. Operator and data-custodian approvals must come from distinct actors and bind the same plan revision and verified backup ID.

## Atomic Execution And Validation

Execution acquires one organization-scoped rollover lock, re-reads the source manifest, and performs one transaction. The transaction preserves current behavior while adding a durable receipt:

1. deactivate prior active years for the organization;
2. create exactly one new active year;
3. update legacy archive/year adapter records;
4. apply proven optional-domain imports;
5. assign selected teachers;
6. append child history and assign selected children;
7. apply the approved unselected-child policy;
8. persist operation and audit evidence.

Transaction acceptance is not completion. Post-cutover validation proves exactly one active year, all selected children and teachers assigned as planned, child history complete, legacy adapter current, and unrelated rows unchanged. Any failed invariant blocks completion and opens only the verified recovery path.

## Migration Ladder

1. Preserve the current routes, forms, SQL export, `SchoolYear`, `ChildHistory`, `LegacyYearDatabase`, and parity tests.
2. Add dedicated rollover capabilities and fail-closed route/action authorization.
3. Persist rollover session, plan revisions, source manifests, audit events, idempotency receipts, and organization lock.
4. Extract current validation into a server preflight that performs no mutation.
5. Persist checksummed private backup metadata and enforce an approved engine.
6. Add an isolated restore worker and durable restore-proof receipt.
7. Add distinct approval records bound to plan and backup revisions.
8. Move the existing transaction behind fresh-source, lock, recovery, and approval gates.
9. Add post-cutover validation and verified rollback orchestration.
10. Prove optional imports as domain mutations, then migrate the UI without removing `/newyear.php` or `/exportdb.php` until compatibility telemetry and rollback gates pass.

## Executable Evidence

The deterministic verifier proves all twelve lifecycle states plus:

- source completeness and non-regression;
- invalid-date, duplicate-number, cross-branch, capacity, and unselected-policy blocking;
- zero production change during preflight;
- exact impact counts;
- immutable checksum metadata;
- fallback-engine and incomplete-restore rejection;
- distinct, revision-bound approvals;
- exact idempotency and changed-input rejection;
- stale-source and missing-lock execution rejection;
- accepted execution counts;
- failed validation, verified rollback, and successful completion;
- coordinator and auditor privacy projection;
- capability denial.

The browser lab exists to test role comprehension, state hierarchy, keyboard/focus behavior, live announcements, responsive reflow, and privacy projections. It does not connect to production records.

## Release Gates

Production activation remains blocked on:

- approved high-risk capability ownership and dual-control policy;
- persistent schema and migration review;
- private immutable storage configuration and retention policy;
- successful isolated restore drill using production-equivalent encrypted data handling;
- representative-scale performance and lock/concurrency tests;
- optional-import implementation and domain invariant proofs;
- operator, data-custodian, and support runbook validation;
- assisted rollback exercise and disaster-recovery ownership;
- legacy/PHP, exports, database, native/parent, and restored-function parity;
- selected visual territory and production design-system migration.

Until those gates close, the current production action remains the restored compatibility implementation, and this contract remains the target trust boundary.
