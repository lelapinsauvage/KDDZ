# Production Acceptance Evidence Template

Copy this template into the production release record or ticket system after each gate is tested. Keep it non-secret: do not paste raw database URLs, API keys, bearer tokens, webhook URLs, passwords, parent phone numbers, parent names, child names, or private message content.

## Run Metadata

| Field | Value |
| --- | --- |
| Acceptance date | YYYY-MM-DD |
| Environment | production / staging-production-import |
| Modern branch/commit | `legacy-parity-runbook` / commit sha |
| Legacy source package | short non-secret label |
| Production approver | name or ticket id |
| `audit-production-readiness.ts` result | ready count / total gates |
| Redacted readiness report | non-secret JSON report id/path |
| Redacted closeout summary | non-secret JSON report id/path |
| Partial gate report | non-secret JSON report id/path |
| Partial gate report SHA-256 | sha256 digest |
| Production evidence checklist | non-secret JSON report id/path |
| Production evidence checklist SHA-256 | sha256 digest |

## PROD-DUMPS

| Evidence | Value |
| --- | --- |
| Authoritative school-year dumps listed | yes/no |
| First migration source selected | yes/no |
| Dump checksums recorded outside repo | yes/no |
| Import date/time recorded | yes/no |
| Notes/ticket ids |  |

## PROD-MEDIA

| Evidence | Value |
| --- | --- |
| `audit-legacy-files.ts` result summary | found/missing/default/unsafe counts |
| `export-legacy-files.ts` manifest pointer | non-secret id/path |
| `upload-legacy-file-export.ts` manifest pointer | non-secret id/path |
| `apply-legacy-file-urls.ts` result summary | rewritten/skipped/unsupported counts |
| Unresolved file decisions | accepted/fixed/ticket ids |

## PROD-RECON

| Evidence | Value |
| --- | --- |
| `reconcile-migration-counts.ts` report pointer | non-secret id/path |
| Source database label | non-secret label |
| Target database label | non-secret label |
| Mismatches remaining | count and accepted ticket ids |
| Skipped/orphan rows reviewed | yes/no |

## PROD-CRON

| Evidence | Value |
| --- | --- |
| Production crontab recovered | yes/no |
| Timezone confirmed | yes/no |
| `gid`/`code` coverage confirmed | yes/no |
| Missing `../cronjob/*` helpers recovered or retired | recovered/retired/ticket id |
| Hosted daily schedules configured | yes/no/family list |
| Hosted 10-minute schedules configured | yes/no/family list |
| `CRON_SECRET` or `VERCEL_CRON_SECRET` configured | yes/no |

## PROD-PROVIDERS

| Evidence | Value |
| --- | --- |
| Push provider configured | disabled/onesignal/webhook |
| Email provider configured | disabled/resend/webhook |
| SMS provider configured | disabled/webhook |
| WhatsApp provider configured | disabled/webhook |
| Test families sent | family/channel list |
| Sent/skipped/failed counts recorded | yes/no |
| Provider response ids recorded without secrets | yes/no |

## PROD-NATIVE

| Evidence | Value |
| --- | --- |
| iOS build tested against `master.php` | yes/no |
| Android build tested against `master.php` | yes/no |
| Literal `/ws/*.php` URLs verified | yes/no |
| Parent login/daily/absence/finance/food/holiday verified | yes/no |
| Notifications/messages/alarms verified | yes/no |
| Push-token registration verified | yes/no |
| Crash/parser issues remaining | count and ticket ids |

## PROD-NATURE

| Evidence | Value |
| --- | --- |
| `notifications_nature` order compared | yes/no |
| Names and active flags compared | yes/no |
| Table/column mappings compared | yes/no |
| Populated parent groups compared | yes/no |
| Differences accepted or fixed | accepted/fixed/ticket ids |

## PROD-PRINT

| Evidence | Value |
| --- | --- |
| `/accounting` matrix print accepted | yes/no |
| `/accounting/invoice/[id]` receipt accepted | yes/no |
| Logo/stationery accepted | yes/no |
| Browser/paper settings recorded | yes/no |
| Receipt numbering and amount wording accepted | yes/no |

## PROD-CALLS

| Evidence | Value |
| --- | --- |
| Real migrated `t_form_6` submitted call opened | yes/no |
| Real migrated draft call opened | yes/no |
| `/call.php?fid=` bridge verified | yes/no |
| Branch calls verified | yes/no |
| Child calls verified | yes/no |
| Attachment/open/print actions verified | yes/no |

## PROD-NURSERY

| Evidence | Value |
| --- | --- |
| `nurseryinfo.php` visual parity compared | yes/no |
| `nurseryinfo.js` behavior compared | yes/no |
| Finalization/progress semantics accepted | yes/no |
| Ministry form output accepted | yes/no |
| Branch-selection edge cases accepted | yes/no |
| Attachment handling accepted | yes/no |

## PROD-ACL

| Evidence | Value |
| --- | --- |
| Production levels sampled | yes/no |
| Denied PAGE routes verified | yes/no |
| Denied ACTION controls hidden | yes/no |
| Denied direct mutations blocked | yes/no |
| Non-left-menu guards sampled | yes/no |
| Differences accepted or fixed | accepted/fixed/ticket ids |

## PROD-BACKFILL

| Evidence | Value |
| --- | --- |
| Imports needing rerun/backfill listed | yes/no |
| Medical `db_id` preservation verified | yes/no |
| Class dashboard year selectors verified | yes/no |
| Backfill scripts or migrations recorded | yes/no |
| Remaining backfill tickets | none/list |

## Final Decision

| Field | Value |
| --- | --- |
| All gates accepted or explicitly retired | yes/no |
| Remaining production tickets | none/list |
| Approval link/id |  |
| Release decision | accepted/rejected/deferred |
