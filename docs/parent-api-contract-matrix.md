# Parent API Contract Matrix

Legacy native apps must keep working behaviorally through the modern parent API/portal.

Parent web PWA status:

- `/parent/login` now uses `/api/parent/login`, persists the parent JWT and child id in browser storage, and keeps failed login responses in the legacy `status: false` shape.
- `/parent` now consumes the daily detailed, finance, absence, grouped messages, message thread detail/reply, notifications, alarm feeds, push-token, food calendar, holiday calendar, and send-message endpoints as the first parent-facing web shell.
- Remaining contract work is a field-by-field audit against `ws/*.php`, iOS `WebFunctions.swift`, Android `WebServiceFunctions.java`, and a credentialed E2E run with a known parent login.

| Legacy Endpoint | Request Fields | Modern Endpoint | Status | Referenced By iOS | Referenced By Android |
| --- | --- | --- | --- | --- | --- |
| ws/absence.php | usites | /api/parent/absence/[childId] | partial - used by /parent PWA; legacy POST `usites`, header/count, raw `t_absent_report` fields, and migrated legacy ids restored; verify final native parser tolerance | yes | yes |
| ws/birthdays_alarms.php | pid | /api/parent/alarms/birthdays | partial - legacy array shape, POST pid guard, legacy ids/status/datetime/href, and level-0 filtering restored; verify parent delivery push | no | no |
| ws/daily.php | usites | /api/parent/daily/[childId] | partial - legacy POST `usites`, header/count, numeric report ids, raw daily field names, flattened fever pairs, first milk row, and food names restored; verify final native parser tolerance | no | yes |
| ws/events_alarms.php | pid | /api/parent/alarms/events | partial - legacy event field names, POST pid guard, and multi-branch filtering restored; verify parent delivery push | no | no |
| ws/finance.php | usites | /api/parent/finance/[childId] | partial - used by /parent PWA; legacy POST `usites`, header/count, raw `t_payments` fields, migrated legacy ids, and active-payment filtering restored; verify final native parser tolerance | yes | yes |
| ws/foodcalendar.php | usites | /api/parent/calendar/food | partial - used by /parent PWA; legacy POST `usites`, header `branch_id`, raw `t_food_calendar` date/dessert fields, breakfast/lunch names, and migrated legacy ids restored; verify final native parser tolerance | yes | yes |
| ws/general_alarms.php |  | /api/parent/alarms/general | partial - remapped to migrated `t_alarms` rows with legacy array shape and field names; verify production exposure expectations | no | no |
| ws/holcalendar.php | usites | /api/parent/calendar/holidays | partial - used by /parent PWA; legacy POST usites, active-only rows, description/date fields, and repeated-date current-year adjustment restored | yes | yes |
| ws/holcalendarOLD.php | usites | /api/parent/calendar/holidays | partial - legacy POST usites and active-only description/date array restored through the same holiday endpoint | no | no |
| ws/insurance_alarms.php | pid | /api/parent/alarms/insurance | partial - legacy array shape, POST pid guard, legacy ids/status/datetime/date/href restored; verify parent delivery push | no | no |
| ws/login.php | name, pass | /api/parent/login | partial - JSON/form login restored with legacy failed shape, numeric `id`/`usites`, persisted token, parent report URL, md5-prefixed legacy password verification, and modern `childId` for the PWA; verify credentialed native parser tolerance | yes | yes |
| ws/medicine_alarms.php | pid | /api/parent/alarms/medicine | partial - legacy array shape, POST pid guard, legacy ids/status/datetime/href restored; verify parent delivery push | no | no |
| ws/message.php | usites (thread_id) | /api/parent/messages/thread/[threadId] | partial - used by /parent PWA, verify numeric-key thread JSON contract | no | no |
| ws/messages.php | pid | /api/parent/messages/[childId] | partial - legacy file appears stale/misnamed; verify against iOS commented parser | yes | no |
| ws/messagesList.php | usites | /api/parent/messages/[childId] | partial - used by /parent PWA, verify grouped thread JSON contract | no | no |
| ws/missingReports_alarms.php | pid | /api/parent/alarms/medical | partial - legacy array shape, POST pid guard, and migrated medical alarm field names restored; verify encrypted deep-link behavior | no | no |
| ws/newassessment_alarms.php | pid | /api/parent/alarms/assessments | partial - POST pid guard and legacy child id restored; verify exact assessment message template | no | no |
| ws/newdaily.php | usites | /api/parent/daily/[childId]/detailed | partial - used by /parent PWA; legacy POST `usites`, raw extended daily fields, mapped dessert portion, fever/milk arrays, and `takenmeds_Arr` name resolution restored; verify final native parser tolerance | yes | no |
| ws/notifications_master.php | usites | /api/parent/notifications/[childId] | partial - dynamic `notifications_nature` ordering/names/active flags, POST `usites` guard, and mapped alarm/event/message/assessment detail groups restored; verify every production nature/table | yes | no |
| ws/payments_alarms.php | pid | /api/parent/alarms/payments | partial - legacy array shape, POST pid guard, legacy ids/status/datetime/href restored; verify parent delivery push | no | no |
| ws/pnotifications.php | cid, del, os, show, token | /api/parent/push-token | partial - JSON/form registration, parent-scoped show, legacy OS mapping, and soft-delete restored; verify native unauth contract | yes | no |
| ws/sendMessage.php | message, subject, threadid, to, usites | /api/parent/messages | partial - used by /parent PWA, verify JSON contract | no | no |
| ws/vaccinations_alarms.php | pid | /api/parent/alarms/vaccinations | partial - legacy array shape, POST pid guard, legacy ids/status/datetime/href restored; verify parent delivery push | no | no |
