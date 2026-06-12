import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  fileStoragePipeline: "docs/file-storage-pipeline.md",
  legacyFileStorageRules: "docs/legacy-file-storage-rules.md",
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
  "src/scripts/migration/README.md",
  "src/scripts/audit-production-readiness.ts",
  "src/scripts/render-production-readiness-env-template.ts",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  "src/scripts/render-production-acceptance-evidence-record.ts",
  "src/scripts/run-production-closeout.ts",
  "src/scripts/report-production-partials.ts",
  "src/scripts/report-production-focused-artifacts.ts",
  "src/scripts/report-production-preflight-artifacts.ts",
  "src/scripts/report-production-gate-status.ts",
  "src/scripts/verify-production-preflight-artifacts-manifest.ts",
  "src/scripts/verify-production-focused-artifacts-manifest.ts",
  "src/scripts/verify-production-focused-artifacts-manifest-contract.ts",
  "src/scripts/verify-production-gate-status-contract.ts",
  "src/scripts/report-production-evidence-checklist.ts",
  "src/scripts/verify-production-gate-suite.ts",
  "src/scripts/verify-production-acceptance-evidence-record-contract.ts",
  "src/scripts/verify-production-acceptance-evidence-renderer-contract.ts",
  "src/scripts/verify-production-closeout-contract.ts",
  "src/scripts/verify-production-closeout-summary-contract.ts",
  "src/scripts/verify-production-evidence-package-contract.ts",
  "src/scripts/verify-production-partial-report-contract.ts",
  "src/scripts/verify-production-evidence-checklist-contract.ts",
  "src/scripts/verify-production-artifact-consistency-contract.ts",
  "src/scripts/verify-production-focused-artifacts-contract.ts",
  "src/scripts/verify-production-preflight-artifacts-contract.ts",
  "src/scripts/verify-production-readiness-audit-contract.ts",
  "src/scripts/verify-production-readiness-env-template-contract.ts",
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
  "PROVIDER_DELIVERY_ACCEPTANCE_REPORT",
  "PROVIDER_CHANNEL_ROLLOUT_REPORT",
  "PROVIDER_RESPONSE_ID_AUDIT_REPORT",
  "PROVIDER_CHANNEL_DECISION_REPORT",
  "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT",
  "SMS_DELIVERY_PROVIDER",
  "SMS_DELIVERY_WEBHOOK_URL",
  "WHATSAPP_DELIVERY_PROVIDER",
  "WHATSAPP_DELIVERY_WEBHOOK_URL",
  "LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL",
]) {
  assert.match(contents.gates, new RegExp(`\\b${envName}\\b`), `${envName} must be named without a value`);
  assert.doesNotMatch(contents.gates, new RegExp(`${envName}\\s*=`), `${envName} must not have an inline value`);
}

for (const evidenceEnvName of [
  "LEGACY_PRODUCTION_DUMP_MANIFEST",
  "LEGACY_SCHOOL_YEAR_DUMP_COVERAGE_REPORT",
  "LEGACY_DUMP_CHECKSUM_MANIFEST",
  "LEGACY_FIRST_MIGRATION_SOURCE_REPORT",
  "LEGACY_MEDIA_AUDIT_REPORT",
  "LEGACY_MEDIA_EXPORT_MANIFEST",
  "LEGACY_MEDIA_UPLOAD_MANIFEST",
  "LEGACY_MEDIA_STORAGE_INTEGRITY_REPORT",
  "LEGACY_MEDIA_MISSING_FILE_TRIAGE_REPORT",
  "LEGACY_MEDIA_URL_APPLY_MANIFEST",
  "MIGRATION_RECONCILIATION_REPORT",
  "MIGRATION_RECONCILIATION_MISMATCH_TRIAGE_REPORT",
  "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT",
  "PRODUCTION_CRONTAB_EVIDENCE",
  "CRON_HELPER_DECISION_REPORT",
  "CRON_SCHEDULE_COVERAGE_REPORT",
  "HOSTED_DAILY_SCHEDULE_EVIDENCE",
  "HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE",
  "HOSTED_SCHEDULER_EVIDENCE",
  "CRON_PARTIAL_ROW_COVERAGE_REPORT",
  "CRON_SECRET",
  "VERCEL_CRON_SECRET",
  "PROVIDER_CHANNEL_ROLLOUT_REPORT",
  "PROVIDER_RESPONSE_ID_AUDIT_REPORT",
  "PROVIDER_CHANNEL_DECISION_REPORT",
  "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT",
  "NATIVE_IOS_ACCEPTANCE_REPORT",
  "NATIVE_ANDROID_ACCEPTANCE_REPORT",
  "NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT",
  "NATIVE_CRASH_PARSER_AUDIT_REPORT",
  "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT",
  "NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT",
  "NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT",
  "NATIVE_PARTIAL_ROW_COVERAGE_REPORT",
  "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT",
  "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT",
  "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT",
  "PRINT_ACCOUNTING_MATRIX_ACCEPTANCE_REPORT",
  "PRINT_INVOICE_RECEIPT_ACCEPTANCE_REPORT",
  "PRINT_STATIONERY_ACCEPTANCE_REPORT",
  "REAL_CALL_ROWS_ACCEPTANCE_REPORT",
  "CALL_SUBMITTED_DRAFT_ACCEPTANCE_REPORT",
  "CALL_PHP_BRIDGE_ACCEPTANCE_REPORT",
  "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT",
  "NURSERY_BRANCH_BRIDGE_ACCEPTANCE_REPORT",
  "NURSERY_DOCUMENT_UPLOAD_ACCEPTANCE_REPORT",
  "LEGACY_ACL_ACCEPTANCE_REPORT",
  "LEGACY_PAGE_GUARD_ACCEPTANCE_REPORT",
  "LEGACY_ACTION_GUARD_ACCEPTANCE_REPORT",
  "LEGACY_BACKFILL_ACCEPTANCE_REPORT",
  "LEGACY_BACKFILL_RERUN_REPORT",
  "LEGACY_BACKFILL_TICKET_TRIAGE_REPORT",
]) {
  assert.match(contents.gates, new RegExp(`\\b${evidenceEnvName}\\b`), `${evidenceEnvName} must be documented in production gates`);
}

assert.doesNotMatch(contents.gates, /https?:\/\/[^\s)]+/i, "production gates must not include webhook URLs");
assert.doesNotMatch(contents.evidenceTemplate, /https?:\/\/[^\s)]+/i, "evidence template must not include webhook URLs");
assert.doesNotMatch(contents.cutoverRunbook, /https?:\/\/[^\s)]+/i, "cutover runbook must not include webhook URLs");
assert.doesNotMatch(contents.partialGateMap, /https?:\/\/[^\s)]+/i, "partial gate map must not include webhook URLs");
assert.doesNotMatch(contents.gates, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "production gates must not include secret values");
assert.doesNotMatch(contents.evidenceTemplate, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "evidence template must not include secret values");
assert.doesNotMatch(contents.cutoverRunbook, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "cutover runbook must not include secret values");
assert.doesNotMatch(contents.partialGateMap, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "partial gate map must not include secret values");

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
const evidenceRecordRenderer = readFileSync("src/scripts/render-production-acceptance-evidence-record.ts", "utf8");
const closeoutRunner = readFileSync("src/scripts/run-production-closeout.ts", "utf8");
const partialReporter = readFileSync("src/scripts/report-production-partials.ts", "utf8");
const evidenceChecklistReporter = readFileSync("src/scripts/report-production-evidence-checklist.ts", "utf8");
const productionGateSuite = readFileSync("src/scripts/verify-production-gate-suite.ts", "utf8");
const legacyFileExporter = readFileSync("src/scripts/migration/export-legacy-files.ts", "utf8");
const legacyFileUploader = readFileSync("src/scripts/migration/upload-legacy-file-export.ts", "utf8");
const legacyFileUrlApplier = readFileSync("src/scripts/migration/apply-legacy-file-urls.ts", "utf8");
assert.match(readinessAudit, /No environment values/);
assert.match(readinessAudit, /schemaVersion: 1/);
assert.match(readinessAudit, /--out/);
assert.match(readinessAudit, /--env-file/);
assert.match(readinessAudit, /--generated-at must be an ISO timestamp/);
assert.match(readinessAudit, /--list-requirements/);
assert.match(readinessAudit, /--gate/);
assert.match(readinessAudit, /isPlaceholderValue/);
assert.match(readinessAudit, /replace-me/);
assert.match(readinessAudit, /non-secret-report-id/);
assert.match(evidenceRecordVerifier, /placeholder\/empty value/);
assert.match(evidenceRecordVerifier, /\^<\[\^>\]\+\>\$/);
assert.match(evidenceRecordVerifier, /non-secret\\s\+\.\*\\b\(id\|path\|label\|pointer\)\\b/);
assert.match(evidenceRecordVerifier, /raw URLs/);
assert.match(evidenceRecordVerifier, /phone numbers/);
assert.match(evidenceRecordVerifier, /--readiness-report/);
assert.match(evidenceRecordVerifier, /--summary-report/);
assert.match(evidenceRecordVerifier, /--partial-report/);
assert.match(evidenceRecordVerifier, /--checklist-report/);
assert.match(evidenceRecordVerifier, /--readiness-digest/);
assert.match(evidenceRecordVerifier, /--summary-digest/);
assert.match(evidenceRecordVerifier, /--partial-digest/);
assert.match(evidenceRecordVerifier, /--checklist-digest/);
assert.match(evidenceRecordVerifier, /--branch/);
assert.match(evidenceRecordVerifier, /--commit/);
assert.match(evidenceRecordVerifier, /sha256File\(artifact\.path\)/);
assert.match(evidenceRecordVerifier, /verifyArtifactPointers/);
assert.match(evidenceRecordVerifier, /remaining production tickets must be none/);
assert.match(evidenceRecordVerifier, /release decision must be accepted/);
assert.match(evidenceRecordRenderer, /--summary-digest=<sha256>/);
assert.match(evidenceRecordRenderer, /verified in evidence package manifest/);
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
assert.match(closeoutRunner, /schemaVersion: 1/);
assert.match(closeoutRunner, /generatedAt/);
assert.match(closeoutRunner, /evidenceChecklist/);
assert.match(closeoutRunner, /evidenceRecord/);
assert.match(closeoutRunner, /partialReportSummary/);
assert.match(closeoutRunner, /evidenceChecklistSummary/);
assert.match(closeoutRunner, /artifactDigests/);
assert.match(closeoutRunner, /sha256/);
assert.match(closeoutRunner, /artifactConsistency/);
assert.match(closeoutRunner, /--require-zero-partials/);
assert.match(closeoutRunner, /--generated-at must be an ISO timestamp/);
assert.match(partialReporter, /--generated-at must be an ISO timestamp/);
assert.match(evidenceChecklistReporter, /--generated-at must be an ISO timestamp/);
assert.match(closeoutRunner, /--generated-at/);
assert.match(closeoutRunner, /must also include --summary-out, --partials-out, and --checklist-out/);
assert.match(closeoutRunner, /must include explicit --branch and --commit release refs/);
assert.match(partialReporter, /partial-production-gate-map\.md/);
assert.match(partialReporter, /page-parity-matrix\.json/);
assert.match(partialReporter, /generatedAt/);
assert.match(partialReporter, /schemaVersion: 1/);
assert.match(partialReporter, /gateCounts/);
assert.match(evidenceChecklistReporter, /production-acceptance-evidence-spec/);
assert.match(evidenceChecklistReporter, /partial-production-gate-map\.md/);
assert.match(evidenceChecklistReporter, /generatedAt/);
assert.match(evidenceChecklistReporter, /schemaVersion: 1/);
assert.match(evidenceChecklistReporter, /--gate/);
assert.match(evidenceChecklistReporter, /--out/);
assert.match(legacyFileExporter, /schemaVersion: 1/);
assert.match(legacyFileUploader, /schemaVersion: 1/);
assert.match(legacyFileUploader, /sourceManifestSchemaVersion/);
assert.match(legacyFileUrlApplier, /schemaVersion: 1/);
assert.match(legacyFileUrlApplier, /sourceUploadManifestSchemaVersion/);
assert.match(contents.fileStoragePipeline, /schemaVersion: 1/);
assert.match(contents.fileStoragePipeline, /prove lineage from legacy file package to object storage to database URL rewrite/);
assert.match(contents.legacyFileStorageRules, /schemaVersion: 1/);
assert.match(contents.legacyFileStorageRules, /trace the full restore chain/);
assert.match(productionGateSuite, /verify-production-acceptance-gates-contract\.ts/);
assert.match(productionGateSuite, /verify-production-readiness-audit-contract\.ts/);
assert.match(productionGateSuite, /verify-production-acceptance-evidence-record-contract\.ts/);
assert.match(productionGateSuite, /verify-production-acceptance-evidence-renderer-contract\.ts/);
assert.match(productionGateSuite, /verify-production-closeout-contract\.ts/);
assert.match(productionGateSuite, /verify-production-closeout-summary-contract\.ts/);
assert.match(productionGateSuite, /verify-production-evidence-package-contract\.ts/);
assert.match(productionGateSuite, /verify-production-partial-report-contract\.ts/);
assert.match(productionGateSuite, /verify-production-evidence-checklist-contract\.ts/);
assert.match(productionGateSuite, /verify-production-artifact-consistency-contract\.ts/);
assert.match(productionGateSuite, /verify-production-preflight-artifacts-contract\.ts/);
assert.match(productionGateSuite, /verify-production-gate-ledger-contract\.ts/);
assert.match(productionGateSuite, /verify-next-codex-handoff-contract\.ts/);
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
  readFileSync("src/scripts/verify-production-closeout-contract.ts", "utf8"),
  /missingFinalArtifacts/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /production closeout summary schema version drifted/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /partial report digest mismatch/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /evidence record digest mismatch/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /verify-production-acceptance-evidence-record\.ts/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /verify-production-artifact-consistency-contract\.ts/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /production closeout summary must come from a require-zero-partials run/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /requires --branch/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /requires --commit/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /production closeout summary commit drifted/
);
assert.match(
  readFileSync("src/scripts/verify-production-closeout-summary-contract.ts", "utf8"),
  /production closeout summary still has unresolved partial rows/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /production evidence package verified/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /--manifest-out/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /--manifest/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /--require-zero-partials/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /requires --branch/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /requires --commit/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /production evidence package commit drifted/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /schemaVersion: 1/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /generatedAt: params\.summary\.generatedAt/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /generatedAtFromJson/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /artifacts\.partialReport\.generatedAt/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /optionalArg\("--branch", expectedBranch\)/
);
assert.match(
  readFileSync("src/scripts/verify-production-evidence-package-contract.ts", "utf8"),
  /optionalArg\("--commit", expectedCommit\)/
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
assert.match(
  readFileSync("src/scripts/verify-production-gate-ledger-contract.ts", "utf8"),
  /PROD-CRON/
);
assert.match(
  readFileSync("src/scripts/verify-production-gate-ledger-contract.ts", "utf8"),
  /ordering\/content still needs acceptance/
);
assert.match(contents.evidenceTemplate, /Redacted readiness report/);
assert.match(contents.evidenceTemplate, /Redacted readiness report SHA-256/);
assert.match(contents.evidenceTemplate, /Redacted closeout summary/);
assert.match(contents.evidenceTemplate, /Redacted closeout summary SHA-256/);
assert.match(contents.evidenceTemplate, /Partial gate report/);
assert.match(contents.evidenceTemplate, /Partial gate report SHA-256/);
assert.match(contents.evidenceTemplate, /Production evidence checklist/);
assert.match(contents.evidenceTemplate, /Production evidence checklist SHA-256/);
assert.match(contents.gates, /--out=<path>/);
assert.match(contents.gates, /--env-file=<path>/);
assert.match(contents.gates, /verify-production-acceptance-evidence-record\.ts/);
assert.match(contents.gates, /render-production-acceptance-evidence-record\.ts/);
assert.match(contents.gates, /pnpm run closeout:production/);
assert.match(contents.gates, /--summary-out=<path>/);
assert.match(contents.gates, /--summary-out=\/tmp\/kiddzonl-production-closeout-summary\.json/);
assert.match(contents.gates, /--partials-out=<path>/);
assert.match(contents.gates, /--partials-out=\/tmp\/kiddzonl-production-partials\.json/);
assert.match(contents.gates, /--checklist-out=<path>/);
assert.match(contents.gates, /--checklist-out=\/tmp\/kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.gates, /The summary includes `schemaVersion: 1`, its own `generatedAt` ISO timestamp/);
assert.match(contents.gates, /`schemaVersion: 1`/);
assert.match(contents.gates, /redacted readiness counts/);
assert.match(contents.gates, /partial report path/);
assert.match(contents.gates, /partial report counts/);
assert.match(contents.gates, /evidence checklist path/);
assert.match(contents.gates, /evidence checklist counts/);
assert.match(contents.gates, /artifact SHA-256 digests/);
assert.match(contents.gates, /artifact consistency status/);
assert.match(contents.gates, /final closeout cannot fall back to an implicit local git ref/);
assert.match(contents.gates, /Use the same `--generated-at=<iso>` value/);
assert.match(contents.gates, /readiness, partial, checklist, and closeout artifacts/);
assert.match(contents.gates, /verify-production-artifact-consistency-contract\.ts/);
assert.match(contents.gates, /compares rows, gates, summaries, and gate-map source paths/);
assert.match(contents.gates, /requires both artifacts to name the same gate-map source path/);
assert.match(contents.gates, /verify-production-closeout-summary-contract\.ts/);
assert.match(contents.gates, /verify-production-evidence-package-contract\.ts/);
assert.match(contents.gates, /reruns `verify-production-acceptance-evidence-record\.ts`/);
assert.match(contents.gates, /--manifest-out=<path>/);
assert.match(contents.gates, /--manifest=<path>/);
assert.match(contents.gates, /`generatedAt` metadata for JSON artifacts/);
assert.match(contents.gates, /top-level `generatedAt` timestamp from the closeout summary/);
assert.match(contents.gates, /Package verification requires the closeout summary, readiness report, partial report, and evidence checklist to share that same `generatedAt` timestamp/);
assert.match(contents.gates, /schemaVersion: 1/);
assert.match(contents.gates, /--branch=<branch>/);
assert.match(contents.gates, /--commit=<sha>/);
assert.match(contents.gates, /bind the archived summary to the intended release ref/);
assert.match(contents.gates, /both are required with `--require-zero-partials` during final closure so the summary cannot be accepted without an explicit release ref/);
assert.match(contents.gates, /both are required with `--require-zero-partials` during final closure so the package cannot be accepted without an explicit release ref/);
assert.match(contents.gates, /--manifest-out=\/tmp\/kiddzonl-production-evidence-package\.json --branch=legacy-parity-runbook --commit=<release-commit-sha>/);
assert.match(contents.gates, /--require-zero-partials/);
assert.match(contents.gates, /archived closeout\/partial\/checklist artifact pointers/);
assert.match(contents.gates, /archived closeout summary against the saved artifact paths and SHA-256 digests/);
assert.match(contents.gates, /page-parity tracker counts/);
assert.match(contents.gates, /source matrix\/gate-map paths/);
assert.match(contents.gates, /requires the archived partial report and evidence checklist to match the closeout summary's recorded source matrix\/gate-map paths/);
assert.match(contents.gates, /manifest also carries the closeout source matrix\/gate-map paths/);
assert.match(contents.gates, /--require-zero-partials/);
assert.match(contents.gates, /report-production-partials\.ts/);
assert.match(contents.gates, /report-production-focused-artifacts\.ts/);
assert.match(contents.gates, /report-production-preflight-artifacts\.ts/);
assert.match(contents.gates, /report-production-gate-status\.ts/);
assert.match(contents.gates, /--require-ready/);
assert.match(contents.gates, /--require-no-blockers/);
assert.match(contents.gates, /sourceAlignment\.status=verified/);
assert.match(contents.gates, /verify-production-preflight-artifacts-manifest\.ts/);
assert.match(contents.gates, /verify-production-focused-artifacts-manifest\.ts/);
assert.match(contents.gates, /report-production-evidence-checklist\.ts/);
assert.match(contents.gates, /`generatedAt` ISO timestamps/);
assert.match(contents.gates, /readiness, partial, checklist, closeout summary, and evidence package JSON artifacts carry `schemaVersion: 1`/);
assert.match(contents.gates, /kiddzonl-production-partials\.json/);
assert.match(contents.gates, /kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.gates, /kiddzonl-production-preflight-artifacts\.json/);
assert.match(contents.gates, /--readiness-report=<path>/);
assert.match(contents.gates, /--summary-digest=<sha256>/);
assert.match(contents.gates, /--readiness-report=\/tmp\/kiddzonl-production-readiness\.json/);
assert.match(contents.gates, /verify-production-closeout-summary-contract\.ts .*--require-zero-partials/);
assert.match(contents.gates, /verify-production-closeout-summary-contract\.ts .*--branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials/);
assert.match(contents.gates, /--evidence-record=<path>/);
assert.match(contents.gates, /--evidence-record=\/secure\/production-acceptance-evidence\.md/);
assert.match(contents.gates, /--summary-report=<path>/);
assert.match(contents.gates, /--partial-report=<path>/);
assert.match(contents.gates, /--checklist-report=<path>/);
assert.match(contents.gates, /--readiness-digest=<sha256>/);
assert.match(contents.gates, /--summary-digest=<sha256>/);
assert.match(contents.gates, /--partial-digest=<sha256>/);
assert.match(contents.gates, /--checklist-digest=<sha256>/);
assert.match(contents.gates, /--branch=legacy-parity-runbook/);
assert.match(contents.gates, /--commit=<release-commit-sha>/);
assert.match(contents.gates, /--generated-at=<release-generated-at-iso>/);
assert.match(contents.gates, /--list-requirements/);
assert.match(contents.gates, /render-production-readiness-env-template\.ts --out=\/secure\/private-readiness\.env/);
assert.match(contents.gates, /render-production-readiness-env-template\.ts` generates a private `\.env` skeleton/);
assert.match(contents.gates, /verify-production-readiness-env-template-contract\.ts/);
assert.match(contents.gates, /--gate=PROD-CRON/);
for (const focusedGate of ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"]) {
  assert.match(
    contents.cutoverRunbook,
    new RegExp(`report-production-partials\\.ts --json --gate=${focusedGate}`),
    `${focusedGate} focused partial report command is missing from cutover runbook`
  );
  assert.match(
    contents.cutoverRunbook,
    new RegExp(`report-production-evidence-checklist\\.ts --json --gate=${focusedGate}`),
    `${focusedGate} focused checklist command is missing from cutover runbook`
  );
}
for (const focusedArtifact of ["cron", "provider", "native", "nature"]) {
  assert.match(
    contents.cutoverRunbook,
    new RegExp(
      `verify-production-artifact-consistency-contract\\.ts --partial-report=/tmp/kiddzonl-production-${focusedArtifact}-partials\\.json --checklist-report=/tmp/kiddzonl-production-${focusedArtifact}-checklist\\.json`
    ),
    `${focusedArtifact} focused artifact consistency command is missing from cutover runbook`
  );
}
assert.match(contents.gates, /pnpm run verify:production-gates/);
assert.match(contents.gates, /verify-production-gate-suite\.ts/);
assert.match(contents.gates, /verify-production-artifact-consistency-contract\.ts/);
assert.match(contents.gates, /verify-production-focused-artifacts-contract\.ts/);
assert.match(contents.gates, /verify-production-focused-artifacts-manifest-contract\.ts/);
assert.match(contents.gates, /requiring every nested focused partial\/checklist artifact to match the manifest timestamp, source matrix\/gate-map paths, and gate filter/);
assert.match(contents.gates, /verify-production-gate-status-contract\.ts/);
assert.match(contents.gates, /verify-production-readiness-audit-contract\.ts/);
assert.match(contents.gates, /preflight artifact contract/);
assert.match(contents.gates, /readiness env template contract/);
assert.match(contents.gates, /report-production-gate-status\.ts --json --blocking-only --out=\/tmp\/kiddzonl-production-blocking-gate-status\.json --generated-at=<release-generated-at-iso>/);
assert.match(contents.gates, /report-production-preflight-artifacts\.ts --out-dir=\/tmp\/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>/);
assert.match(contents.gates, /verify-production-preflight-artifacts-manifest\.ts --manifest=\/tmp\/kiddzonl-production-preflight-artifacts\/kiddzonl-production-preflight-artifacts\.json/);
assert.match(contents.gates, /requiring the blocker-status report plus nested focused manifest to match the source matrix\/gate-map paths recorded in the saved manifest/);
assert.match(contents.gates, /requiring all bundled JSON artifacts to share the preflight manifest `generatedAt` timestamp/);
assert.match(contents.gates, /source matrix\/gate-map paths without printing values/);
assert.match(contents.gates, /verify-production-preflight-artifacts-contract\.ts/);
assert.match(contents.gates, /`--blocking-only` to show only gates that still block partial parity rows/);
assert.match(contents.cutoverRunbook, /render-production-readiness-env-template\.ts --out=\/secure\/private-readiness\.env/);
assert.match(contents.cutoverRunbook, /render-production-readiness-env-template\.ts --gate=PROD-CRON/);
assert.match(contents.cutoverRunbook, /verify-production-readiness-env-template-contract\.ts/);
assert.doesNotMatch(contents.gates, /docs\/production-readiness\.env\.example/);
assert.doesNotMatch(contents.cutoverRunbook, /docs\/production-readiness\.env\.example/);
assert.equal(existsSync("docs/production-readiness.env.example"), false);
assert.match(contents.cutoverRunbook, /--out=\/tmp\/kiddzonl-production-readiness\.json/);
assert.match(contents.cutoverRunbook, /report-production-gate-status\.ts --json --out=\/tmp\/kiddzonl-production-gate-status\.json --generated-at=<release-generated-at-iso>/);
assert.match(contents.cutoverRunbook, /report-production-gate-status\.ts --json --blocking-only --out=\/tmp\/kiddzonl-production-blocking-gate-status\.json --generated-at=<release-generated-at-iso>/);
assert.match(contents.cutoverRunbook, /report-production-preflight-artifacts\.ts --out-dir=\/tmp\/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>/);
assert.match(contents.cutoverRunbook, /verify-production-preflight-artifacts-manifest\.ts --manifest=\/tmp\/kiddzonl-production-preflight-artifacts\/kiddzonl-production-preflight-artifacts\.json/);
assert.match(contents.cutoverRunbook, /report-production-gate-status\.ts --json --env-file=\/secure\/private-readiness\.env --out=\/tmp\/kiddzonl-production-gate-status\.json --generated-at=<release-generated-at-iso> --require-ready --require-no-blockers/);
assert.match(contents.cutoverRunbook, /--env-file=\/secure\/private-readiness\.env/);
assert.match(contents.cutoverRunbook, /verify-production-acceptance-evidence-record\.ts \/secure\/production-acceptance-evidence\.md --readiness-report=\/tmp\/kiddzonl-production-readiness\.json --summary-report=\/tmp\/kiddzonl-production-closeout-summary\.json --partial-report=\/tmp\/kiddzonl-production-partials\.json --checklist-report=\/tmp\/kiddzonl-production-evidence-checklist\.json --readiness-digest=<readiness-sha256> --partial-digest=<partials-sha256> --checklist-digest=<checklist-sha256> --branch=legacy-parity-runbook --commit=<release-commit-sha>/);
assert.match(contents.cutoverRunbook, /pnpm run closeout:production/);
for (const line of contents.cutoverRunbook.split(/\r?\n/).filter((entry) => entry.includes("pnpm run closeout:production"))) {
  assert.match(line, /--generated-at=<release-generated-at-iso>/);
}
assert.match(contents.cutoverRunbook, /--summary-out=\/tmp\/kiddzonl-production-closeout-summary\.json/);
assert.match(contents.cutoverRunbook, /--partials-out=\/tmp\/kiddzonl-production-partials\.json/);
assert.match(contents.cutoverRunbook, /--checklist-out=\/tmp\/kiddzonl-production-evidence-checklist\.json/);
assert.match(contents.cutoverRunbook, /--generated-at=<release-generated-at-iso>/);
assert.match(contents.cutoverRunbook, /verify-production-closeout-summary-contract\.ts/);
assert.match(contents.cutoverRunbook, /verify-production-closeout-summary-contract\.ts .*--require-zero-partials/);
assert.match(contents.cutoverRunbook, /verify-production-closeout-summary-contract\.ts .*--branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials/);
assert.match(contents.cutoverRunbook, /verify-production-evidence-package-contract\.ts/);
assert.match(contents.cutoverRunbook, /--evidence-record=\/secure\/production-acceptance-evidence\.md/);
assert.match(contents.cutoverRunbook, /render-production-acceptance-evidence-record\.ts --out=\/secure\/production-acceptance-evidence\.md/);
assert.match(contents.cutoverRunbook, /--manifest-out=\/tmp\/kiddzonl-production-evidence-package\.json/);
assert.match(contents.cutoverRunbook, /--manifest-out=\/tmp\/kiddzonl-production-evidence-package\.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials/);
assert.match(contents.cutoverRunbook, /report-production-evidence-checklist\.ts --gate=PROD-CRON/);
assert.match(contents.cutoverRunbook, /Generate focused non-secret coverage reports from the parity matrix/);
assert.match(contents.cutoverRunbook, /report-production-focused-artifacts\.ts --out-dir=\/tmp\/kiddzonl-production-focused-artifacts --generated-at=<release-generated-at-iso>/);
assert.match(contents.cutoverRunbook, /verify-production-focused-artifacts-manifest\.ts --manifest=\/tmp\/kiddzonl-production-focused-artifacts\/kiddzonl-production-focused-artifacts\.json/);
assert.match(contents.gates, /report-production-focused-artifacts\.ts --out-dir=<dir>/);
assert.match(contents.gates, /verify-production-preflight-artifacts-manifest\.ts --manifest=<path>/);
assert.match(contents.gates, /verify-production-focused-artifacts-manifest\.ts --manifest=<path>/);
assert.match(contents.gates, /kiddzonl-production-focused-artifacts\.json/);
assert.match(contents.cutoverRunbook, /--require-zero-partials/);
assert.match(contents.cutoverRunbook, /release decision `accepted` and remaining production tickets `none`/);
assert.match(contents.cutoverRunbook, /closeout summary JSON files are archived/);
assert.match(contents.cutoverRunbook, /production evidence checklist JSON is archived/);
assert.match(contents.cutoverRunbook, /filled production acceptance record is archived and hash-bound/);
assert.match(contents.cutoverRunbook, /production evidence package manifest is archived/);
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
