import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type GateStatusReport = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  redacted?: boolean;
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    missingEvidenceItems?: number;
  };
  sourceAlignment?: {
    status?: string;
    generatedAt?: string;
    readinessGeneratedAt?: string;
    partialReportGeneratedAt?: string;
    evidenceChecklistGeneratedAt?: string;
    partialReportRows?: number;
    checklistBlockingRows?: number;
    gateCounts?: Record<string, number>;
  };
  gates?: Array<{
    gate?: string;
    status?: string;
    missingEvidence?: string[];
    requiredEvidenceFields?: string[];
    blockingPartialRows?: Array<{ row?: string }>;
  }>;
};

const generatedAt = "2026-06-10T00:00:00.000Z";
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-gate-status-"));

try {
  const reportPath = join(tmp, "production-gate-status.json");
  const zeroParityMatrixPath = join(tmp, "zero-page-parity-matrix.json");
  const zeroPartialGateMapPath = join(tmp, "zero-partial-production-gate-map.md");
  const output = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    `--generated-at=${generatedAt}`,
    `--out=${reportPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const report = JSON.parse(output) as GateStatusReport;
  assert.deepEqual(JSON.parse(readFileSync(reportPath, "utf8")), report);
  assert.equal(report.status, "production gate status report");
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.generatedAt, generatedAt);
  assert.equal(report.redacted, true);
  assert.deepEqual(report.summary, {
    gates: 12,
    ready: 0,
    needsEvidence: 12,
    blockingPartialRows: 17,
    missingEvidenceItems: 56,
  });
  assert.deepEqual(report.sourceAlignment, {
    status: "verified",
    generatedAt,
    readinessGeneratedAt: generatedAt,
    partialReportGeneratedAt: generatedAt,
    evidenceChecklistGeneratedAt: generatedAt,
    partialReportRows: 17,
    checklistBlockingRows: 17,
    gateCounts: {
      "PROD-CRON": 9,
      "PROD-NATIVE": 3,
      "PROD-NATURE": 1,
      "PROD-PROVIDERS": 14,
    },
  });
  assert.deepEqual(report.gates?.map((gate) => gate.gate), [
    "PROD-ACL",
    "PROD-BACKFILL",
    "PROD-CALLS",
    "PROD-CRON",
    "PROD-DUMPS",
    "PROD-MEDIA",
    "PROD-NATIVE",
    "PROD-NATURE",
    "PROD-NURSERY",
    "PROD-PRINT",
    "PROD-PROVIDERS",
    "PROD-RECON",
  ]);
  const cron = report.gates?.find((gate) => gate.gate === "PROD-CRON");
  assert.deepEqual(cron?.blockingPartialRows?.map((row) => row.row), ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"]);
  assert.ok(cron?.missingEvidence?.includes("CRON_PARTIAL_ROW_COVERAGE_REPORT"));
  assert.equal(cron?.requiredEvidenceFields?.length, 8);

  const provider = report.gates?.find((gate) => gate.gate === "PROD-PROVIDERS");
  assert.equal(provider?.blockingPartialRows?.length, 14);
  assert.ok(provider?.missingEvidence?.includes("partial-row-evidence:PROVIDER_PARTIAL_ROW_COVERAGE_REPORT"));

  const blockingOnlyOutput = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--blocking-only",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const blockingOnly = JSON.parse(blockingOnlyOutput) as GateStatusReport;
  assert.deepEqual(blockingOnly.summary, {
    gates: 4,
    ready: 0,
    needsEvidence: 4,
    blockingPartialRows: 17,
    missingEvidenceItems: 28,
  });
  assert.equal(blockingOnly.sourceAlignment?.status, "verified");
  assert.deepEqual(blockingOnly.sourceAlignment?.gateCounts, {
    "PROD-CRON": 9,
    "PROD-NATIVE": 3,
    "PROD-NATURE": 1,
    "PROD-PROVIDERS": 14,
  });
  assert.deepEqual(blockingOnly.gates?.map((gate) => gate.gate), [
    "PROD-CRON",
    "PROD-NATIVE",
    "PROD-NATURE",
    "PROD-PROVIDERS",
  ]);
  assert.ok(blockingOnly.gates?.every((gate) => (gate.blockingPartialRows?.length ?? 0) > 0));

  const nativeOutput = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--gate=PROD-NATIVE",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const native = JSON.parse(nativeOutput) as GateStatusReport;
  assert.equal(native.summary?.gates, 1);
  assert.equal(native.summary?.blockingPartialRows, 3);
  assert.deepEqual(native.sourceAlignment?.gateCounts, {
    "PROD-NATIVE": 3,
  });
  assert.deepEqual(native.gates?.[0]?.blockingPartialRows?.map((row) => row.row), ["P15", "P16", "P17"]);

  const markdown = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--gate=PROD-NATURE",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(markdown, /# Production Gate Status Report/);
  assert.match(markdown, /PROD-NATURE/);
  assert.match(markdown, /P17/);

  const blockingMarkdown = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--blocking-only",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(blockingMarkdown, /Ready gates: 0\/4/);
  assert.match(blockingMarkdown, /PROD-CRON/);
  assert.match(blockingMarkdown, /PROD-PROVIDERS/);
  assert.doesNotMatch(blockingMarkdown, /PROD-PRINT/);

  const invalidGeneratedAt = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--generated-at=not-a-date",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(invalidGeneratedAt.status, 2);
  assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);

  const unresolvedRequireReady = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--require-ready",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(unresolvedRequireReady.status, 1);
  assert.match(unresolvedRequireReady.stdout, /"needsEvidence": 12/);

  const unresolvedRequireNoBlockers = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--require-no-blockers",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(unresolvedRequireNoBlockers.status, 1);
  assert.match(unresolvedRequireNoBlockers.stdout, /"blockingPartialRows": 17/);

  const readyEnvPath = join(tmp, "ready-private-readiness.env");
  writeFileSync(readyEnvPath, readyEnvFile(), "utf8");
  const readyRequireReady = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--require-ready",
    `--env-file=${readyEnvPath}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(readyRequireReady.status, 0, readyRequireReady.stdout + readyRequireReady.stderr);
  const ready = JSON.parse(readyRequireReady.stdout) as GateStatusReport;
  assert.deepEqual(ready.summary, {
    gates: 12,
    ready: 12,
    needsEvidence: 0,
    blockingPartialRows: 17,
    missingEvidenceItems: 0,
  });

  const readyButBlocked = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--require-ready",
    "--require-no-blockers",
    `--env-file=${readyEnvPath}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(readyButBlocked.status, 1);
  assert.match(readyButBlocked.stdout, /"ready": 12/);
  assert.match(readyButBlocked.stdout, /"blockingPartialRows": 17/);

  writeFileSync(zeroParityMatrixPath, zeroPartialMatrixJson(), "utf8");
  writeFileSync(zeroPartialGateMapPath, zeroPartialGateMapMarkdown(), "utf8");
  const readyWithoutBlockers = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-gate-status.ts",
    "--json",
    "--require-ready",
    "--require-no-blockers",
    `--env-file=${readyEnvPath}`,
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${zeroParityMatrixPath}`,
    `--partial-gate-map=${zeroPartialGateMapPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(readyWithoutBlockers.status, 0, readyWithoutBlockers.stdout + readyWithoutBlockers.stderr);
  const zeroReady = JSON.parse(readyWithoutBlockers.stdout) as GateStatusReport;
  assert.deepEqual(zeroReady.summary, {
    gates: 12,
    ready: 12,
    needsEvidence: 0,
    blockingPartialRows: 0,
    missingEvidenceItems: 0,
  });
  assert.deepEqual(zeroReady.sourceAlignment?.gateCounts, {});
  assert.equal(zeroReady.sourceAlignment?.partialReportRows, 0);
  assert.equal(zeroReady.sourceAlignment?.checklistBlockingRows, 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production gate status contract assertions passed");

function zeroPartialMatrixJson() {
  const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as unknown;

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as { status?: unknown };
    if (typeof row.status === "string" && row.status.toLowerCase().startsWith("partial")) {
      row.status = "complete - production evidence accepted for zero-blocker gate status contract";
    }
    Object.values(value).forEach(walk);
  }

  walk(matrix);
  return `${JSON.stringify(matrix, null, 2)}\n`;
}

function zeroPartialGateMapMarkdown() {
  return [
    "# Partial Production Gate Map",
    "",
    "| Row | Status anchor | Gates | Closure reason |",
    "| --- | --- | --- | --- |",
    "",
  ].join("\n");
}

function readyEnvFile() {
  return [
    "LEGACY_PRODUCTION_DUMP_MANIFEST=gate-status-dump",
    "LEGACY_SCHOOL_YEAR_DUMP_COVERAGE_REPORT=gate-status-school-year",
    "LEGACY_DUMP_CHECKSUM_MANIFEST=gate-status-checksum",
    "LEGACY_FIRST_MIGRATION_SOURCE_REPORT=gate-status-first-source",
    "LEGACY_MEDIA_AUDIT_REPORT=gate-status-media-audit",
    "LEGACY_MEDIA_EXPORT_MANIFEST=gate-status-media-export",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=gate-status-media-upload",
    "LEGACY_MEDIA_STORAGE_INTEGRITY_REPORT=gate-status-media-integrity",
    "LEGACY_MEDIA_MISSING_FILE_TRIAGE_REPORT=gate-status-media-missing",
    "LEGACY_MEDIA_URL_APPLY_MANIFEST=gate-status-media-url-apply",
    "MIGRATION_RECONCILIATION_REPORT=gate-status-recon",
    "MIGRATION_RECONCILIATION_MISMATCH_TRIAGE_REPORT=gate-status-recon-mismatch",
    "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT=gate-status-recon-acceptance",
    "PRODUCTION_CRONTAB_EVIDENCE=gate-status-crontab",
    "CRON_HELPER_DECISION_REPORT=gate-status-cron-helper",
    "CRON_SCHEDULE_COVERAGE_REPORT=gate-status-cron-schedule",
    "HOSTED_DAILY_SCHEDULE_EVIDENCE=gate-status-daily",
    "HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE=gate-status-ten-minute",
    "HOSTED_SCHEDULER_EVIDENCE=gate-status-scheduler",
    "CRON_PARTIAL_ROW_COVERAGE_REPORT=gate-status-cron-partials",
    "CRON_SECRET=gate_status_cron_secret",
    "PROVIDER_DELIVERY_ACCEPTANCE_REPORT=gate-status-provider-delivery",
    "PROVIDER_CHANNEL_ROLLOUT_REPORT=gate-status-provider-rollout",
    "PROVIDER_RESPONSE_ID_AUDIT_REPORT=gate-status-provider-response",
    "PROVIDER_CHANNEL_DECISION_REPORT=gate-status-provider-decision",
    "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=gate-status-provider-partials",
    "PUSH_DELIVERY_PROVIDER=disabled",
    "EMAIL_DELIVERY_PROVIDER=disabled",
    "SMS_DELIVERY_PROVIDER=disabled",
    "WHATSAPP_DELIVERY_PROVIDER=disabled",
    "NATIVE_IOS_ACCEPTANCE_REPORT=gate-status-ios",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=gate-status-android",
    "NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=gate-status-native-routes",
    "NATIVE_CRASH_PARSER_AUDIT_REPORT=gate-status-native-crash",
    "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT=gate-status-native-parent",
    "NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT=gate-status-native-notifications",
    "NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT=gate-status-native-push",
    "NATIVE_PARTIAL_ROW_COVERAGE_REPORT=gate-status-native-partials",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=gate-status-nature",
    "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=gate-status-nature-groups",
    "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=gate-status-nature-partials",
    "PRINT_ACCOUNTING_MATRIX_ACCEPTANCE_REPORT=gate-status-print-matrix",
    "PRINT_INVOICE_RECEIPT_ACCEPTANCE_REPORT=gate-status-print-invoice",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=gate-status-print-stationery",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=gate-status-calls-real",
    "CALL_SUBMITTED_DRAFT_ACCEPTANCE_REPORT=gate-status-calls-draft",
    "CALL_PHP_BRIDGE_ACCEPTANCE_REPORT=gate-status-calls-bridge",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=gate-status-nursery",
    "NURSERY_BRANCH_BRIDGE_ACCEPTANCE_REPORT=gate-status-nursery-branch",
    "NURSERY_DOCUMENT_UPLOAD_ACCEPTANCE_REPORT=gate-status-nursery-docs",
    "LEGACY_ACL_ACCEPTANCE_REPORT=gate-status-acl",
    "LEGACY_PAGE_GUARD_ACCEPTANCE_REPORT=gate-status-page-guard",
    "LEGACY_ACTION_GUARD_ACCEPTANCE_REPORT=gate-status-action-guard",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=gate-status-backfill",
    "LEGACY_BACKFILL_RERUN_REPORT=gate-status-backfill-rerun",
    "LEGACY_BACKFILL_TICKET_TRIAGE_REPORT=gate-status-backfill-triage",
    "",
  ].join("\n");
}
