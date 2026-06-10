# Native Acceptance Ledger

This ledger separates local contract proof from external native-device acceptance. It should not contain parent names, usernames, phone numbers, tokens, or provider secrets.

## 2026-06-10 Local Credentialed Route-Handler E2E

Command:

```bash
pnpm tsx src/scripts/verify-parent-credentialed-native-e2e.ts
```

Result: passed.

Evidence captured:

| Area | Evidence |
| --- | --- |
| Login | Direct `/ws/login.php` accepted a real active parent credential and returned parser-safe string `id`, `usites`, report URL, token, modern `childId`, and modern parent user id fields. |
| Daily reports | `/ws/daily.php` and `/ws/newdaily.php` returned 228 real migrated rows each with parser-safe field shapes. |
| Absence | `/ws/absence.php` returned 9 real migrated rows with parser-safe field shapes. |
| Finance | `/ws/finance.php` returned 23 real migrated payment rows with parser-safe field shapes. |
| Food calendar | `/ws/foodcalendar.php` returned 247 grouped calendar rows with legacy branch/header and `edinner` compatibility. |
| Holidays | `/ws/holcalendar.php` and `/ws/holcalendarOLD.php` returned matching 27-row payloads. |
| Messages | The E2E created a temporary parent-to-admin thread, replied to the numeric legacy thread id, opened it through `/ws/message.php`, verified list/open/read-reset behavior, and cleaned up the temporary rows. |
| Push tokens | The E2E registered a temporary iOS token through `/ws/pnotifications.php`, verified show/delete behavior, and cleaned up the temporary token. |
| Alarm feeds | Birthday, medicine, insurance, vaccination, payment, missing-report, assessment, event, and general `/ws/*_alarms.php` feeds returned parser-safe empty headers in the current local dataset. |
| Notifications | `/ws/notifications_master.php` returned the iOS-safe eleven-group notification payload with parser-safe group/detail fields. |
| Legacy exposure | Unauthenticated no-pid `general_alarms.php` exposure remains parser-safe in the local route-handler E2E. |

Known limits:

- This is not an iOS Simulator, Android Emulator, TestFlight, or physical-device run.
- External OneSignal, SMS, WhatsApp, and email provider execution was not proven by this local run.
- Alarm rows were empty for this selected local parent, so alarm item shapes remain covered by reusable contract/unit verifiers and fixture-backed delivery verifiers, not by populated local native rows.
- Production `notifications_nature` ordering/content still needs acceptance after the canonical production import.

Remaining native acceptance gates:

1. Run the legacy iOS build against the modern deployment using the restored `master.php` and literal `/ws/*.php` URLs.
2. Run the legacy Android build against the same deployment and confirm the active parent screens parse without crashes.
3. Register real device push tokens and send Mobile-flagged direct, class, bulk, reply, and alarm messages through configured OneSignal/webhook credentials.
4. Send SMS and WhatsApp flagged messages through production webhook credentials and confirm provider delivery/audit summaries.
5. Repeat the E2E after the canonical production dump/import and compare `notifications_nature` group ordering, names, active flags, and populated alarm/message groups.
