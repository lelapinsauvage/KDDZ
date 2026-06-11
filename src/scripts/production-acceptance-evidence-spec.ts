export type SectionSpec = {
  section: string;
  fields: string[];
};

export const requiredProductionEvidenceSections: SectionSpec[] = [
  {
    section: "Run Metadata",
    fields: [
      "Acceptance date",
      "Environment",
      "Modern branch/commit",
      "Legacy source package",
      "Production approver",
      "`audit-production-readiness.ts` result",
      "Redacted readiness report",
      "Redacted readiness report SHA-256",
      "Redacted closeout summary",
      "Partial gate report",
      "Partial gate report SHA-256",
      "Production evidence checklist",
      "Production evidence checklist SHA-256",
    ],
  },
  {
    section: "PROD-DUMPS",
    fields: [
      "Authoritative school-year dumps listed",
      "First migration source selected",
      "Dump checksums recorded outside repo",
      "Import date/time recorded",
      "Notes/ticket ids",
    ],
  },
  {
    section: "PROD-MEDIA",
    fields: [
      "`audit-legacy-files.ts` result summary",
      "`export-legacy-files.ts` manifest pointer",
      "`upload-legacy-file-export.ts` manifest pointer",
      "`apply-legacy-file-urls.ts` result summary",
      "Unresolved file decisions",
    ],
  },
  {
    section: "PROD-RECON",
    fields: [
      "`reconcile-migration-counts.ts` report pointer",
      "Source database label",
      "Target database label",
      "Mismatches remaining",
      "Skipped/orphan rows reviewed",
    ],
  },
  {
    section: "PROD-CRON",
    fields: [
      "Production crontab recovered",
      "Timezone confirmed",
      "`gid`/`code` coverage confirmed",
      "Missing `../cronjob/*` helpers recovered or retired",
      "Hosted daily schedules configured",
      "Hosted 10-minute schedules configured",
      "`CRON_SECRET` or `VERCEL_CRON_SECRET` configured",
      "Cron partial row coverage reviewed",
    ],
  },
  {
    section: "PROD-PROVIDERS",
    fields: [
      "Push provider configured",
      "Email provider configured",
      "SMS provider configured",
      "WhatsApp provider configured",
      "Test families sent",
      "Sent/skipped/failed counts recorded",
      "Provider response ids recorded without secrets",
      "Provider partial row coverage reviewed",
    ],
  },
  {
    section: "PROD-NATIVE",
    fields: [
      "iOS build tested against `master.php`",
      "Android build tested against `master.php`",
      "Literal `/ws/*.php` URLs verified",
      "Parent login/daily/absence/finance/food/holiday verified",
      "Notifications/messages/alarms verified",
      "Push-token registration verified",
      "Crash/parser issues remaining",
    ],
  },
  {
    section: "PROD-NATURE",
    fields: [
      "`notifications_nature` order compared",
      "Names and active flags compared",
      "Table/column mappings compared",
      "Populated parent groups compared",
      "Differences accepted or fixed",
    ],
  },
  {
    section: "PROD-PRINT",
    fields: [
      "`/accounting` matrix print accepted",
      "`/accounting/invoice/[id]` receipt accepted",
      "Logo/stationery accepted",
      "Browser/paper settings recorded",
      "Receipt numbering and amount wording accepted",
    ],
  },
  {
    section: "PROD-CALLS",
    fields: [
      "Real migrated `t_form_6` submitted call opened",
      "Real migrated draft call opened",
      "`/call.php?fid=` bridge verified",
      "Branch calls verified",
      "Child calls verified",
      "Attachment/open/print actions verified",
    ],
  },
  {
    section: "PROD-NURSERY",
    fields: [
      "`nurseryinfo.php` visual parity compared",
      "`nurseryinfo.js` behavior compared",
      "Finalization/progress semantics accepted",
      "Ministry form output accepted",
      "Branch-selection edge cases accepted",
      "Attachment handling accepted",
    ],
  },
  {
    section: "PROD-ACL",
    fields: [
      "Production levels sampled",
      "Denied PAGE routes verified",
      "Denied ACTION controls hidden",
      "Denied direct mutations blocked",
      "Non-left-menu guards sampled",
      "Differences accepted or fixed",
    ],
  },
  {
    section: "PROD-BACKFILL",
    fields: [
      "Imports needing rerun/backfill listed",
      "Medical `db_id` preservation verified",
      "Class dashboard year selectors verified",
      "Backfill scripts or migrations recorded",
      "Remaining backfill tickets",
    ],
  },
  {
    section: "Final Decision",
    fields: [
      "All gates accepted or explicitly retired",
      "Remaining production tickets",
      "Approval link/id",
      "Release decision",
    ],
  },
];

export const productionEvidencePlaceholderValues = [
  "yyyy-mm-dd",
  "production / staging-production-import",
  "`legacy-parity-runbook` / commit sha",
  "short non-secret label",
  "name or ticket id",
  "ready count / total gates",
  "non-secret json report id/path",
  "sha256 digest",
  "yes/no",
  "yes/no/family list",
  "p01-p07/p10/p12 report id/path",
  "disabled/onesignal/webhook",
  "disabled/resend/webhook",
  "disabled/webhook",
  "family/channel list",
  "p01-p17 report id/path",
  "found/missing/default/unsafe counts",
  "rewritten/skipped/unsupported counts",
  "accepted/fixed/ticket ids",
  "recovered/retired/ticket id",
  "count and accepted ticket ids",
  "count and ticket ids",
  "none/list",
  "accepted/rejected/deferred",
  "non-secret id/path",
];

export function productionGateSections() {
  return requiredProductionEvidenceSections
    .map((section) => section.section)
    .filter((section) => section.startsWith("PROD-"));
}
