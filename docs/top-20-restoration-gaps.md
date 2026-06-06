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
   - `/assessments` and `/assessments/[type]` now restore the legacy completed/incomplete/draft/missing review queues, using migrated `AssessmentScheduleRule` age windows, legacy `progress` payloads when present, active non-draft children, direct create/open actions, and idempotent parent `new_assessment` markers when reports become non-draft.
   - `/alarms/assessments` now restores the child-level due queue for missing assessment reports needed within 15 days, alongside scheduled assessment dates, plus manual/server generation of idempotent staff-facing `Alarm` rows, in-app notifications from the Assessment template, current-user New/Viewed updates, and sent-history rows from `custom_notifications_assessment`.
   - Remaining work is exact class-user targeting, external parent/mobile delivery, and final per-question visual audit.

7. **Notification logs/settings migration**
   - Legacy has many `custom_notifications_*`, `t_alarms_*`, `t_notification_setting`, and `t_notifications_log` tables.
   - Historical alarms, receipts, push tokens, and notification logs are covered by `migrate-alarms.ts`; migrated `t_notification_setting`, `notifications_nature`, and `t_notifications_log` rows are now visible in `/settings/notifications` under the Legacy tab for audit and parity review.
   - Remaining work is exact activation/edit behavior, parent/custom notification families, and production send-job parity.

8. **Actual notification sending**
   - Modern app now has an in-app template dispatch path with variable rendering, sent-log visibility, resend, and per-template test send to the current user.
   - Birthday generation now restores the active daily legacy family: it scans the configured birthday window, creates idempotent `Alarm` rows with legacy method metadata, sends unread staff in-app notifications from the Birthday template, and exposes a cron-safe `/api/cron/birthday-alarms` endpoint protected by `CRON_SECRET` or `VERCEL_CRON_SECRET`.
   - Assessment alarm generation now exposes the same manual/cron-safe path through `/alarms/assessments` and `/api/cron/assessment-alarms`.
   - Medicine alarm generation now restores the legacy 10-minute family as a cron-safe/manual path: it scans migrated `MedicalFormEntry` medication rows from submitted general medical forms, matches the current `HH:mm`, skips expired medication, creates idempotent `Alarm` rows, sends staff in-app notifications from the Medicine template, and exposes `/api/cron/medicine-alarms`.
   - Insurance alarm generation now restores the legacy expiry-window family as a cron-safe/manual path: it scans migrated and modern general medical-form insurance fields, creates idempotent `Alarm` rows, sends staff in-app notifications from the Insurance template, and exposes `/api/cron/insurance-alarms`.
   - Vaccination alarm generation now restores the legacy DOB-offset reminder family as a cron-safe/manual path: it computes 1/3/7-day reminders from the legacy vaccine schedule, creates idempotent `Alarm` rows, sends staff in-app notifications from the Vaccinations template, and exposes `/api/cron/vaccination-alarms`.
   - Payment alarm generation now restores the `newpayment`/`PaymentReminder` path from `Data::AlarmsPaidPayments()` and the `t_payments` before/after due reminder paths from `NotifyBeforePayment()`/`NotifyAfterPayment()` as cron-safe/manual generation that creates idempotent child-specific `Alarm` rows visible to parent payment feeds and exposes `/api/cron/payment-alarms`.
   - Holiday alarm generation now restores the `Data::AlarmsHoliday()` path as cron-safe/manual generation that creates idempotent `EVENT` alarms from active modern `Holiday` notification fields, sends staff in-app notifications, and exposes `/api/cron/holiday-alarms`.
   - Scheduled event alarm generation now restores the `t_events.daysbefore` and legacy branch-list notification path as cron-safe/manual generation that creates idempotent branch-targeted `EVENT` alarms, sends staff in-app notifications, and exposes `/api/cron/event-alarms`.
   - Staff contract alarm generation now restores `Data::AlarmsTeachersContracts()`, `AlarmsManagersContracts()`, `AlarmsDoctorsContracts()`, and `AlarmsNurseContracts()` as cron-safe/manual generation: teacher/nurse legacy attachment expiry dates are preserved again, the job scans staff documents and attachments for the legacy 1/3/7-day absolute diff windows, creates idempotent `CONTRACT` alarms, sends staff in-app notifications, and exposes `/api/cron/contract-alarms`.
   - `/alarms/birthdays` now restores legacy staff and parent read-state from migrated `custom_notifications_birthday` and `custom_notifications_birthday_parents` receipts, including Teachers New/Viewed filters, row/bulk/all mark-viewed actions, manual generation controls, and sent-history tables.
   - `/alarms/contracts` now restores legacy staff read-state from migrated `custom_notifications_contracts` receipts, including Teachers New/Viewed filters, row/bulk/all mark-viewed actions, manual generation controls, and sent-history tables.
   - `/alarms/medical` now restores legacy staff and parent medical reminder read-state from migrated `custom_notifications_medical` and `custom_notifications_medical_parents` receipts, including New/Viewed filters, row/bulk/all mark-viewed actions, and Sent Reports Reminders history.
   - `/alarms/insurance` and `/alarms/medicine` now restore legacy staff and parent read-state from migrated `custom_notifications_insurance`, `custom_notifications_insurance_parents`, `custom_notifications_medicine`, and `custom_notifications_medicine_parents` receipts, including Teachers New/Viewed filters, row/bulk/all mark-viewed actions, manual generation controls, and sent-reminder history tables.
   - `/alarms/vaccinations` now restores legacy receipt read-state from migrated `custom_notifications_vaccinations`, including collapsed New/Viewed status by alarm, row/bulk/all mark-viewed actions, manual generation controls, and sent-history rows for USER/PARENT_USER/CHILD receipts.
   - `/alarms/payments` now restores legacy receipt read-state from migrated `custom_notifications_payments`, including recipient To summaries, collapsed New/Viewed status by alarm, row/bulk/all mark-viewed actions, manual generation controls, and sent-history rows for PARENT_USER/CHILD receipts.
   - `/alarms/events` now restores legacy event/holiday receipt read-state from migrated `custom_notifications`, `custom_notifications_events`, and `custom_notifications_events_parents`, including current-staff New/Viewed filters, row/bulk/all mark-viewed actions, and Sent Events Alarms history for staff and parent recipients.
   - `/alarms`, `/alarms/requests`, and `/alarms/others` now restore legacy receipt read-state from migrated staff and parent delivery tables, including current-staff New/Viewed filters, row/bulk/all mark-viewed actions, and sent-history rows for USER/PARENT_USER/CHILD receipts.
   - Remaining work is idempotent cron/job generation for the other approved legacy families, hosted schedule configuration after production crontab confirmation, and external push/email/SMS/WhatsApp providers after credential recovery or rotation.

9. **Parent portal UI**
   - `/parent/login` now restores a parent-facing login screen backed by `/api/parent/login`, stores the parent JWT and modern child UUID client-side, and keeps failed-login responses in the legacy `{ status: false }` shape with a timeout guard for slow database lookups.
   - `/parent` now restores the first parent PWA shell with child dashboard stats, latest daily report summary, payments, absence reports, message compose/list/thread replies, notifications, push subscription registration/unregistration, food calendar, and holidays using the existing `/api/parent/*` compatibility endpoints.
   - Legacy iOS/Android apps show the real parent feature set.
   - Remaining work is credentialed E2E with a known production-like parent login, exact native-app screen audit, external push provider delivery, offline/mobile polish, and final API contract verification.

10. **Parent API response compatibility**
   - Legacy `ws/*.php`, iOS `WebFunctions.swift`, and Android `WebServiceFunctions.java` must be response-shape audited against modern `/api/parent/*`.
   - `/api/parent/alarms/[type]` now restores the legacy mobile alarm array shape for birthday, medicine, insurance, vaccination, payment, missing-medical, assessment, event, and general alarm feeds, including unauthenticated native `POST pid` compatibility, migrated legacy ids/status/datetime/href fields, assessment `new_assessment` marker/template rendering for migrated and modern non-draft reports, legacy medical field omission, `t_alarms` no-pid general-feed remapping, and legacy multi-branch event filtering.
   - `/api/parent/absence/[childId]` now restores `ws/absence.php` unauthenticated native POST `usites` compatibility, header/count shape, migrated absence legacy ids, and raw `t_absent_report` fields.
   - `/api/parent/daily/[childId]` and `/api/parent/daily/[childId]/detailed` now restore `ws/daily.php` and `ws/newdaily.php` unauthenticated native POST `usites` compatibility, legacy report ids/raw daily fields, flattened fever pairs, fever/milk arrays, and medication-name resolution from preserved medical-entry provenance.
   - `/api/parent/finance/[childId]` now restores `ws/finance.php` unauthenticated native POST `usites` compatibility, header/count shape, active payment filtering, and raw migrated `t_payments` response fields.
   - `/api/parent/calendar/food` now restores `ws/foodcalendar.php` unauthenticated native POST `usites` compatibility, legacy branch id in the header, and raw migrated `t_food_calendar` date/dessert rows with breakfast/lunch names.
   - `/api/parent/notifications/[childId]` now restores `ws/notifications_master.php` compatibility for unauthenticated native `POST usites`, authenticated PWA access, dynamic `notifications_nature` ordering/names/active flags, the eleven `notificationN` groups the iOS parser force-reads, exact production fallback natures, birthday parent rows, assessment parent rows, and mapped alarm/event/detail groups.
   - `/api/parent/calendar/holidays` now covers both `ws/holcalendar.php` and `ws/holcalendarOLD.php` with unauthenticated native `POST usites` compatibility, active-only rows, `description`/`date` fields, and repeated-holiday current-year adjustment.
   - `/api/parent/login` now restores `ws/login.php` JSON/form login compatibility, failed-login defaults, numeric legacy `id`/`usites`, parent report URL with persisted token, md5-prefixed legacy password verification, and a modern `childId` field for the PWA.
   - `/api/parent/messages/[childId]`, `/api/parent/messages/thread/[threadId]`, and `/api/parent/messages` now restore `messagesList.php`, `message.php`, and `sendMessage.php` compatibility for unauthenticated native POST fields, grouped thread headers, numeric thread ids, SQL datetime strings, legacy sender values, send feedback, and admin/teacher recipient fan-out.
   - `/api/parent/push-token` now restores `ws/pnotifications.php` compatibility for unauthenticated native `cid` registration, token reactivation, global legacy delete/show fallback, authenticated PWA registration/delete/show, legacy OS mapping, and legacy result strings.

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
   - Legacy `t_mouhafaza`, `t_quadaa`, and `t_region` reference numbers and created dates are migrated and now displayed across `/settings/zones`, `/settings/areas`, and `/settings/regions`; `/settings/zones` restores Mouhafaza listing/modal labels, `/settings/areas` restores Quadaa listing/modal labels, and `/settings/regions` restores the legacy Region listing, field/date filters, Quadaa selector, create/update/delete labels, and parent-Quadaa reassignment.
   - Remaining work is final DataTables export/print visual audit against `Zones_Management.php`, `Areas.php`, `regions.php`, and `regions.js`.

18. **Food/holiday/event calendar nuances**
   - Food applications, holiday notification fields, event types, scheduled event notification metadata, and event notification receipt history now have migration coverage; `/settings/events` restores legacy custom subject/body, multi-branch targeting, and 1-10 day offset controls.
   - Remaining work is exact visual/action audit, holiday send-channel behavior, and parent/mobile event delivery.

19. **Message delivery/read-state parity**
   - `/alarms/msg` now restores the legacy message notification listing with current-staff-user New/Viewed scoping, filters, row/bulk mark-viewed actions, Set All As Viewed, and idempotent migration provenance from `t_alarms_msg` plus per-recipient `custom_notifications_msg` delivery rows.
   - Parent message grouped list, thread detail, compose, and replies are now wired into `/parent`; the parent APIs accept unauthenticated native legacy POST/form bodies, preserve numeric thread ids and SQL datetime strings, dedupe migrated/runtime recipient fan-out for parent thread views, and send parent-originated messages to the legacy admin/teacher recipient sets.
   - Remaining work is exact legacy reply-thread visual audit, credentialed native send/open testing, parent/mobile read reset behavior, and external push-on-message delivery if product confirms it was active in production.

20. **Role and permission parity**
   - Legacy levels/actions/control tables are now preserved as metadata; remaining work is mapping them to modern roles and enforcing them in pages/actions.

## Execution Order

1. Finish matrix review and mark each gap with source files/tables.
2. Implement blocker data/file/cron foundations.
3. Restore high-frequency staff/admin workflows.
4. Restore parent portal/API compatibility.
5. Run migration dry-runs with reconciliation.
6. Cut over only after acceptance gates in `LEGACY-RESTORATION-RUNBOOK.md` pass.
