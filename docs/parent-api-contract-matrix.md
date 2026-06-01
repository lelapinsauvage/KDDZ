# Parent API Contract Matrix

Legacy native apps must keep working behaviorally through the modern parent API/portal.

| Legacy Endpoint | Request Fields | Modern Endpoint | Status | Referenced By iOS | Referenced By Android |
| --- | --- | --- | --- | --- | --- |
| ws/absence.php | usites | /api/parent/absence/[childId] | partial - verify JSON contract | yes | yes |
| ws/birthdays_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/daily.php | usites | /api/parent/daily/[childId] | partial - verify JSON contract | no | yes |
| ws/events_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/finance.php | usites | /api/parent/finance/[childId] | partial - verify JSON contract | yes | yes |
| ws/foodcalendar.php | usites | /api/parent/calendar/food | partial - verify JSON contract | yes | yes |
| ws/general_alarms.php |  | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/holcalendar.php | usites | /api/parent/calendar/holidays | partial - verify JSON contract | yes | yes |
| ws/holcalendarOLD.php | usites |  | unmapped | no | no |
| ws/insurance_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/login.php | name, pass | /api/parent/login | partial - verify JSON contract | yes | yes |
| ws/medicine_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/message.php | usites |  | unmapped | no | no |
| ws/messages.php | pid | /api/parent/messages/[childId] | partial - verify JSON contract | yes | no |
| ws/messagesList.php | usites |  | unmapped | no | no |
| ws/missingReports_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/newassessment_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/newdaily.php | usites | /api/parent/daily/[childId]/detailed | partial - verify JSON contract | yes | no |
| ws/notifications_master.php | usites | /api/parent/notifications/[childId] | partial - verify JSON contract | yes | no |
| ws/payments_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
| ws/pnotifications.php | cid, del, os, show, token | /api/parent/push-token | partial - verify JSON contract | yes | no |
| ws/sendMessage.php | message, subject, threadid, to, usites | /api/parent/messages | partial - verify JSON contract | no | no |
| ws/vaccinations_alarms.php | pid | /api/parent/alarms/[type] | partial - verify JSON contract | no | no |
