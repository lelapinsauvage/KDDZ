import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type SectionSpec = {
  section: string;
  fields: string[];
};

const recordPath = process.argv[2];

if (!recordPath || recordPath.startsWith("-")) {
  console.error(
    "Usage: pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts <filled-production-evidence.md>"
  );
  process.exit(2);
}

const requiredSections: SectionSpec[] = [
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

const raw = readFileSync(recordPath, "utf8");
assertNoSensitiveContent(raw);

const sections = parseMarkdownTables(raw);
const errors: string[] = [];

for (const spec of requiredSections) {
  const fields = sections.get(spec.section);
  if (!fields) {
    errors.push(`missing section: ${spec.section}`);
    continue;
  }

  for (const field of spec.fields) {
    const value = fields.get(field);
    if (value === undefined) {
      errors.push(`${spec.section}: missing field "${field}"`);
      continue;
    }
    if (isPlaceholder(value)) {
      errors.push(`${spec.section}: field "${field}" still has placeholder/empty value`);
    }
  }
}

if (errors.length > 0) {
  console.error("Production acceptance evidence record is incomplete:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "production acceptance evidence record verified",
      record: recordPath,
      sections: requiredSections.length,
      fields: requiredSections.reduce((count, section) => count + section.fields.length, 0),
      redacted: true,
    },
    null,
    2
  )
);

function parseMarkdownTables(markdown: string) {
  const sections = new Map<string, Map<string, string>>();
  let currentSection: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      currentSection = heading[1];
      sections.set(currentSection, new Map());
      continue;
    }

    if (!currentSection || !line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 2) {
      continue;
    }

    const [field, value] = cells;
    if (
      field === "Field" ||
      field === "Evidence" ||
      /^-+$/.test(field) ||
      /^-+$/.test(value)
    ) {
      continue;
    }

    sections.get(currentSection)?.set(field, value);
  }

  return sections;
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return [
    "yyyy-mm-dd",
    "production / staging-production-import",
    "`legacy-parity-runbook` / commit sha",
    "short non-secret label",
    "name or ticket id",
    "ready count / total gates",
    "non-secret json report id/path",
    "yes/no",
    "yes/no/family list",
    "disabled/onesignal/webhook",
    "disabled/resend/webhook",
    "disabled/webhook",
    "family/channel list",
    "found/missing/default/unsafe counts",
    "rewritten/skipped/unsupported counts",
    "accepted/fixed/ticket ids",
    "recovered/retired/ticket id",
    "count and accepted ticket ids",
    "count and ticket ids",
    "none/list",
    "none/list",
    "accepted/rejected/deferred",
    "none/list",
    "none/list",
    "non-secret id/path",
    "none/list",
  ].includes(normalized);
}

function assertNoSensitiveContent(value: string) {
  assert.doesNotMatch(value, /https?:\/\/[^\s)]+/i, "evidence record must not contain raw URLs");
  assert.doesNotMatch(
    value,
    /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
    "evidence record must not contain raw secret values"
  );
  assertNoPhoneNumbers(value);
}

function assertNoPhoneNumbers(value: string) {
  const candidates = value.match(/\b\+?\d[\d().\-\s]{8,}\d\b/g) ?? [];
  for (const candidate of candidates) {
    const digitCount = candidate.replace(/\D/g, "").length;
    assert.ok(digitCount < 10, "evidence record must not contain phone numbers");
  }
}
