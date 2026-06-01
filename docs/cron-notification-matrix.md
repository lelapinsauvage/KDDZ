# Cron And Notification Matrix

Legacy cron and notification behavior must be restored as auditable background jobs.

| Legacy Script | Tables Mentioned | Legacy Schedule | Modern Job Status | Restoration Notes |
| --- | --- | --- | --- | --- |
| Front/templates/admin/AlarmBar.php |  | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarms.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsAssessment.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsBirthday.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsContracts.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsEvents.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsInsurance.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsMedical.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsMedicine.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsMsg.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsOthers.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsPayments.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsRequests.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/alarmsVaccinations.php | auto, themeforest | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| Front/templates/admin/users/admin/page/notifications.php |  | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| cronjob.php |  | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| cronjobdailyonce.php |  | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| cronjobeverytenminutes.php | t_notification_setting | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/birthdays_alarms.php | t_alarms_birthday, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/events_alarms.php | t_child, t_events | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/general_alarms.php | t_alarms | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/insurance_alarms.php | t_alarms_insurance, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/medicine_alarms.php | t_alarms_medicine, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/missingReports_alarms.php | t_alarms_medical, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/newassessment_alarms.php | new_assessment, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/notifications_master.php | if, notifications_nature, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/payments_alarms.php | t_alarms_payments, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/pnotifications.php | notifications_tokens, test | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
| ws/vaccinations_alarms.php | t_alarms_vaccinations, t_child | unknown - inspect hosting cron schedule | missing/partial - map to background job | Needs schedule, recipients, template, delivery channel, log table. |
