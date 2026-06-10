import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type SectionSpec = {
  section: string;
  fields: string[];
};

type ReadinessReport = {
  redacted?: boolean;
  summary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
  gates?: Array<{
    gate?: string;
    status?: string;
  }>;
};

const recordPath = positionalArgs()[0];
const readinessReportPath = optionValue("--readiness-report");
const expectedBranch = optionValue("--branch");
const expectedCommit = optionValue("--commit");

if (!recordPath || recordPath.startsWith("-")) {
  console.error(
    "Usage: pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts <filled-production-evidence.md> [--readiness-report=<redacted-readiness.json>] [--branch=<branch>] [--commit=<sha>]"
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

if (readinessReportPath) {
  verifyReadinessReport(readinessReportPath, sections, errors);
}
verifyBranchAndCommit(sections, errors);
verifyFinalDecision(sections, errors);

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
      readinessReport: readinessReportPath ?? null,
      branch: expectedBranch ?? null,
      commit: expectedCommit ?? null,
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

function verifyReadinessReport(
  path: string,
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const reportText = readFileSync(path, "utf8");
  assertNoSensitiveContent(reportText);

  const report = JSON.parse(reportText) as ReadinessReport;
  if (report.redacted !== true) {
    errors.push("readiness report: redacted must be true");
  }
  if (!report.summary) {
    errors.push("readiness report: missing summary");
  }
  if (!Array.isArray(report.gates)) {
    errors.push("readiness report: missing gates");
    return;
  }

  const ready = report.summary?.ready;
  const needsEvidence = report.summary?.needsEvidence;
  const total = report.summary?.total;
  if (ready !== total || needsEvidence !== 0) {
    errors.push(`readiness report: expected all gates ready, got ready=${ready} needsEvidence=${needsEvidence} total=${total}`);
  }

  const metadataResult = sections.get("Run Metadata")?.get("`audit-production-readiness.ts` result") ?? "";
  if (typeof ready === "number" && typeof total === "number" && !metadataResult.includes(`${ready}/${total}`)) {
    errors.push(`Run Metadata: readiness result must include ${ready}/${total}`);
  }

  const expectedGateSections = requiredSections
    .map((section) => section.section)
    .filter((section) => section.startsWith("PROD-"));
  const reportGates = new Set<string>();
  for (const gate of report.gates) {
    if (!gate.gate) {
      errors.push("readiness report: gate entry missing gate id");
      continue;
    }
    reportGates.add(gate.gate);
    if (gate.status !== "ready-to-review") {
      errors.push(`readiness report: ${gate.gate} status is ${gate.status ?? "missing"}`);
    }
  }

  for (const section of expectedGateSections) {
    if (!reportGates.has(section)) {
      errors.push(`readiness report: missing ${section}`);
    }
  }
}

function verifyBranchAndCommit(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  if (!expectedBranch && !expectedCommit) {
    return;
  }

  const value = sections.get("Run Metadata")?.get("Modern branch/commit") ?? "";
  if (expectedBranch && !value.includes(expectedBranch)) {
    errors.push(`Run Metadata: Modern branch/commit must include branch ${expectedBranch}`);
  }
  if (expectedCommit && !value.includes(expectedCommit)) {
    errors.push(`Run Metadata: Modern branch/commit must include commit ${expectedCommit}`);
  }
}

function verifyFinalDecision(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const decision = sections.get("Final Decision");
  if (!decision) {
    return;
  }

  const acceptedOrRetired = normalizedValue(decision.get("All gates accepted or explicitly retired") ?? "");
  if (!/\b(yes|accepted|retired)\b/.test(acceptedOrRetired)) {
    errors.push("Final Decision: all gates must be accepted or explicitly retired");
  }

  const remainingTickets = normalizedValue(decision.get("Remaining production tickets") ?? "");
  if (remainingTickets !== "none") {
    errors.push("Final Decision: remaining production tickets must be none");
  }

  const releaseDecision = normalizedValue(decision.get("Release decision") ?? "");
  if (releaseDecision !== "accepted") {
    errors.push("Final Decision: release decision must be accepted");
  }
}

function normalizedValue(value: string) {
  return value.trim().toLowerCase();
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function positionalArgs() {
  const args: string[] = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.startsWith("--")) {
      if (!arg.includes("=") && process.argv[index + 1] && !process.argv[index + 1].startsWith("-")) {
        index += 1;
      }
      continue;
    }
    args.push(arg);
  }
  return args;
}
