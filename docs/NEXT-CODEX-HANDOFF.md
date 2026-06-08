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
- Real app surfaces excluding mapped/retired files: `167`
- Fully restored app surfaces: `59`
- Partial app surfaces: `108`
- Weighted implementation progress: about `70.9% done / 29.1% left`
- Strict fully signed-off parity: about `35.3% done / 64.7% left`

The weighted number counts partial implementations as meaningful progress. The strict number only counts rows whose status starts with `restored`.

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

- `4d891ea fix: harden parent native list contracts`
- `83e722e fix: harden parent daily legacy contract`
- `f786716 fix: harden parent legacy empty feeds`
- `2730ed8 fix: restore legacy parent ws routes`
- `1890993 fix: restore legacy admin settings tab redirects`

Do not assume these are complete for the whole app. They are slices.

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

Continue with parent native API compatibility, specifically `notifications_master.php`.

Why:

- `docs/parent-api-contract-matrix.md` still marks `notifications_master.php` as needing credentialed/native parser tolerance work.
- iOS force-unwraps notification groups and notification detail fields in `WebFunctions.swift`.
- Modern route already has `buildEmptyNotificationPayload()`, but DB errors can still happen before the route reaches its guarded section, especially while resolving unauthenticated `POST usites` context or loading notification natures/details.

Files to inspect:

- `src/app/api/parent/notifications/[childId]/route.ts`
- `src/app/ws/notifications_master.php/route.ts`
- `src/app/ws/notifications.php/route.ts`
- `/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/ws/notifications_master.php`
- `/Users/karimsaab/Desktop/Garderie Project/KiddzOnline/KiddzOnline/Classes/WebFunctions.swift`

iOS force-read snippet:

```swift
for i in 1...11 {
    let myNotifications: NSArray = (jsonResult["notification\\(i)" ] as! NSDictionary) ["details"] as! NSArray
    for myNotification in myNotifications {
        let item:AppNotification = AppNotification()
        item.type = (jsonResult["notification\\(i)"] as! NSDictionary) ["name"] as? String
        item.subject = ((myNotification as! NSDictionary)["subject"] as? String)!
        item.body = ((myNotification as! NSDictionary)["body"] as? String)!
        item.dateTime = ((myNotification as! NSDictionary)["datetime"] as? String)!
        items.append(item)
    }
}
```

This means the payload must always include:

- top-level object, not array
- `info`
- `notification1` through `notification11`
- each notification group must be an object
- each group must have `name` as string
- each group must have `details` as array
- every detail must have `subject`, `body`, and `datetime` as strings

Recommended implementation:

1. Extract notification payload shape helpers into a shared module such as `src/lib/parent-notification-contract.ts`.
2. Export `DEFAULT_NATURES`, `buildEmptyNotificationPayload`, `buildNotificationGroup`, and detail mapping guards if useful.
3. Make the route catch `isPrismaConnectionError` around:
   - auth lookup
   - unauthenticated child/parent context lookup
   - notification nature loading
   - detail loading
4. On DB connection failure for native POST/no auth, return `buildEmptyNotificationPayload()` instead of 500.
5. Add `src/scripts/verify-parent-notification-contract.ts` that proves:
   - empty payload has `notification1` through `notification11`
   - each group has string `name`
   - each group has array `details`
   - a sample group with detail returns string `subject`, `body`, `datetime`
   - quote cleaning still removes `"` from bodies, matching PHP `clean()`
6. Update:
   - `docs/parent-api-contract-matrix.md`
   - `docs/top-20-restoration-gaps.md`
   - `docs/page-parity-matrix.md`
   - `docs/page-parity-matrix.json`
7. Verify with:

```bash
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-notification-contract.ts
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-daily-contract.ts
PARENT_JWT_SECRET=test-secret pnpm exec tsx src/scripts/verify-parent-native-list-contracts.ts
pnpm exec tsc --noEmit
pnpm exec eslint <touched files>
python3 -m json.tool docs/page-parity-matrix.json >/dev/null
git diff --check
```

If starting a dev server:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
PORT=3001 pnpm dev
curl -sS -i -X POST -d 'usites=0' http://localhost:3001/ws/notifications_master.php
```

Expected native-safe empty notification response:

- HTTP `200`
- `content-type: application/json`
- object with `info`
- object with `notification1` through `notification11`
- each `details` is `[]`

## Broader Remaining High-Risk Areas

After `notifications_master.php`, continue through these clusters:

- Parent message list/thread/send contracts:
  - `messages.php`
  - `messagesList.php`
  - `message.php`
  - `sendMessage.php`
  - exact iOS/Android parser audit
  - credentialed send/open tests
  - parent/mobile read reset behavior
- Parent push token flow:
  - `pnotifications.php`
  - credentialed DB write verification
  - external OneSignal/webhook delivery rollout
- Parent alarm feeds:
  - birthday, medicine, insurance, vaccination, payment, missing medical, assessment, event, general
  - parser shape guardrails
  - push delivery/provider rollout
  - hosted cron schedule after production crontab confirmation
- Production data foundations:
  - canonical production SQL dumps
  - media/file export/import and object storage
  - migration reconciliation against production imports
- Visual/behavioral audits for `partial` desktop/admin surfaces:
  - DataTables export/print
  - Metronic visual parity
  - legacy modal/action/ACL edge cases
  - credentialed logged-in browser smokes

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
About 70.9% implemented / 29.1% left by weighted progress.
Strict fully signed-off parity is about 35.3% done / 64.7% still partial.

Recent pushed commits:
4d891ea fix: harden parent native list contracts
83e722e fix: harden parent daily legacy contract
f786716 fix: harden parent legacy empty feeds
2730ed8 fix: restore legacy parent ws routes
1890993 fix: restore legacy admin settings tab redirects

Continue from the documented parity matrix. The next recommended slice is parent native `notifications_master.php` parser-safety and DB-fallback hardening. Inspect legacy PHP/iOS/Android sources, patch modern app, add focused verifier, update docs, run TypeScript/ESLint/runtime checks, commit, and push to legacy-parity-runbook. Keep going slice by slice until the full legacy restoration objective is genuinely complete.
```
