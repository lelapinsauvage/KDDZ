# Production Cutover Runbook

This runbook orders the final legacy acceptance gates into a production cutover sequence. It complements `docs/legacy-production-acceptance-gates.md` and `docs/production-acceptance-evidence-template.md`; keep all evidence non-secret and store raw credentials, database URLs, webhook URLs, and private user data outside the repo.

## Phase 0: Freeze Inputs

Exit criteria:

- `PROD-DUMPS`: every canonical school-year SQL dump is identified.
- `PROD-DUMPS`: the first migration source is selected and recorded.
- `PROD-CRON`: production crontab entries, timezone, `gid`, and `code` parameters are recovered.
- `PROD-CRON`: missing `../cronjob/functions.php` and `../cronjob/messages.php` are recovered or explicitly retired.

Evidence pointers to set for the readiness audit:

```bash
LEGACY_PRODUCTION_DUMP_MANIFEST=<non-secret report id or local evidence file>
LEGACY_FIRST_MIGRATION_SOURCE_REPORT=<non-secret first migration source and import timing id/path>
PRODUCTION_CRONTAB_EVIDENCE=<non-secret report id or local evidence file>
CRON_HELPER_DECISION_REPORT=<non-secret recovered-or-retired helper decision id/path>
CRON_SCHEDULE_COVERAGE_REPORT=<non-secret timezone, gid/code, daily, and 10-minute coverage id/path>
```

Preview the full evidence/provider requirement list before collecting values:

```bash
pnpm tsx src/scripts/audit-production-readiness.ts --list-requirements
pnpm tsx src/scripts/audit-production-readiness.ts --list-requirements --gate=PROD-CRON
pnpm tsx src/scripts/report-production-evidence-checklist.ts --gate=PROD-CRON
pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --gate=PROD-CRON --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts /secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --branch=legacy-parity-runbook --commit=<release-commit-sha>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso>
pnpm run verify:production-gates
pnpm tsx src/scripts/verify-production-readiness-audit-contract.ts
```

Use `docs/production-readiness.env.example` as the non-secret list of evidence pointer names to configure in the production secret/evidence manager.

Stop the cutover if the authoritative dump set is ambiguous, the selected first migration dump is not approved, or cron ownership cannot decide whether commented legacy blocks remain disabled.

## Phase 1: Rehearse Import And Media

Gates covered: `PROD-MEDIA`, `PROD-RECON`.

Run against a staging database built from the canonical production import:

```bash
pnpm tsx src/scripts/migration/migrate-all.ts
pnpm tsx src/scripts/migration/audit-legacy-files.ts
pnpm tsx src/scripts/migration/export-legacy-files.ts --out-dir=/tmp/kiddzonl-legacy-file-export
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json
pnpm tsx src/scripts/migration/apply-legacy-file-urls.ts \
  --manifest=/tmp/kiddzonl-legacy-file-upload.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-url-apply.json
pnpm tsx src/scripts/migration/reconcile-migration-counts.ts \
  --json=/tmp/kiddzonl-migration-reconciliation.json \
  --fail-on-warning
```

Evidence pointers to set:

```bash
LEGACY_MEDIA_AUDIT_REPORT=<non-secret audit report id/path>
LEGACY_MEDIA_EXPORT_MANIFEST=<non-secret export manifest id/path>
LEGACY_MEDIA_UPLOAD_MANIFEST=<non-secret upload manifest id/path>
LEGACY_MEDIA_URL_APPLY_MANIFEST=<non-secret URL apply manifest id/path>
MIGRATION_RECONCILIATION_REPORT=<non-secret reconciliation report id/path>
MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT=<non-secret mismatch/skipped/orphan acceptance id/path>
```

Stop the cutover if reconciliation has unresolved `warning`, `missing`, or `error` rows, if media URL application has unsupported strong-provenance rows that should have been rewritten, or if skipped/orphan counts were not reviewed and accepted.

## Phase 2: Configure Runtime Services

Gates covered: `PROD-CRON`, `PROD-PROVIDERS`.

Configure hosted scheduler and provider settings outside the repo:

```bash
CRON_SECRET=<secret value outside repo>
# or
VERCEL_CRON_SECRET=<secret value outside repo>
```

Configure only the providers approved for production:

```bash
PUSH_DELIVERY_PROVIDER=onesignal|webhook|disabled
EMAIL_DELIVERY_PROVIDER=resend|webhook|disabled
SMS_DELIVERY_PROVIDER=webhook|disabled
WHATSAPP_DELIVERY_PROVIDER=webhook|disabled
```

Evidence pointers to set:

```bash
PROVIDER_DELIVERY_ACCEPTANCE_REPORT=<non-secret delivery summary id/path>
PROVIDER_CHANNEL_ROLLOUT_REPORT=<non-secret family/channel rollout matrix id/path>
PROVIDER_RESPONSE_ID_AUDIT_REPORT=<non-secret provider response-id audit id/path>
CRON_SCHEDULE_COVERAGE_REPORT=<non-secret timezone, gid/code, daily, and 10-minute coverage id/path>
HOSTED_SCHEDULER_EVIDENCE=<non-secret schedule report id/path>
```

Run:

```bash
pnpm tsx src/scripts/audit-production-readiness.ts --out=/tmp/kiddzonl-production-readiness.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts /secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --branch=legacy-parity-runbook --commit=<release-commit-sha>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso>
```

Stop the cutover if the readiness audit still reports missing cron/provider evidence, or if any configured provider cannot produce sent/skipped/failed audit summaries without exposing secrets.

## Phase 3: Production Import And Backfill

Gates covered: `PROD-RECON`, `PROD-BACKFILL`.

Run the approved import on the production target, rerun media URL application if production object keys differ, then rerun reconciliation against the production target.

Backfill only items imported before newly preserved fields existed, including medical `db_id` and class dashboard year-selector dependencies.

Evidence pointers to set:

```bash
LEGACY_BACKFILL_ACCEPTANCE_REPORT=<non-secret backfill report id/path>
```

Stop the cutover if class dashboard medical-year counts, preserved `db_id`, or other source-provenance fields differ from the approved staging rehearsal.

## Phase 4: Production Functional Acceptance

Run local and production-facing verifiers after the production import:

```bash
pnpm tsx src/scripts/verify-parent-credentialed-native-e2e.ts
pnpm tsx src/scripts/verify-legacy-calls-contract.ts
python3 -m json.tool docs/page-parity-matrix.json >/dev/null
```

Then complete manual acceptance for:

- `PROD-NATIVE`: iOS and Android against `master.php` and literal `/ws/*.php` URLs.
- `PROD-NATURE`: production `notifications_nature` ordering, labels, active flags, table/column mappings, and populated parent groups.
- `PROD-PRINT`: accounting matrix and receipt stationery.
- `PROD-CALLS`: real submitted and draft `t_form_6` rows through modern and PHP bridge URLs.
- `PROD-NURSERY`: `nurseryinfo.php` / `nurseryinfo.js` visual and finalization semantics.
- `PROD-ACL`: sampled production levels for denied PAGE routes, hidden ACTION controls, and direct mutation blocks.

Evidence pointers to set:

```bash
NATIVE_IOS_ACCEPTANCE_REPORT=<non-secret report id/path>
NATIVE_ANDROID_ACCEPTANCE_REPORT=<non-secret report id/path>
NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=<non-secret master.php and ws/*.php report id/path>
NATIVE_CRASH_PARSER_AUDIT_REPORT=<non-secret crash/parser audit id/path>
NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT=<non-secret parent login/daily/absence/finance/food/holiday report id/path>
NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT=<non-secret notifications/messages/alarms report id/path>
NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT=<non-secret push-token registration/show/delete report id/path>
NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=<non-secret report id/path>
NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=<non-secret populated parent group comparison id/path>
PRINT_STATIONERY_ACCEPTANCE_REPORT=<non-secret report id/path>
REAL_CALL_ROWS_ACCEPTANCE_REPORT=<non-secret report id/path>
NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=<non-secret report id/path>
LEGACY_ACL_ACCEPTANCE_REPORT=<non-secret report id/path>
```

Stop the cutover if either native app crashes on parser-safe endpoints, if production `notifications_nature` creates missing or reordered parent groups, if print output is rejected, or if any denied production user can access a guarded page/action.

## Phase 5: Final Gate Closure

Populate `docs/production-acceptance-evidence-template.md` in the release record, not with private data in the repo. The Run Metadata section must name the archived redacted readiness report, closeout summary, partial gate report, and production evidence checklist.

Final command:

```bash
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials
pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
```

The legacy restoration goal can only be marked complete when:

- readiness audit reports all gates ready to review,
- every ready gate has dated production evidence or an explicit retirement decision,
- final acceptance evidence says release decision `accepted` and remaining production tickets `none`,
- `docs/page-parity-matrix.json` has no unresolved production/external partial rows,
- the current branch/commit is recorded in the release evidence,
- redacted readiness and closeout summary JSON files are archived with the release evidence,
- the filled production acceptance record is archived and hash-bound by the closeout summary,
- the production evidence checklist JSON is archived with the release evidence,
- the production evidence package manifest is archived and verifies all closeout artifact hashes,
- the final closeout command passes with `--require-zero-partials`,
- no stop condition above remains open.
