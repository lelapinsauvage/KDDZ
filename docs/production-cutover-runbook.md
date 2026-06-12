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
LEGACY_SCHOOL_YEAR_DUMP_COVERAGE_REPORT=<non-secret every school-year dump coverage id/path>
LEGACY_DUMP_CHECKSUM_MANIFEST=<non-secret dump checksum manifest id/path>
LEGACY_FIRST_MIGRATION_SOURCE_REPORT=<non-secret first migration source and import timing id/path>
PRODUCTION_CRONTAB_EVIDENCE=<non-secret report id or local evidence file>
CRON_HELPER_DECISION_REPORT=<non-secret recovered-or-retired helper decision id/path>
CRON_SCHEDULE_COVERAGE_REPORT=<non-secret timezone, gid/code, daily, and 10-minute coverage id/path>
```

Preview the full evidence/provider requirement list before collecting values:

```bash
pnpm tsx src/scripts/audit-production-readiness.ts --list-requirements
pnpm tsx src/scripts/render-production-readiness-env-template.ts --out=/secure/private-readiness.env
pnpm tsx src/scripts/audit-production-readiness.ts --list-requirements --gate=PROD-CRON
pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=PROD-CRON
pnpm tsx src/scripts/report-production-evidence-checklist.ts --gate=PROD-CRON
pnpm tsx src/scripts/report-production-gate-status.ts --json --blocking-only --out=/tmp/kiddzonl-production-blocking-gate-status.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=/tmp/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-preflight-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json
pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --gate=PROD-CRON --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts /secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --readiness-digest=<readiness-sha256> --partial-digest=<partials-sha256> --checklist-digest=<checklist-sha256> --preflight-digest=<preflight-sha256> --branch=legacy-parity-runbook --commit=<release-commit-sha>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso>
pnpm run verify:production-gates
pnpm tsx src/scripts/verify-production-readiness-env-template-contract.ts
pnpm tsx src/scripts/verify-production-readiness-audit-contract.ts
```

Use `render-production-readiness-env-template.ts` to create the private readiness env skeleton outside git, then fill that private file with evidence pointers in the production secret/evidence manager.

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
PROVIDER_CHANNEL_DECISION_REPORT=<non-secret provider enablement/disabled decision id/path>
PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=<non-secret P01-P03/P05-P09/P11-P15/P17 provider coverage id/path>
CRON_SCHEDULE_COVERAGE_REPORT=<non-secret timezone, gid/code, daily, and 10-minute coverage id/path>
HOSTED_DAILY_SCHEDULE_EVIDENCE=<non-secret hosted daily schedule family list id/path>
HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE=<non-secret hosted 10-minute schedule family list id/path>
HOSTED_SCHEDULER_EVIDENCE=<non-secret schedule report id/path>
CRON_PARTIAL_ROW_COVERAGE_REPORT=<non-secret P01-P07/P10/P12 cron coverage id/path>
```

Generate focused non-secret coverage reports from the parity matrix before filling the gate-specific evidence pointers. Archive the focused partial report and focused checklist together, then verify each pair before using the partial row coverage evidence pointer:

```bash
pnpm tsx src/scripts/report-production-focused-artifacts.ts --out-dir=/tmp/kiddzonl-production-focused-artifacts --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-focused-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-focused-artifacts/kiddzonl-production-focused-artifacts.json
pnpm tsx src/scripts/report-production-partials.ts --json --gate=PROD-CRON --out=/tmp/kiddzonl-production-cron-partials.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --gate=PROD-CRON --out=/tmp/kiddzonl-production-cron-checklist.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts --partial-report=/tmp/kiddzonl-production-cron-partials.json --checklist-report=/tmp/kiddzonl-production-cron-checklist.json
pnpm tsx src/scripts/report-production-partials.ts --json --gate=PROD-PROVIDERS --out=/tmp/kiddzonl-production-provider-partials.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --gate=PROD-PROVIDERS --out=/tmp/kiddzonl-production-provider-checklist.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts --partial-report=/tmp/kiddzonl-production-provider-partials.json --checklist-report=/tmp/kiddzonl-production-provider-checklist.json
pnpm tsx src/scripts/report-production-partials.ts --json --gate=PROD-NATIVE --out=/tmp/kiddzonl-production-native-partials.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --gate=PROD-NATIVE --out=/tmp/kiddzonl-production-native-checklist.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts --partial-report=/tmp/kiddzonl-production-native-partials.json --checklist-report=/tmp/kiddzonl-production-native-checklist.json
pnpm tsx src/scripts/report-production-partials.ts --json --gate=PROD-NATURE --out=/tmp/kiddzonl-production-nature-partials.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --gate=PROD-NATURE --out=/tmp/kiddzonl-production-nature-checklist.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts --partial-report=/tmp/kiddzonl-production-nature-partials.json --checklist-report=/tmp/kiddzonl-production-nature-checklist.json
```

Run:

```bash
pnpm tsx src/scripts/audit-production-readiness.ts --out=/tmp/kiddzonl-production-readiness.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/report-production-gate-status.ts --json --out=/tmp/kiddzonl-production-gate-status.json --generated-at=<release-generated-at-iso>
pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts /secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --readiness-digest=<readiness-sha256> --partial-digest=<partials-sha256> --checklist-digest=<checklist-sha256> --preflight-digest=<preflight-sha256> --branch=legacy-parity-runbook --commit=<release-commit-sha>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso>
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
NATIVE_PARTIAL_ROW_COVERAGE_REPORT=<non-secret P15-P17 native coverage id/path>
NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=<non-secret report id/path>
NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=<non-secret populated parent group comparison id/path>
NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=<non-secret P17 notifications_nature coverage id/path>
PRINT_ACCOUNTING_MATRIX_ACCEPTANCE_REPORT=<non-secret accounting matrix print report id/path>
PRINT_INVOICE_RECEIPT_ACCEPTANCE_REPORT=<non-secret invoice receipt print report id/path>
PRINT_STATIONERY_ACCEPTANCE_REPORT=<non-secret report id/path>
REAL_CALL_ROWS_ACCEPTANCE_REPORT=<non-secret report id/path>
CALL_SUBMITTED_DRAFT_ACCEPTANCE_REPORT=<non-secret submitted/draft call report id/path>
CALL_PHP_BRIDGE_ACCEPTANCE_REPORT=<non-secret call.php fid bridge report id/path>
NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=<non-secret report id/path>
NURSERY_BRANCH_BRIDGE_ACCEPTANCE_REPORT=<non-secret nurseryinfo.php branch bridge report id/path>
NURSERY_DOCUMENT_UPLOAD_ACCEPTANCE_REPORT=<non-secret ministry attachment upload report id/path>
LEGACY_ACL_ACCEPTANCE_REPORT=<non-secret report id/path>
LEGACY_PAGE_GUARD_ACCEPTANCE_REPORT=<non-secret PAGE direct URL denial report id/path>
LEGACY_ACTION_GUARD_ACCEPTANCE_REPORT=<non-secret ACTION mutation/control guard report id/path>
LEGACY_BACKFILL_ACCEPTANCE_REPORT=<non-secret backfill acceptance report id/path>
LEGACY_BACKFILL_RERUN_REPORT=<non-secret import/backfill rerun report id/path>
LEGACY_BACKFILL_TICKET_TRIAGE_REPORT=<non-secret remaining backfill ticket triage report id/path>
LEGACY_MEDIA_STORAGE_INTEGRITY_REPORT=<non-secret object storage upload integrity report id/path>
LEGACY_MEDIA_MISSING_FILE_TRIAGE_REPORT=<non-secret default/no-file/missing media triage report id/path>
MIGRATION_RECONCILIATION_MISMATCH_TRIAGE_REPORT=<non-secret skipped/orphan/mismatch triage report id/path>
```

Stop the cutover if either native app crashes on parser-safe endpoints, if production `notifications_nature` creates missing or reordered parent groups, if print output is rejected, or if any denied production user can access a guarded page/action.

## Phase 5: Final Gate Closure

Populate `docs/production-acceptance-evidence-template.md` in the release record, not with private data in the repo. The Run Metadata section must name the archived redacted readiness report, closeout summary, partial gate report, production evidence checklist, and production preflight manifest.

Final command:

```bash
pnpm tsx src/scripts/render-production-acceptance-evidence-record.ts --out=/secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --acceptance-date=<YYYY-MM-DD>
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials
pnpm tsx src/scripts/report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --out=/tmp/kiddzonl-production-gate-status.json --generated-at=<release-generated-at-iso> --require-ready --require-no-blockers
pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
```

The final command reads `docs/page-parity-matrix.json`, `docs/partial-production-gate-map.md`, and `docs/legacy-production-acceptance-gates.md` by default. Use `--parity-matrix=<path>`, `--partial-gate-map=<path>`, and `--production-gates=<path>` only when reproducing an archived release package from already-frozen evidence artifacts or running contract tests against a controlled fixture.

The legacy restoration goal can only be marked complete when:

- readiness audit reports all gates ready to review,
- every ready gate has dated production evidence or an explicit retirement decision,
- final acceptance evidence says release decision `accepted` and remaining production tickets `none`,
- `docs/page-parity-matrix.json` has no unresolved production/external partial rows,
- the archived partial gate report and production evidence checklist both show zero unresolved/blocking rows,
- artifact consistency verification passes against those archived zero-partial artifacts,
- the current branch/commit is recorded in the release evidence,
- redacted readiness and closeout summary JSON files are archived with the release evidence,
- the filled production acceptance record is archived and hash-bound by the closeout summary,
- the production evidence checklist JSON is archived with the release evidence,
- the production evidence package manifest is archived and verifies all closeout artifact hashes plus the closeout readiness, partial report, evidence checklist, and preflight manifest summaries,
- the final closeout command passes with `--require-zero-partials`,
- no stop condition above remains open.
