# Partial Row Production Gate Map

This map ties every remaining `partial` row in `docs/page-parity-matrix.json` to explicit production acceptance gates from `docs/legacy-production-acceptance-gates.md`. It is intentionally gate-focused: local implementation and browser/contract proof already exists for these rows, while final closure depends on production schedules, providers, native devices, or imported production notification data.

| Row | Partial status anchor | Gates | Closure reason |
| --- | --- | --- | --- |
| P01 | legacy assessment alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted assessment schedule confirmation plus production external channel execution if enabled. |
| P02 | legacy birthday alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted daily birthday schedule confirmation plus production provider rollout if enabled. |
| P03 | legacy contract alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted contract schedule confirmation plus production provider rollout if enabled. |
| P04 | legacy event alarms bridge | PROD-CRON | Needs hosted event/holiday schedule confirmation after production crontab review. |
| P05 | legacy insurance alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted insurance schedule decision plus production provider rollout if enabled. |
| P06 | legacy medical alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted medical schedule decision plus production provider rollout if enabled. |
| P07 | legacy medicine alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted 10-minute medicine schedule confirmation plus production provider rollout if enabled. |
| P08 | legacy message alarms bridge | PROD-PROVIDERS | Needs production push, SMS, and WhatsApp credential rollout and delivery summaries. |
| P09 | legacy other alarms bridge | PROD-PROVIDERS | Needs production external provider execution if the family is enabled for those channels. |
| P10 | legacy payment alarms bridge | PROD-CRON | Needs hosted payment schedule enablement after production cron confirmation. |
| P11 | legacy request alarms bridge | PROD-PROVIDERS | Needs production external provider execution if enabled for request alarms. |
| P12 | legacy vaccination alarms bridge | PROD-CRON, PROD-PROVIDERS | Needs hosted vaccination schedule decision plus production provider rollout if enabled. |
| P13 | legacy bulk compose options | PROD-PROVIDERS | Needs production push, SMS, and WhatsApp credential rollout for bulk sends. |
| P14 | legacy class child selection/admin fanout | PROD-PROVIDERS | Needs production push, SMS, and WhatsApp credential rollout for class sends. |
| P15 | legacy direct compose/thread access | PROD-PROVIDERS, PROD-NATIVE | Needs production provider rollout plus real native-device acceptance for direct/thread messaging. |
| P16 | legacy parent login contract | PROD-NATIVE | Needs exact iOS/Android native-app visual/runtime acceptance against restored PHP routes. |
| P17 | parent PWA shell | PROD-NATIVE, PROD-PROVIDERS, PROD-NATURE | Needs native-device acceptance, production provider delivery, and production `notifications_nature` group acceptance after canonical import. |

Rules:

- Do not mark a mapped partial row complete unless every listed gate has dated production evidence or an explicit owner-approved retirement decision.
- If `docs/page-parity-matrix.json` gains or loses partial rows, update this map in the same change.
- If a partial row changes wording, keep the status anchor specific enough to identify the row without storing private production data.
