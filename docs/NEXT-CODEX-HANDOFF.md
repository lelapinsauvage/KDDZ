# Next Codex Handoff

Use this document as the start point when continuing the Garderie legacy-restoration work from another account or thread.

## Mission

Restore the modern Garderie app to full legacy feature parity with the old PHP/iOS/Android app, using the documented restoration plan and parity matrix as the source of truth. This is not a cosmetic cleanup project. The target is surgical parity: database import fidelity, legacy PHP routes, native mobile API response shapes, migrated media/files, permissions, workflows, visual behavior, and production cutover readiness.

Keep working in small verified slices:

1. Pick the next highest-risk `partial` item from the docs.
2. Inspect the legacy PHP/JS/iOS/Android source that actually consumed or produced that behavior.
3. Inspect the modern implementation.
4. Patch the smallest coherent compatibility or feature gap.
5. Add a focused verifier when a response contract or migration invariant is easy to regress.
6. Run TypeScript/ESLint/runtime or script checks appropriate to the slice.
7. Update parity docs.
8. Commit and push to the active branch.

Do not mark the restoration complete until the current state proves every gap and acceptance gate in the plan has been satisfied.

## Repo And Branch

- Local modern app: `/Users/karimsaab/Desktop/garderie`
- GitHub repo: `https://github.com/lelapinsauvage/KDDZ.git`
- Active branch: `legacy-parity-runbook`
- Remote tracking: `origin/legacy-parity-runbook`
- Current branch status at handoff creation: synced with origin, except one unrelated dirty file.

Important: do not stage or commit `overnight-ui-fix-log.txt`. It is an unrelated local dirty file that existed before this handoff.

## Current Progress Estimate

From `docs/page-parity-matrix.json`:

- Total matrix rows: `1713`
- Complete rows: `1696`
- Partial rows: `17`
- Current tracker: `99% done / 1% left`
- Remaining gate ids: `PROD-CRON`, `PROD-NATIVE`, `PROD-NATURE`, and `PROD-PROVIDERS`

The remaining 17 partial rows are production/external acceptance gates, not known local feature-code gaps. Run `pnpm tsx src/scripts/report-production-partials.ts --json` for the authoritative row list and `pnpm run verify:production-gates` for the control-plane preflight. Do not mark the restoration goal complete until `docs/page-parity-matrix.json` has zero partial rows and the final closeout/evidence package commands pass with `--require-zero-partials`.

## Authoritative Docs

Read these first:

- `docs/top-20-restoration-gaps.md`
- `docs/page-parity-matrix.md`
- `docs/page-parity-matrix.json`
- `docs/parent-api-contract-matrix.md`
- `LEGACY-RESTORATION-RUNBOOK.md` if present/needed
- `docs/legacy-file-storage-rules.md` for media/file provenance
- `src/scripts/migration/README.md` for migration provenance expectations

The parity matrix is the execution source. A route existing is not completion.

## Legacy Source Locations

Modern code:

- `/Users/karimsaab/Desktop/garderie`

Legacy project bundle:

- `/Users/karimsaab/Desktop/Garderie Project`

Key legacy locations:

- Legacy PHP backup: `/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup`
- Legacy PHP webservices: `/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/ws`
- Legacy iOS app: `/Users/karimsaab/Desktop/Garderie Project/KiddzOnline/KiddzOnline`
- iOS parser hotspot: `/Users/karimsaab/Desktop/Garderie Project/KiddzOnline/KiddzOnline/Classes/WebFunctions.swift`
- Legacy Android app: `/Users/karimsaab/Desktop/Garderie Project/kiddzonline-master`
- Android API declarations: `/Users/karimsaab/Desktop/Garderie Project/kiddzonline-master/app/src/main/java/com/kiddzonline/android/net/WebServiceFunctions.java`
- Android result models: `/Users/karimsaab/Desktop/Garderie Project/kiddzonline-master/app/src/main/java/com/kiddzonline/android/net`

When modernizing native/parent APIs, compare all three:

- PHP `ws/*.php`
- iOS `WebFunctions.swift` force unwraps
- Android `*Result.java` and `*ViewModel.java`

## Recent Pushed Commits

Recent commits on `legacy-parity-runbook`:

- `e7bb81b chore: version evidence package manifests`
- `29e45e9 chore: timestamp evidence package manifests`
- `7b58b2f chore: freeze readiness evidence timestamps`
- `69baf15 docs: refresh production handoff status`
- `de7a99a chore: validate production artifact timestamps`
- `b207520 chore: timestamp closeout summaries`
- `9973efc chore: surface package artifact timestamps`

Do not assume these are complete for the whole app. They are slices.

### Production Evidence Timestamp Hardening

Commits `de7a99a`, `7b58b2f`, `29e45e9`, and `e7bb81b` tightened generated production evidence artifacts. The partial report, production evidence checklist, readiness audit, closeout runner, and evidence package manifest now use validated ISO `--generated-at` timestamps such as `2026-06-10T00:00:00.000Z`. The evidence package manifest also carries a top-level `generatedAt` and `schemaVersion: 1`, with contract coverage for saved-manifest verification.

## What Was Done Recently

### Parent `/ws/*.php` Alias Restoration

Commit `2730ed8` added direct legacy aliases under `src/app/ws/` for active native endpoints. These delegate to modern `/api/parent/*` routes so old native builds can keep calling literal PHP URLs.

Important aliases include:

- `login.php`
- `daily.php`
- `newdaily.php`
- `absence.php`
- `finance.php`
- `foodcalendar.php`
- `holcalendar.php`
- `holcalendarOLD.php`
- `notifications_master.php`
- `notifications.php`
- `messagesList.php`
- `messages.php`
- `message.php`
- `sendMessage.php`
- `pnotifications.php`
- alarm feeds such as `birthdays_alarms.php`, `medicine_alarms.php`, `insurance_alarms.php`, `vaccinations_alarms.php`, `payments_alarms.php`, `missingReports_alarms.php`, `newassessment_alarms.php`, `events_alarms.php`, and `general_alarms.php`

### Parent Empty-Feed Hardening

Commit `f786716` made selected parent feeds degrade to legacy empty-header JSON on local DB connection failures instead of returning native-client-breaking 500s. Local DB often refuses connections, so this matters.

Verified at the time with:

- `pnpm exec tsc --noEmit`
- focused ESLint
- `curl -X POST -d 'usites=0' http://localhost:3001/ws/holcalendar.php`
- `curl -X POST http://localhost:3001/ws/general_alarms.php`

### Parent Daily Contract Hardening

Commit `83e722e` hardened `daily.php` and `newdaily.php`.

Touched:

- `src/lib/parent-daily-contract.ts`
- `src/scripts/verify-parent-daily-contract.ts`
- parent parity docs

Important behavior restored:

- `report_id` is parser-safe string for iOS.
- modern submitted reports fall back to legacy `status: "present"`.
- Android flat fever slots now cover `0` through `9`.
- detailed iOS daily payload has force-read fields and numeric portions.
- `diahria`/`diarrhea` spelling compatibility is preserved.

Verifier:

```bash
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-daily-contract.ts
```

### Parent Native List Contracts

Commit `4d891ea` hardened:

- `absence.php`
- `finance.php`
- `foodcalendar.php`
- `holcalendar.php`

Touched:

- `src/lib/parent-native-list-contracts.ts`
- `src/scripts/verify-parent-native-list-contracts.ts`
- `src/app/api/parent/absence/[childId]/route.ts`
- `src/app/api/parent/finance/[childId]/route.ts`
- `src/app/api/parent/calendar/food/route.ts`
- `src/app/api/parent/calendar/holidays/route.ts`
- parent parity docs

Important behavior restored:

- iOS force-read string fields are always strings.
- Android date/grouping behavior is guarded.
- absence `ab_from`/`ab_to` fall back to report date when modern fields are null.
- finance fallback `target` values match Android grouping: `monthly`, `bus`, `extra`, `reg`, etc.
- DB connection failures return the legacy empty-header JSON shapes.

Verifier:

```bash
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-native-list-contracts.ts
```

Runtime smoke used:

```bash
PORT=3001 pnpm dev
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/absence.php
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/finance.php
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/foodcalendar.php
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/holcalendar.php
```

Expected empty responses:

- absence/finance/holiday: `[{"name":"","status":false,"count":0}]`
- food calendar: `[{"name":"","status":false,"count":0,"branch_id":0}]`

Stop the dev server before ending the turn unless intentionally leaving it running.

## Exact Next Best Slice

Continue from the remaining production/external gates, not the already-restored native notification slice.

First run:

```bash
git status --short --branch
pnpm tsx src/scripts/report-production-partials.ts --json
pnpm tsx src/scripts/report-production-evidence-checklist.ts --json
pnpm run verify:production-gates
```

Then work the first gate where real evidence is available:

- `PROD-CRON`: obtain production crontab or hosted scheduler evidence, confirm birthday/assessment/medicine/insurance/vaccination/payment/event schedule enablement, then archive `PRODUCTION_CRONTAB_EVIDENCE` and `HOSTED_SCHEDULER_EVIDENCE`.
- `PROD-PROVIDERS`: configure production-like email, push, SMS, and WhatsApp providers, run delivery summaries for the remaining message/alarm families, then archive provider rollout evidence.
- `PROD-NATIVE`: run exact iOS and Android native-device acceptance against the restored direct PHP routes, including parent login, message/thread flows, push token register/show/delete, alarm feeds, and `notifications_master.php`.
- `PROD-NATURE`: accept the imported production `notifications_nature` ordering/active groups after canonical production import.
- Canonical import/media: run production SQL/media import, file URL application, and migration reconciliation against the canonical production dump/package before removing any source-data blockers.
- Print/stationery: accept accounting invoice/receipt and monthly matrix print output against production stationery.

Final closure command sequence:

```bash
pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials
pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials
```

## Broader Remaining High-Risk Areas

The remaining work is now concentrated in final acceptance and production evidence:

- Production database foundations:
  - canonical production SQL dumps
  - canonical media/file export/import
  - object-storage upload/apply manifests
  - reconciliation against production imports
- Production operations:
  - hosted cron/scheduler evidence
  - provider credential rollout
  - delivery summary evidence for push/SMS/WhatsApp/email
- Production device/stationery acceptance:
  - iOS and Android native-device acceptance
  - production `notifications_nature` acceptance
  - accounting/receipt print-stationery acceptance

## Quality Bar

Do:

- Prefer `rg` and `rg --files`.
- Read the legacy implementation before editing.
- Keep changes scoped to the current slice.
- Use existing patterns and helpers.
- Preserve raw legacy field names and weird spellings when native/PHP clients depend on them.
- Add focused verifiers for contract/migration logic.
- Update docs in the same commit as the code.
- Run relevant checks before committing.
- Commit and push every completed slice.

Do not:

- Do not stage `overnight-ui-fix-log.txt`.
- Do not rewrite unrelated files.
- Do not assume a route existing means parity is complete.
- Do not replace legacy shapes with prettier modern shapes when native clients force-read old keys.
- Do not mark the overall goal complete just because a slice is complete.
- Do not ask the user for clarification unless truly blocked. Continue using docs and code as source of truth.

## Common Verification Commands

```bash
git status --short --branch
pnpm exec tsc --noEmit
pnpm exec eslint <touched files>
pnpm exec tsx src/scripts/verify-next-codex-handoff-contract.ts
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-daily-contract.ts
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-native-list-contracts.ts
python3 -m json.tool docs/page-parity-matrix.json >/dev/null
git diff --check
```

Runtime API smoke pattern:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
PORT=3001 pnpm dev
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/<endpoint>.php
```

If `localhost` fails in the in-app browser, the network address previously worked:

- `http://172.20.10.3:3001`

Shell `curl` to `localhost:3001` has worked.

## Final Handoff Prompt For A New Codex Thread

Paste this into the new Codex account/thread:

```text
We are restoring the Garderie app to full legacy parity.

Local repo:
/Users/karimsaab/Desktop/garderie

GitHub:
https://github.com/lelapinsauvage/KDDZ.git

Branch:
legacy-parity-runbook

Read first:
docs/NEXT-CODEX-HANDOFF.md
docs/top-20-restoration-gaps.md
docs/page-parity-matrix.md
docs/page-parity-matrix.json
docs/parent-api-contract-matrix.md

Do not stage or commit:
overnight-ui-fix-log.txt

Current progress:
99% done / 1% left by the current page-parity tracker.
The remaining 17 partial rows are production/external acceptance gates: PROD-CRON, PROD-NATIVE, PROD-NATURE, and PROD-PROVIDERS.

Recent pushed commits:
9973efc chore: surface package artifact timestamps
5eda6bf chore: forward package release ref
14bd747 chore: align cutover generated-at examples
547442e chore: timestamp production evidence artifacts
18eb7ae chore: require explicit final closeout ref
b60a5fd chore: require final closeout release ref

Continue from the production/external acceptance gates. First run `pnpm tsx src/scripts/report-production-partials.ts --json`, `pnpm tsx src/scripts/report-production-evidence-checklist.ts --json`, and `pnpm run verify:production-gates`. Work the first gate with real evidence available: canonical production SQL/media import and reconciliation, hosted cron evidence, provider delivery rollout, iOS/Android native-device acceptance, production `notifications_nature` acceptance, or print/stationery acceptance. Do not mark the goal complete until the parity matrix has zero partial rows and the closeout summary plus evidence package verifiers pass with `--require-zero-partials`.
```
