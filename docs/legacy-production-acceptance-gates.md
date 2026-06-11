# Legacy Production Acceptance Gates

This document tracks the final external gates that remain after local legacy parity work. The local tracker currently reports 1696 complete rows out of 1713 total rows, or 99% done and 1% left. The remaining rows stay partial because final proof depends on canonical production data, provider credentials, hosted schedules, physical/native-device acceptance, or production print/stationery review.

Do not put secrets in this file. Record provider names, environment variable names, command output summaries, response ids, counts, and dated acceptance notes only.

Use `docs/production-acceptance-evidence-template.md` as the non-secret release record shape when collecting final evidence for these gates.

Use `docs/production-cutover-runbook.md` for the ordered production execution sequence and stop conditions.

Use `docs/partial-production-gate-map.md` to trace each remaining page-parity partial row to its blocking production gate.

Use `docs/production-readiness.env.example` as the non-secret environment/evidence pointer template for the readiness audit.

## Gate Register

| Gate | Scope | Evidence Required To Close |
| --- | --- | --- |
| PROD-DUMPS | Canonical SQL dump and first-migration source selection. | Identify the authoritative production SQL dump for each school year, record which dump/year seeds the first migration, and keep checksum/date/source notes outside the repo when they contain sensitive paths. |
| PROD-MEDIA | Canonical media export and object-storage import. | Run the legacy file audit/export/import pipeline against the canonical media tree, upload to the selected storage provider, apply strong-provenance URL rewrites, and resolve missing/default/no-file rows without guessing. |
| PROD-RECON | Production count reconciliation. | Run migration reconciliation against the canonical MySQL import and target PostgreSQL database, then resolve or explicitly accept every warning, skipped row, orphan, and count mismatch. |
| PROD-CRON | Production crontab and hosted scheduler cutover. | Recover production crontab entries, timezone, `gid`/`code` parameters, and the missing `../cronjob/*` helper decision; configure hosted daily and 10-minute schedules only for approved families. |
| PROD-PROVIDERS | Push, email, SMS, and WhatsApp credential rollout. | Configure or rotate `PUSH_DELIVERY_PROVIDER`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `PUSH_DELIVERY_WEBHOOK_URL`, `EMAIL_DELIVERY_PROVIDER`, `EMAIL_DELIVERY_WEBHOOK_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_DELIVERY_PROVIDER`, `SMS_DELIVERY_WEBHOOK_URL`, `WHATSAPP_DELIVERY_PROVIDER`, `WHATSAPP_DELIVERY_WEBHOOK_URL`, and `LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL` as applicable; record sent/skipped/failed summaries and provider response ids without secret values. |
| PROD-NATIVE | Real iOS and Android native-device acceptance. | Run the legacy iOS and Android builds against the modern deployment using `master.php` and literal `/ws/*.php` URLs, then verify active parent login, daily, absence, finance, food, holiday, notifications, messages, alarms, push-token registration, and parser stability on real devices or official simulators/emulators. |
| PROD-NATURE | Production `notifications_nature` acceptance. | After canonical import, compare `notifications_nature` ordering, names, active flags, table/column mappings, and populated parent notification groups against legacy production behavior. |
| PROD-PRINT | Accounting, invoice, and receipt stationery acceptance. | Review `/accounting` matrix print and `/accounting/invoice/[id]` receipt output against production logos, paper/stationery, browser print settings, amount wording, and receipt numbering expectations. |
| PROD-CALLS | Real migrated call-row acceptance. | After production import, smoke `/calls/[id]`, `/call.php?fid=`, branch calls, and child calls against real migrated `t_form_6` rows instead of local temporary fixtures. |
| PROD-NURSERY | Exact nursery compliance acceptance. | Compare `nurseryinfo.php` and `nurseryinfo.js` visual layout, finalization/progress semantics, ministry form output, attachment handling, and branch-selection edge cases against production data. |
| PROD-ACL | Final legacy PAGE/ACTION guard QA. | Re-audit migrated `system_actions*`, `actions_control*`, and non-left-menu `Check::protectPageOrFunction(...)` coverage against production levels and users, including denied direct URLs and mutation guards. |
| PROD-BACKFILL | Imports that predated newly preserved legacy fields. | Rerun or backfill any data imported before provenance fields such as medical `db_id`, class dashboard year selectors, or other newly preserved legacy columns existed. |

## Required Commands And Evidence

Run these commands as part of production acceptance and paste only the non-sensitive result summary into the release notes or acceptance record:

```bash
pnpm tsx src/scripts/audit-production-readiness.ts --list-requirements
pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --out=/tmp/kiddzonl-production-readiness.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts /secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --branch=legacy-parity-runbook --commit=<release-commit-sha>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials
pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
pnpm run verify:production-gates
pnpm tsx src/scripts/verify-production-acceptance-evidence-record-contract.ts
pnpm tsx src/scripts/verify-production-closeout-contract.ts
pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts
pnpm tsx src/scripts/verify-production-evidence-package-contract.ts
pnpm tsx src/scripts/report-production-evidence-checklist.ts --gate=PROD-CRON
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --out=/tmp/kiddzonl-production-evidence-checklist.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-partials.ts --json --out=/tmp/kiddzonl-production-partials.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-evidence-checklist-contract.ts
pnpm tsx src/scripts/verify-production-partial-report-contract.ts
pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts
pnpm tsx src/scripts/verify-production-readiness-audit-contract.ts
pnpm tsx src/scripts/verify-parent-credentialed-native-e2e.ts
pnpm tsx src/scripts/verify-legacy-calls-contract.ts
pnpm tsx src/scripts/migration/reconcile-migration-counts.ts --help
python3 -m json.tool docs/page-parity-matrix.json >/dev/null
```

`pnpm run verify:production-gates` is the local preflight suite for the production gate control plane. It wraps `src/scripts/verify-production-gate-suite.ts`, which runs the production gate contract, readiness audit contract, `src/scripts/verify-production-acceptance-evidence-record-contract.ts`, closeout contract, closeout summary contract, evidence package contract, partial report contract, evidence checklist contract, artifact consistency contract, matrix JSON validation, and tracker assertion.

`audit-production-readiness.ts` is redacted by design: it prints only whether evidence pointers and provider variables are present, never their values. Use `--list-requirements` to print the required evidence pointers/provider setups before credentials exist, `--env-file=<path>` to load a private env/evidence file outside the repo, and `--out=<path>` to write the same redacted JSON report into the production evidence package. Pass `--generated-at=<iso>` when freezing release artifacts so the readiness report timestamp matches the partial report, evidence checklist, and closeout summary timestamps. It exits nonzero until all production evidence pointers are configured. Evidence pointers may be file paths or external record identifiers and are named `LEGACY_PRODUCTION_DUMP_MANIFEST`, `LEGACY_FIRST_MIGRATION_SOURCE_REPORT`, `LEGACY_MEDIA_AUDIT_REPORT`, `LEGACY_MEDIA_EXPORT_MANIFEST`, `LEGACY_MEDIA_UPLOAD_MANIFEST`, `LEGACY_MEDIA_URL_APPLY_MANIFEST`, `MIGRATION_RECONCILIATION_REPORT`, `MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT`, `PRODUCTION_CRONTAB_EVIDENCE`, `CRON_HELPER_DECISION_REPORT`, `CRON_SCHEDULE_COVERAGE_REPORT`, `HOSTED_DAILY_SCHEDULE_EVIDENCE`, `HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE`, `HOSTED_SCHEDULER_EVIDENCE`, `PROVIDER_DELIVERY_ACCEPTANCE_REPORT`, `PROVIDER_CHANNEL_ROLLOUT_REPORT`, `PROVIDER_RESPONSE_ID_AUDIT_REPORT`, `NATIVE_IOS_ACCEPTANCE_REPORT`, `NATIVE_ANDROID_ACCEPTANCE_REPORT`, `NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT`, `NATIVE_CRASH_PARSER_AUDIT_REPORT`, `NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT`, `NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT`, `NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT`, `NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT`, `NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT`, `PRINT_STATIONERY_ACCEPTANCE_REPORT`, `REAL_CALL_ROWS_ACCEPTANCE_REPORT`, `NURSERY_COMPLIANCE_ACCEPTANCE_REPORT`, `LEGACY_ACL_ACCEPTANCE_REPORT`, and `LEGACY_BACKFILL_ACCEPTANCE_REPORT`.

`verify-production-acceptance-evidence-record.ts` validates a filled non-secret production acceptance record against `docs/production-acceptance-evidence-template.md`. Pass `--readiness-report=<path>` to require the filled record to match the redacted `audit-production-readiness.ts --out=<path>` JSON summary and gate statuses. Pass `--summary-report=<path>`, `--partial-report=<path>`, and `--checklist-report=<path>` to require the release evidence to name the exact archived closeout summary, partial gate report, and evidence checklist. Pass `--partial-digest=<sha256>` and `--checklist-digest=<sha256>` during one-command closeout to require the record to name the generated partial/checklist artifact hashes; pass `--readiness-digest=<sha256>` when verifying an already-frozen archived readiness report. Pass `--branch=<branch>` and `--commit=<sha>` to require the release evidence to name the exact modern branch/commit under acceptance. It fails if any required gate section or evidence field is missing, still has a placeholder value, the readiness report is not fully ready, the branch/commit is stale, final decision is not accepted, remaining production tickets are not `none`, archived closeout/partial/checklist artifact pointers are missing or stale, artifact digest fields are missing or stale, or the record/report contains obvious raw URLs, secret assignments, phone numbers, or other private evidence that belongs outside the repo.

`pnpm run closeout:production -- ...` is the one-command production closeout wrapper around `src/scripts/run-production-closeout.ts`. It writes the redacted readiness report from the private env/evidence file, verifies the filled production acceptance record against that report, binds the accepted evidence to the specified branch and commit, and can write a redacted closeout summary with `--summary-out=<path>`, the current partial gate report with `--partials-out=<path>`, and the current production evidence checklist with `--checklist-out=<path>`. When both partial and checklist reports are requested, closeout also runs `verify-production-artifact-consistency-contract.ts`. The summary includes `schemaVersion: 1`, its own `generatedAt` ISO timestamp, redacted readiness counts, page-parity tracker counts, branch, commit, readiness report path, evidence record path, partial report path, partial report counts, evidence checklist path, evidence checklist counts, artifact SHA-256 digests, and artifact consistency status, and is safe for release notes. `--branch=<branch>` and `--commit=<sha>` are required with `--require-zero-partials` so final closeout cannot fall back to an implicit local git ref. Use the same `--generated-at=<iso>` value for readiness, partial, checklist, and closeout artifacts so their SHA-256 values remain reproducible.

`verify-production-closeout-summary-contract.ts` verifies an archived closeout summary against the saved artifact paths and SHA-256 digests after the closeout has been copied into the release evidence package. Pass the archived summary path plus `--readiness-report=<path>`, `--evidence-record=<path>`, `--partial-report=<path>`, and `--checklist-report=<path>` to prove the summary still points at the same redacted readiness report, filled production acceptance record, partial report, and evidence checklist, with matching counts and hashes. It also reruns `verify-production-acceptance-evidence-record.ts` against the archived acceptance record using the closeout summary's stable artifact paths, partial/checklist hashes, branch, and commit. Pass `--branch=<branch>` and `--commit=<sha>` to bind the archived summary to the intended release ref; both are required with `--require-zero-partials` during final closure so the summary cannot be accepted without an explicit release ref.

`verify-production-evidence-package-contract.ts` verifies the full archived evidence package and can write a redacted package manifest with `--manifest-out=<path>`. The manifest includes `schemaVersion: 1`, a top-level `generatedAt` timestamp from the closeout summary, SHA-256 digests for the closeout summary itself, redacted readiness report, filled production acceptance record, partial gate report, and evidence checklist, plus `generatedAt` metadata for JSON artifacts that carry it. Pass `--manifest=<path>` later to prove the archived package still matches the saved manifest. Pass `--branch=<branch>` and `--commit=<sha>` to bind the package to the intended release branch/commit; both are required with `--require-zero-partials` during final closure so the package cannot be accepted without an explicit release ref.

Use `--require-zero-partials` only for final legacy closure; it fails until `docs/page-parity-matrix.json` has no partial rows left and requires `--summary-out`, `--partials-out`, and `--checklist-out` so the final evidence artifacts are archived.

`report-production-partials.ts` joins `docs/page-parity-matrix.json` with `docs/partial-production-gate-map.md` and emits the remaining partial rows, blocking gate ids, and closure reasons as markdown or redacted JSON for production tracking.

Use `--gate=PROD-CRON` or any other gate id to inspect one production blocker at a time with the readiness audit and evidence checklist commands.

`report-production-partials.ts` and `report-production-evidence-checklist.ts` emit redacted JSON artifacts with `generatedAt` ISO timestamps so archived release packages can prove when the current partial-gate map and required evidence checklist were produced. The readiness, partial, checklist, closeout summary, and evidence package JSON artifacts carry `schemaVersion: 1`.

`report-production-evidence-checklist.ts` emits the non-secret evidence fields required by `docs/production-acceptance-evidence-template.md` for each production gate, plus the mapped partial rows that each gate can close. Use `--gate=PROD-CRON` to focus one gate, or `--json --out=<path>` to archive the full checklist beside the readiness, closeout, and partial reports.

The reconciliation command must be run with the same canonical MySQL import and target PostgreSQL database used for cutover, following `src/scripts/migration/README.md`. The `--help` command above is only a local command-shape sanity check.

Provider evidence should include the family/channel, recipient counts, sent/skipped/failed counts, provider response ids where available, and the audit field or log row that preserved the attempt. It must not include raw tokens, API keys, webhook URLs, passwords, parent phone numbers, or child/parent private details.

## Completion Rule

The remaining 1% is complete only when every gate above has dated production evidence or an explicit owner-approved retirement decision. Local verifier scripts, browser smokes, and matrix rows are necessary but not sufficient for these gates unless they were run against the canonical production import and configured production-like services.

Before marking the overall legacy restoration goal complete:

- `docs/page-parity-matrix.json` must have no partial rows that depend on unresolved production or external acceptance.
- `docs/top-20-restoration-gaps.md`, `docs/cron-notification-matrix.md`, and `docs/native-acceptance-ledger.md` must agree with this gate register.
- Provider credentials and hosted schedules must be configured outside the repo, with non-secret evidence recorded.
- Native-device acceptance must prove the restored `master.php` and `/ws/*.php` route handlers from real native clients.
- Migration reconciliation must be run against the canonical production dumps, not only sample or local development data.
