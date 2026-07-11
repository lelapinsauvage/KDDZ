# Inspection Package Contract

**Status:** Territory-neutral executable J07 contract
**Scope:** Inspection preflight, evidence manifest, exceptions, redaction, server generation, provenance, access, and audit
**Production impact:** None. This is additive synthetic evidence; existing exports, backups, storage, routes, database models, and native contracts are unchanged.

## Decision

Kiddz Online must not imply that a spreadsheet, printout, or database backup is a complete inspection package. A trustworthy package begins with a policy-supplied requirement profile and ends with a checksummed artifact whose exact evidence revisions, authorized exceptions, recipient redactions, generation history, access expiry, and downloads are traceable.

The product does not hard-code a jurisdiction's evidence rules. An approved profile provides its identity, version, effective date, policy source, requirement domains, consequences, and sensitivity. Operators must validate that policy before production use.

## Accountable Object

`InspectionPackage` owns:

- branch, date range, recipient, and purpose;
- selected profile and profile version;
- manifest entries across branch, child, staff, policy, medical, attendance, finance, and facility domains;
- exact evidence identity and source revision;
- missing, expired, inconsistent, and restricted states;
- authorized exception authority, reason, actor, and timestamp;
- recipient-specific redaction fields, reason, actor, and timestamp;
- generation job, retry attempt, progress, and failure code;
- manifest checksum, artifact checksum, source revision snapshot, and generator;
- expiring recipient access grants;
- append-only download and source-change events.

## State Machine

`PROFILE_REQUIRED -> BLOCKED -> EXCEPTION_REVIEW -> REDACTION_REVIEW -> READY -> GENERATING -> READY_TO_DOWNLOAD`

Generation can move to `GENERATION_FAILED` and retry against the same manifest revision. An expired grant produces `LINK_EXPIRED`; it does not silently extend access. A source revision that advances after generation produces `HISTORICAL`; it does not rewrite the prior artifact or claim that the artifact remains current.

## Invariants

1. Generation is impossible until the selected profile has no unresolved blocking evidence.
2. Exception-allowed evidence needs explicit authority and reason bound to the current source revision.
3. Restricted evidence needs a recipient-specific redaction plan bound to the current source revision.
4. A stale package, manifest, evidence, exception, or redaction revision fails closed.
5. Exact idempotent command replay returns the accepted result; a reused key with changed input is rejected.
6. Failed jobs retain their manifest revision and retry history.
7. Completion requires SHA-256-shaped manifest and artifact checksums plus an exact source revision snapshot.
8. Download access expires explicitly; regeneration creates a new grant and audit event.
9. Every accepted download is an append-only event.
10. Sensitive titles, owners, and source paths are replaced in projections without `inspection.view_sensitive`.
11. A generated artifact is historical after any included source advances; history is preserved.
12. `DATABASE_BACKUP` is never accepted as `INSPECTION_PACKAGE`.

## Capability Boundary

- `inspection.preflight`: choose a profile and inspect package readiness.
- `inspection.view_sensitive`: view restricted evidence and approve its redaction plan.
- `inspection.contribute`: replace missing or expired source evidence.
- `inspection.accept_exception`: accept only profile-permitted exceptions with authority and reason.
- `inspection.generate`: start, fail, retry, and complete a server-owned generation job.
- `inspection.download`: regenerate expiring access and record a granted download.
- `inspection.audit`: inspect history and mark generated artifacts historical after source change.

UI visibility is never authorization. Server actions must repeat organization, branch, relationship, capability, current-revision, recipient, and grant checks.

## Existing Product Audit

The current compliance surfaces own branch compliance fields, branch documents, staff documents, file names, dates, expiries, and status. Current monthly reports own filtered attendance tables plus print/TableTools exports. `/settings/export` generates feature-specific browser downloads, while `/exportdb.php` generates an admin-only SQL restoration artifact. The object-storage layer stores and serves files but does not create an inspection manifest or download audit.

Those surfaces remain available for parity. They become possible evidence sources only after production adapters can identify exact records, versions, access policy, and redaction behavior. Their presence alone cannot satisfy preflight.

## Additive Production Migration

1. Obtain approved first-market profiles from accountable policy owners; never infer legal requirements from fixture labels.
2. Add versioned profile, package, manifest-entry, exception, redaction, job, artifact, access-grant, and audit-event persistence.
3. Create read-only source adapters for existing compliance, document, attendance, medical, finance, facility, report, and storage records.
4. Define source revisions for mutable legacy records and immutable version identifiers for generated records.
5. Add server capability checks and recipient/relationship scope independently from navigation visibility.
6. Generate packages asynchronously, encrypt stored artifacts, checksum manifests and artifacts, and use private expiring access.
7. Preserve existing CSV/XLSX/PDF/print exports and SQL backup until equivalent behavior and parity evidence pass.
8. Validate package contents, wording, retention, redaction, and exception authority with nursery operators, policy owners, privacy/security owners, and inspectors before production activation.

## Verification Evidence

The deterministic verifier covers missing profile, blockers, stale revisions, unauthorized actions, exception authority, redaction, no-leak projection, generation failure/retry, checksums, expiry/regeneration, download audit, source drift, idempotency, and the SQL-backup distinction. `/design-lab/inspection` exposes the same states for desktop, tablet, mobile, role, focus, reduced-motion, overflow, and axe inspection.
