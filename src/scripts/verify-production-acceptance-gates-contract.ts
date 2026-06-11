import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import packageJson from "../../package.json";

type ParityRow = {
  status?: string;
  verification?: string;
  notes?: string;
  legacy?: string;
  modern?: string;
  children?: ParityRow[];
  [key: string]: unknown;
};

const files = {
  gates: "docs/legacy-production-acceptance-gates.md",
  matrix: "docs/page-parity-matrix.json",
  topGaps: "docs/top-20-restoration-gaps.md",
  cron: "docs/cron-notification-matrix.md",
  native: "docs/native-acceptance-ledger.md",
  migrationReadme: "src/scripts/migration/README.md",
  evidenceTemplate: "docs/production-acceptance-evidence-template.md",
  cutoverRunbook: "docs/production-cutover-runbook.md",
  partialGateMap: "docs/partial-production-gate-map.md",
  readinessEnvExample: "docs/production-readiness.env.example",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")])
) as Record<keyof typeof files, string>;

const expectedGates = [
  "PROD-DUMPS",
  "PROD-MEDIA",
  "PROD-RECON",
  "PROD-CRON",
  "PROD-PROVIDERS",
  "PROD-NATIVE",
  "PROD-NATURE",
  "PROD-PRINT",
  "PROD-CALLS",
  "PROD-NURSERY",
  "PROD-ACL",
  "PROD-BACKFILL",
] as const;

for (const gate of expectedGates) {
  assert.match(contents.gates, new RegExp(`\\| ${gate} \\|`), `${gate} is missing from production gates`);
  assert.match(contents.evidenceTemplate, new RegExp(`## ${gate}\\b`), `${gate} is missing from evidence template`);
  assert.match(contents.cutoverRunbook, new RegExp(`${gate}\\b`), `${gate} is missing from cutover runbook`);
}

const requiredReferences = [
  "docs/page-parity-matrix.json",
  "docs/top-20-restoration-gaps.md",
  "docs/cron-notification-matrix.md",
  "docs/native-acceptance-ledger.md",
  "docs/production-acceptance-evidence-template.md",
  "docs/production-cutover-runbook.md",
  "docs/partial-production-gate-map.md",
  "docs/production-readiness.env.example",
  "src/scripts/migration/README.md",
  "src/scripts/audit-production-readiness.ts",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  "src/scripts/run-production-closeout.ts",
  "src/scripts/report-production-partials.ts",
  "src/scripts/report-production-evidence-checklist.ts",
  "src/scripts/verify-production-gate-suite.ts",
  "src/scripts/verify-production-acceptance-evidence-record-contract.ts",
  "src/scripts/verify-production-closeout-contract.ts",
  "src/scripts/verify-production-closeout-summary-contract.ts",
  "src/scripts/verify-production-partial-report-contract.ts",
  "src/scripts/verify-production-evidence-checklist-contract.ts",
  "src/scripts/verify-production-artifact-consistency-contract.ts",
  "src/scripts/verify-production-readiness-audit-contract.ts",
  "src/scripts/verify-parent-credentialed-native-e2e.ts",
  "src/scripts/verify-legacy-calls-contract.ts",
  "src/scripts/migration/reconcile-migration-counts.ts",
  "notifications_nature",
  "master.php",
  "/ws/*.php",
];

for (const reference of requiredReferences) {
  assert.match(contents.gates, new RegExp(escapeRegExp(reference)), `${reference} is missing from production gates`);
}

for (const envName of [
  "PUSH_DELIVERY_PROVIDER",
  "ONESIGNAL_APP_ID",
  "ONESIGNAL_REST_API_KEY",
  "PUSH_DELIVERY_WEBHOOK_URL",
  "EMAIL_DELIVERY_PROVIDER",
  "EMAIL_DELIVERY_WEBHOOK_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SMS_DELIVERY_PROVIDER",
  "SMS_DELIVERY_WEBHOOK_URL",
  "WHATSAPP_DELIVERY_PROVIDER",
  "WHATSAPP_DELIVERY_WEBHOOK_URL",
  "LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL",
]) {
  assert.match(contents.gates, new RegExp(`\\b${envName}\\b`), `${envName} must be named without a value`);
  assert.match(contents.readinessEnvExample, new RegExp(`\\b${envName}\\b`), `${envName} is missing from readiness env example`);
  assert.doesNotMatch(contents.gates, new RegExp(`${envName}\\s*=`), `${envName} must not have an inline value`);
}

for (const evidenceEnvName of [
  "LEGACY_PRODUCTION_DUMP_MANIFEST",
  "LEGACY_MEDIA_EXPORT_MANIFEST",
  "LEGACY_MEDIA_UPLOAD_MANIFEST",
  "MIGRATION_RECONCILIATION_REPORT",
  "PRODUCTION_CRONTAB_EVIDENCE",
  "HOSTED_SCHEDULER_EVIDENCE",
  "CRON_SECRET",
  "VERCEL_CRON_SECRET",
  "NATIVE_IOS_ACCEPTANCE_REPORT",
  "NATIVE_ANDROID_ACCEPTANCE_REPORT",
  "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT",
  "PRINT_STATIONERY_ACCEPTANCE_REPORT",
  "REAL_CALL_ROWS_ACCEPTANCE_REPORT",
  "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT",
  "LEGACY_ACL_ACCEPTANCE_REPORT",
  "LEGACY_BACKFILL_ACCEPTANCE_REPORT",
]) {
  assert.match(contents.readinessEnvExample, new RegExp(`\\b${evidenceEnvName}\\b`), `${evidenceEnvName} is missing from readiness env example`);
}

assert.doesNotMatch(contents.gates, /https?:\/\/[^\s)]+/i, "production gates must not include webhook URLs");
assert.doesNotMatch(contents.evidenceTemplate, /https?:\/\/[^\s)]+/i, "evidence template must not include webhook URLs");
assert.doesNotMatch(contents.cutoverRunbook, /https?:\/\/[^\s)]+/i, "cutover runbook must not include webhook URLs");
assert.doesNotMatch(contents.partialGateMap, /https?:\/\/[^\s)]+/i, "partial gate map must not include webhook URLs");
assert.doesNotMatch(contents.readinessEnvExample, /https?:\/\/[^\s)]+/i, "readiness env example must not include URLs");
assert.doesNotMatch(contents.gates, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "production gates must not include secret values");
assert.doesNotMatch(contents.evidenceTemplate, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "evidence template must not include secret values");
assert.doesNotMatch(contents.cutoverRunbook, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "cutover runbook must not include secret values");
assert.doesNotMatch(contents.partialGateMap, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "partial gate map must not include secret values");
assert.doesNotMatch(contents.readinessEnvExample, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "readiness env example must not include secret values");

const matrix = JSON.parse(contents.matrix) as ParityRow[];
const partialRows: ParityRow[] = [];

function collectPartialRows(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(collectPartialRows);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const row = value as ParityRow;
  if (typeof row.status === "string" && row.status.toLowerCase().startsWith("partial")) {
    partialRows.push(row);
  }

  Object.values(row).forEach(collectPartialRows);
}

collectPartialRows(matrix);

assert.equal(partialRows.length, 17, "the production gate contract must be updated when partial row count changes");

const mappedRows = contents.partialGateMap
  .split("\n")
  .filter((line) => /^\| P\d{2} \|/.test(line));
assert.equal(mappedRows.length, partialRows.length, "partial production gate map must cover every partial row");

for (const [index, row] of mappedRows.entries()) {
  assert.match(row, new RegExp(`\\| P${String(index + 1).padStart(2, "0")} \\|`));
  const partial = partialRows[index];
  const statusAnchor = row.split("|")[2]?.trim();
  assert.ok(statusAnchor, `P${index + 1} is missing a status anchor`);
  assert.match(partial.status ?? "", new RegExp(escapeRegExp(statusAnchor), "i"));

  const gates = row
    .split("|")[3]
    ?.split(",")
    .map((gate) => gate.trim())
    .filter(Boolean);
  assert.ok(gates?.length, `P${index + 1} is missing gate ids`);
  for (const gate of gates) {
    assert.ok(
      (expectedGates as readonly string[]).includes(gate),
      `P${index + 1} references unknown production gate ${gate}`
    );
  }
}

const externalGatePattern =
  /(production|provider|credential|hosted|schedule|cron|crontab|native-device|iOS|Android|canonical|import|print|stationery|notifications_nature|backfill|visual audit|SMS|WhatsApp|OneSignal|email)/i;

for (const row of partialRows) {
  const evidence = [row.status, row.verification, row.notes].filter(Boolean).join("\n");
  assert.match(
    evidence,
    externalGatePattern,
    `partial row is not tied to an external production gate: ${row.status ?? "unknown"}`
  );
}

assert.match(contents.topGaps, /legacy-production-acceptance-gates\.md/);
assert.match(contents.cron, /legacy-production-acceptance-gates\.md/);
assert.match(contents.native, /legacy-production-acceptance-gates\.md/);
assert.match(contents.migrationReadme, /reconcile-migration-counts\.ts/);
assert.match(contents.gates, /partial-production-gate-map\.md/);
const readinessAudit = readFileSync("src/scripts/audit-production-readiness.ts", "utf8");
const evidenceRecordVerifier = readFileSync("src/scripts/verify-production-acceptance-evidence-record.ts", "utf8");
const closeoutRunner = readFileSync("src/scripts/run-production-closeout.ts", "utf8");
const partialReporter = readFileSync("src/scripts/report-production-partials.ts", "utf8");
const evidenceChecklistReporter = readFileSync("src/scripts/report-production-evidence-checklist.ts", "utf8");
const productionGateSuite = readFileSync("src/scripts/verify-production-gate-suite.ts", "utf8");
assert.match(readinessAudit, /No environment values/);
assert.match(readinessAudit, /--out/);
assert.match(readinessAudit, /--env-file/);
assert.match(readinessAudit, /--list-requirements/);
assert.match(readinessAudit, /--gate/);
assert.match(evidenceRecordVerifier, /placeholder\/empty value/);
assert.match(evidenceRecordVerifier, /raw URLs/);
assert.match(evidenceRecordVerifier, /phone numbers/);
assert.match(evidenceRecordVerifier, /--readiness-report/);
assert.match(evidenceRecordVerifier, /--summary-report/);
assert.match(evidenceRecordVerifier, /--partial-report/);
assert.match(evidenceRecordVerifier, /--checklist-report/);
assert.match(evidenceRecordVerifier, /--readiness-digest/);
assert.match(evidenceRecordVerifier, /--partial-digest/);
assert.match(evidenceRecordVerifier, /--checklist-digest/);
assert.match(evidenceRecordVerifier, /--branch/);
assert.match(evidenceRecordVerifier, /--commit/);
assert.match(evidenceRecordVerifier, /verifyArtifactPointers/);
assert.match(evidenceRecordVerifier, /remaining production tickets must be none/);
assert.match(evidenceRecordVerifier, /release decision must be accepted/);
assert.match(closeoutRunner, /audit-production-readiness\.ts/);
assert.match(closeoutRunner, /verify-production-acceptance-evidence-record\.ts/);
assert.match(closeoutRunner, /rev-parse/);
assert.match(closeoutRunner, /--summary-out/);
assert.match(closeoutRunner, /--partials-out/);
assert.match(closeoutRunner, /--checklist-out/);
assert.match(closeoutRunner, /report-production-evidence-checklist\.ts/);
assert.match(closeoutRunner, /verify-production-artifact-consistency-contract\.ts/);
assert.match(closeoutRunner, /--partial-report/);
assert.match(closeoutRunner, /--checklist-report/);
assert.match(closeoutRunner, /readinessSummary/);
assert.match(closeoutRunner, /parityTracker/);
assert.match(closeoutRunner, /evidenceChecklist/);
assert.match(closeoutRunner, /partialReportSummary/);
assert.match(closeoutRunner, /evidenceChecklistSummary/);
assert.match(closeoutRunner, /artifactDigests/);
assert.match(closeoutRunner, /sha256/);
assert.match(closeoutRunner, /artifactConsistency/);
assert.match(closeoutRunner, /--require-zero-partials/);
assert.match(partialReporter, /partial-production-gate-map\.md/);
assert.match(partialReporter, /page-parity-matrix\.json/);
assert.match(partialReporter, /gateCounts/);
assert.match(evidenceChecklistReporter, /production-acceptance-evidence-spec/);
assert.match(evidenceChecklistReporter, /partial-production-gate-map\.md/);
assert.match(evidenceChecklistReporter, /--gate/);
assert.match(evidenceChecklistReporter, /--out/);
assert.match(productionGateSuite, /verify-production-acceptance-gates-contract\.ts/);
assert.match(productionGateSuite, /verify-production-readiness-audit-contract\.ts/);
assert.match(productionGateSuite, /verify-production-acceptance-evidence-record-contract\.ts/);
assert.match(productionGateSuite, /verify-production-closeout-contract\.ts/);
assert.match(productionGateSuite, /verify-production-closeout-summary-contract\.ts/);
assert.match(productionGateSuite, /verify-production-partial-report-contract\.ts/);
assert.match(productionGateSuite, /verify-production-evidence-checklist-contract\.ts/);
assert.match(productionGateSuite, /verify-production-artifact-consistency-contract\.ts/);
assert.match(productionGateSuite, /page-parity-matrix\.json/);
assert.match(readFileSync("src/scripts/verify-production-readiness-audit-contract.ts", "utf8"), /assertNoSensitiveOutput/);
assert.match(
  readFileSync("src/scripts/verify-production-acceptance-evidence-record-contract.ts", "utf8"),
  /PROD-NATIVE-1/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-contract.ts", "utf8"),
  /requires zero partial parity rows/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /partial report digest mismatch/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /verify-production-artifact-consistency-contract\.ts/
);
assert.match(
  readFileSync("src/scripts/verify-production-partial-report-contract.ts", "utf8"),
  /Partial rows: 17/
);
assert.match(
  readFileSync("src/scripts/verify-production-artifact-consistency-contract.ts", "utf8"),
  /blocker rows drifted/
);
assert.match(
  readFileSync("src/scripts/verify-production-artifact-consistency-contract.ts", "utf8"),
  /readFileSync/
);
assert.match(contents.evidenceTemplate, /Redacted readiness report/);
assert.match(contents.evidenceTemplate, /Redacted readiness report SHA-256/);
assert.match(contents.evidenceTemplate, /Redacted closeout summary/);
assert.match(contents.evidenceTemplate, /Partial gate report/);
assert.match(contents.evidenceTemplate, /Partial gate report SHA-256/);
assert.match(contents.evidenceTemplate, /Production evidence checklist/);
assert.match(contents.evidenceTemplate, /Production evidence checklist SHA-256/);
assert.match(contents.gates, /--out=<path>/);
assert.match(contents.gates, /--env-file=<path>/);
assert.match(contents.gates, /verify-production-acceptance-evidence-record\.ts/);
assert.match(contents.gates, /pnpm run closeout:production/);
assert.match(contents.gates, /--summary-out=<path>/);
assert.match(contents.gates, /--summary-out=\/tmp\/kiddzonl-production-closeout-summary\.json/);
assert.match(contents.gates, /--partials-out=<path>/);
assert.match(contents.gates, /--partials-out=\/tmp\/kiddzonl-production-partials\.json/);
assert.match(contents.gates, /--checklist-out=<path>/);
assert.match(contents.gates, /--checklist-out=\/tmp\/kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.gates, /summary includes the redacted readiness counts/);
assert.match(contents.gates, /partial report path/);
assert.match(contents.gates, /partial report counts/);
assert.match(contents.gates, /evidence checklist path/);
assert.match(contents.gates, /evidence checklist counts/);
assert.match(contents.gates, /artifact SHA-256 digests/);
assert.match(contents.gates, /artifact consistency status/);
assert.match(contents.gates, /verify-production-artifact-consistency-contract\.ts/);
assert.match(contents.gates, /verify-production-closeout-summary-contract\.ts/);
assert.match(contents.gates, /archived closeout\/partial\/checklist artifact pointers/);
assert.match(contents.gates, /archived closeout summary against the saved artifact paths and SHA-256 digests/);
assert.match(contents.gates, /page-parity tracker counts/);
assert.match(contents.gates, /--require-zero-partials/);
assert.match(contents.gates, /report-production-partials\.ts/);
assert.match(contents.gates, /report-production-evidence-checklist\.ts/);
assert.match(contents.gates, /kiddzonl-production-partials\.json/);
assert.match(contents.gates, /kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.gates, /--readiness-report=<path>/);
assert.match(contents.gates, /--readiness-report=\/tmp\/kiddzonl-production-readiness\.json/);
assert.match(contents.gates, /--summary-report=<path>/);
assert.match(contents.gates, /--partial-report=<path>/);
assert.match(contents.gates, /--checklist-report=<path>/);
assert.match(contents.gates, /--readiness-digest=<sha256>/);
assert.match(contents.gates, /--partial-digest=<sha256>/);
assert.match(contents.gates, /--checklist-digest=<sha256>/);
assert.match(contents.gates, /--branch=legacy-parity-runbook/);
assert.match(contents.gates, /--commit=<release-commit-sha>/);
assert.match(contents.gates, /--list-requirements/);
assert.match(contents.gates, /--gate=PROD-CRON/);
assert.match(contents.gates, /pnpm run verify:production-gates/);
assert.match(contents.gates, /verify-production-gate-suite\.ts/);
assert.match(contents.gates, /verify-production-artifact-consistency-contract\.ts/);
assert.match(contents.gates, /verify-production-readiness-audit-contract\.ts/);
assert.match(contents.cutoverRunbook, /--out=\/tmp\/kiddzonl-production-readiness\.json/);
assert.match(contents.cutoverRunbook, /--env-file=\/secure\/private-readiness\.env/);
assert.match(contents.cutoverRunbook, /verify-production-acceptance-evidence-record\.ts \/secure\/production-acceptance-evidence\.md --readiness-report=\/tmp\/kiddzonl-production-readiness\.json --branch=legacy-parity-runbook --commit=<release-commit-sha>/);
assert.match(contents.cutoverRunbook, /pnpm run closeout:production/);
assert.match(contents.cutoverRunbook, /--summary-out=\/tmp\/kiddzonl-production-closeout-summary\.json/);
assert.match(contents.cutoverRunbook, /--partials-out=\/tmp\/kiddzonl-production-partials\.json/);
assert.match(contents.cutoverRunbook, /--checklist-out=\/tmp\/kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.cutoverRunbook, /report-production-evidence-checklist\.ts --gate=PROD-CRON/);
assert.match(contents.cutoverRunbook, /--require-zero-partials/);
assert.match(contents.cutoverRunbook, /release decision `accepted` and remaining production tickets `none`/);
assert.match(contents.cutoverRunbook, /closeout summary JSON files are archived/);
assert.match(contents.cutoverRunbook, /production evidence checklist JSON is archived/);
assert.match(contents.cutoverRunbook, /archived redacted readiness report, closeout summary, partial gate report, and production evidence checklist/);
assert.match(contents.cutoverRunbook, /final closeout command passes with `--require-zero-partials`/);
assert.match(contents.cutoverRunbook, /--list-requirements/);
assert.match(contents.cutoverRunbook, /--gate=PROD-CRON/);
assert.match(contents.cutoverRunbook, /pnpm run verify:production-gates/);
assert.match(contents.cutoverRunbook, /verify-production-readiness-audit-contract\.ts/);
assert.equal(
  packageJson.scripts["verify:production-gates"],
  "tsx src/scripts/verify-production-gate-suite.ts"
);
assert.equal(
  packageJson.scripts["closeout:production"],
  "tsx src/scripts/run-production-closeout.ts"
);

console.log("production acceptance gates contract assertions passed");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
