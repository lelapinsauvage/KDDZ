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
   - Modern UI has many upload placeholders.
   - Need S3/R2-style storage, presigned uploads, file metadata, permissions, and provider-specific upload execution from the export manifest.

4. **Full data reconciliation**
   - `reconcile-migration-counts.ts` now provides curated source/target count checks across the migration order and distinguishes strong provenance from weaker count-only evidence.
   - Remaining work is to run it against the canonical production dumps after import, resolve warnings/missing/error rows, and add skipped/orphan detail where count-only evidence is still weak.

5. **Legacy cron schedule and delivery config**
   - Cron PHP files exist, but hosting schedules and provider credentials must be recovered.
   - Notification restoration requires schedule, recipient, template, delivery channel, and log parity.

## Product Parity Gaps

6. **Assessments migration**
   - Legacy has `t_assessment_1` through `t_assessment_7` plus `new_assessment`.
   - Historical row migration is covered by `migrate-assessments.ts`; remaining work is UI/behavior parity for missing-report generation and review flows.

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
   - Modern app has child-scoped calls under `/children/[id]/calls`.
   - Legacy includes broader `calls.php`, `call.php`, `bcalls.php`, `callparent`, and `callcauses`.

12. **New academic year workflow**
   - Modern page exists but is largely disabled/placeholder.
   - Legacy `newyear.php` performs archive/import/reassignment/progression workflows.

13. **Class dashboard depth**
   - Modern class dashboard exists, but legacy `class_dashboard.php` has deeper daily, medical, and assessment stat coverage.

14. **Accounting monthly matrix**
   - Modern accounting/payment flows exist, but the old `accounting.php` month/category matrix must be restored or explicitly approved as changed.

15. **Invoice/receipt parity**
   - Modern invoice route exists, but legacy `invo.php` print details need exact field/layout audit.

16. **Government/nursery compliance parity**
   - Legacy `t_garderie`, `t_garderie_attachments`, `t_old_garderie`, and `t_garderie_doctor*` rows now have migration coverage, but `nurseryinfo.php` UI parity still needs exact page-level audit.

17. **Address hierarchy reference fields**
   - Legacy zones/areas/regions include reference numbers and created dates that need verified parity in modern settings pages.

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
