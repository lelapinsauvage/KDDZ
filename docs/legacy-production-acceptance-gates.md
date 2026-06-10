# Legacy Production Acceptance Gates

This document tracks the final external gates that remain after local legacy parity work. The local tracker currently reports 1696 complete rows out of 1713 total rows, or 99% done and 1% left. The remaining rows stay partial because final proof depends on canonical production data, provider credentials, hosted schedules, physical/native-device acceptance, or production print/stationery review.

Do not put secrets in this file. Record provider names, environment variable names, command output summaries, response ids, counts, and dated acceptance notes only.

Use `docs/production-acceptance-evidence-template.md` as the non-secret release record shape when collecting final evidence for these gates.

Use `docs/production-cutover-runbook.md` for the ordered production execution sequence and stop conditions.

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
pnpm tsx src/scripts/audit-production-readiness.ts --out=/tmp/kiddzonl-production-readiness.json
pnpm tsx src/scripts/verify-parent-credentialed-native-e2e.ts
pnpm tsx src/scripts/verify-legacy-calls-contract.ts
pnpm tsx src/scripts/migration/reconcile-migration-counts.ts --help
python3 -m json.tool docs/page-parity-matrix.json >/dev/null
```

`audit-production-readiness.ts` is redacted by design: it prints only whether evidence pointers and provider variables are present, never their values. Use `--list-requirements` to print the required evidence pointers/provider setups before credentials exist, and use `--out=<path>` to write the same redacted JSON report into the production evidence package. It exits nonzero until all production evidence pointers are configured. Evidence pointers may be file paths or external record identifiers and are named `LEGACY_PRODUCTION_DUMP_MANIFEST`, `LEGACY_MEDIA_EXPORT_MANIFEST`, `LEGACY_MEDIA_UPLOAD_MANIFEST`, `MIGRATION_RECONCILIATION_REPORT`, `PRODUCTION_CRONTAB_EVIDENCE`, `HOSTED_SCHEDULER_EVIDENCE`, `NATIVE_IOS_ACCEPTANCE_REPORT`, `NATIVE_ANDROID_ACCEPTANCE_REPORT`, `NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT`, `PRINT_STATIONERY_ACCEPTANCE_REPORT`, `REAL_CALL_ROWS_ACCEPTANCE_REPORT`, `NURSERY_COMPLIANCE_ACCEPTANCE_REPORT`, `LEGACY_ACL_ACCEPTANCE_REPORT`, and `LEGACY_BACKFILL_ACCEPTANCE_REPORT`.

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
