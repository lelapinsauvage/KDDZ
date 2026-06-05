# Top 20 Legacy Restoration Gaps

This list is the first implementation backlog after the generated inventory/matrix pass. It is based on direct inspection of the legacy PHP/SQL/mobile sources and the current modern app structure. Each item still requires page-level verification against `docs/page-parity-matrix.md` before implementation.

## Blocker Gaps

1. **Production database source confirmation**
   - Need canonical production SQL dumps for every school year, not only annual backup samples.
   - Need confirmation of which dump/year is authoritative for first migration.

2. **Legacy uploaded files/media**
   - Legacy upload directories are now mapped in `docs/legacy-file-storage-rules.md`.
   - `audit-legacy-files.ts` and `export-legacy-files.ts` can verify and stage child photos, daily attachments, medical attachments, employee files, compliance documents, and receipt files before object-storage import.

3. **File storage pipeline**
   - `src/lib/storage/object-storage.ts` now provides local, S3, and R2 storage config, object upload, public URL calculation, and presigned PUT URL generation for runtime upload routes.
   - `upload-legacy-file-export.ts` now uploads the provider-neutral export package and writes an auditable upload manifest with source row provenance, object keys, public URLs, byte counts, and upload status.
   - `apply-legacy-file-urls.ts` now rewrites strong-provenance migrated URL fields from the upload manifest and reports no-provenance/unsupported destinations without guessing.
   - `20260601017000_add_legacy_file_provenance` and the updated migration scripts now add source provenance for branch/class/child/staff photos plus teacher/nurse/daily/absence attachments so direct URL rewrites no longer require filename matching.
   - `POST /api/uploads/presign` now creates authenticated S3/R2 presigned PUT URLs or local same-origin upload URLs with org/branch permission checks and safe object keys.
   - `PUT /api/uploads/local` now supports browser uploads for `STORAGE_PROVIDER=local`, and `/storage/<object-key>` serves authenticated local object URLs from `STORAGE_LOCAL_ROOT`.
   - Branch compliance document screens now use the presign route and update `BranchDocument` rows after browser upload.
   - Payment receipt upload is now wired through the accounting quick-payment and child-accounting payment dialogs, storing browser-uploaded receipt URLs on `Payment.receiptFileUrl`.
   - Absence report attachments now upload through the presign route, preserve existing attachments on edit, and update `AbsenceAttachment` rows for additions/removals.
   - Daily report attachments now upload through the presign route, preserve existing attachments on edit, and update `DailyReportAttachment` rows for additions/removals.
   - Teacher, nurse, doctor, and manager forms now upload profile photos through role-specific staff scopes and persist/display URLs on each staff `imageUrl` field.
   - Employee document rows now upload through the presign route before save and persist URLs through the legacy-compatible teacher/nurse/doctor/manager attachment tables.
   - Staff detail pages now display migrated teacher/nurse/doctor/manager attachment rows with file-open links, so object-storage URL rewrites are visible in the employee UI.
   - Call log and accident form dialogs now upload through the `form-attachment` scope and create `FormAttachment` rows.
   - Child enrollment/edit forms now upload profile photos and child documents, storing URLs on `Child.photo` and `ChildAttachment.fileUrl`.
   - Class add/edit dialogs now upload class images before save and persist URLs on `Class.imageUrl`.
   - Branch add/edit forms now upload branch images through the `branch` scope and persist URLs on `Branch.imageUrl`; new branches are created first so the upload can pass branch-level access checks, then immediately updated with the uploaded image URL.
   - `apply-legacy-file-urls.ts` now patches legacy `ChildHistory.snapshot.image` JSON for `child-history-photo` entries when source database, child legacy id, source table, and legacy filename all match.
   - Legacy `t_forms_attachments` upload manifests now use the `medical-form-document` rule to rewrite imported medical form attachment files onto `FormAttachment.fileUrl`; runtime call/accident uploads still use the `form-attachment` scope for the same target table.
   - Medical general, condition, visit, accident, and suffering form screens now upload runtime attachments through the `medical-form` scope, load existing active attachments, and sync added/removed files through `FormAttachment.fileUrl`.
   - Remaining work is upload attach/update actions for the remaining non-compliance surfaces and replacement of the remaining upload placeholders.

4. **Full data reconciliation**
   - `reconcile-migration-counts.ts` now provides curated source/target count checks across the migration order and distinguishes strong provenance from weaker count-only evidence.
   - Remaining work is to run it against the canonical production dumps after import, resolve warnings/missing/error rows, and add skipped/orphan detail where count-only evidence is still weak.

5. **Legacy cron schedule and delivery config**
   - `docs/cron-notification-matrix.md` now maps the legacy cron entrypoints, observed daily schedule evidence, notification families, OneSignal token path, and modern coverage.
   - Remaining work is to recover the production crontab, missing `../cronjob/*` helper files or proof they were obsolete, external provider credentials, and exact enablement for commented cron blocks.

## Product Parity Gaps

6. **Assessments migration**
   - Legacy has `t_assessment_1` through `t_assessment_7` plus `new_assessment`.
   - Historical row migration is covered by `migrate-assessments.ts`.
   - `/assessments` and `/assessments/[type]` now restore the legacy completed/incomplete/draft/missing review queues, using migrated `AssessmentScheduleRule` age windows, legacy `progress` payloads when present, active non-draft children, and direct create/open actions.
   - Remaining work is exact legacy alarm delivery parity for `alarmsAssessment.php` teacher/parent notification history and final per-question visual audit.

7. **Notification logs/settings migration**
   - Legacy has many `custom_notifications_*`, `t_alarms_*`, `t_notification_setting`, and `t_notifications_log` tables.
   - Historical alarms, receipts, push tokens, and notification logs are covered by `migrate-alarms.ts`; notification settings and future send-job behavior still need exact mapping.

8. **Actual notification sending**
   - Modern app stores templates/logs and header notifications, but production send jobs are not complete.

9. **Parent portal UI**
   - Parent APIs exist, but parent-facing pages are missing.
   - Legacy iOS/Android apps show the real parent feature set.

10. **Parent API response compatibility**
   - Legacy `ws/*.php`, iOS `WebFunctions.swift`, and Android `WebServiceFunctions.java` must be response-shape audited against modern `/api/parent/*`.

11. **Top-level calls module**
   - `/calls` now restores the global call management surface with search, branch/class/date/type filters, pagination, child links, delete actions, runtime call logging, attachment upload, and migrated `callparent`/`callcauses` reason options.
   - Remaining work is exact field/layout audit against `calls.php`, `call.php`, `bcalls.php`, and their JS files after the legacy sources are available for page-level comparison.

12. **New academic year workflow**
   - `/settings/new-year` now restores the legacy optional/mandatory import selection UI, teacher reassignment table, child class progression table, legacy-style S.N. generation, and a transactional action that creates the next active `SchoolYear`, updates selected teachers/children, and snapshots child history.
   - Remaining work is exact parity for legacy physical database backup/truncate/import behavior from `ArchiveAndCreate`; modern currently records import selections in `SchoolYear.legacyData` and avoids destructive deletion.

13. **Class dashboard depth**
   - `/classes/[id]` now restores the legacy `class_dashboard.php` depth for class capacity/gender summary, seven-day birthdays, daily report roster, absent report roster, medical/general/suffering/visits/vaccination/accident/call breakdowns, and seven assessment age-band summaries with eligible child rows.
   - Remaining work is exact legacy parity for fields that no longer exist one-to-one in the modern schema: daily report numeric progress, call draft status, and legacy `db_curr` year switching for medical visits.

14. **Accounting monthly matrix**
   - `/accounting` now restores the legacy `accounting.php` Oct-Sep school-year matrix with category tabs, child number/first/last/branch/class columns, active-child zero rows, branch/class/search/year filters, month totals, zero-cell payment-dialog prefill, nonzero-cell payment detail modal, print/edit/delete/attachment actions, and legacy-style soft delete.
   - Remaining work is exact visual audit for any legacy WebSocket refresh/status behavior that was commented out or environment-specific.

15. **Invoice/receipt parity**
   - Runtime payment receipt upload now stores files on `Payment.receiptFileUrl`; `/accounting/invoice/[id]` now restores the legacy `invo.php` Receipt Voucher fields, original migrated receipt number when available, amount-in-words text, child number/name, payer wording, category, month, validity dates, signature line, and print action.
   - Remaining work is exact logo/print stylesheet acceptance against production stationery.

16. **Government/nursery compliance parity**
   - Legacy `t_garderie`, `t_garderie_attachments`, `t_old_garderie`, and `t_garderie_doctor*` rows now have migration coverage, but `nurseryinfo.php` UI parity still needs exact page-level audit.

17. **Address hierarchy reference fields**
   - Legacy `t_mouhafaza`, `t_quadaa`, and `t_region` reference numbers and created dates are migrated and now displayed across `/settings/zones`, `/settings/areas`, and `/settings/regions`; location CRUD revalidates all three views.
   - Remaining work is final visual/action audit against `Zones_Management.php`, `Areas.php`, `regions.php`, and `regions.js`.

18. **Food/holiday/event calendar nuances**
   - Modern pages exist, but legacy tables include `t_food_apply`, holiday notification fields, send channels, repeat behavior, and event types that need exact mapping.

19. **Message delivery/read-state parity**
   - Modern messages exist, but legacy `t_alarms_msg` and `custom_notifications_msg` delivery/read/reset behavior needs exact restoration.

20. **Role and permission parity**
   - Legacy levels/actions/control tables are now preserved as metadata; remaining work is mapping them to modern roles and enforcing them in pages/actions.

## Execution Order

1. Finish matrix review and mark each gap with source files/tables.
2. Implement blocker data/file/cron foundations.
3. Restore high-frequency staff/admin workflows.
4. Restore parent portal/API compatibility.
5. Run migration dry-runs with reconciliation.
6. Cut over only after acceptance gates in `LEGACY-RESTORATION-RUNBOOK.md` pass.
