import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const script = "src/scripts/run-production-closeout.ts";
const template = readFileSync("docs/production-acceptance-evidence-template.md", "utf8");
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-closeout-"));
const generatedAt = "2026-06-10T00:00:00.000Z";

try {
  const envFilePath = join(tmp, "private-readiness.env");
  const evidenceRecordPath = join(tmp, "production-acceptance-evidence.md");
  const readinessReportPath = join(tmp, "readiness.json");
  const closeoutSummaryPath = join(tmp, "closeout-summary.json");
  const partialReportPath = join(tmp, "partials.json");
  const checklistReportPath = join(tmp, "evidence-checklist.json");
  const preflightManifestPath = join(tmp, "preflight-artifacts.json");
  const zeroParityMatrixPath = join(tmp, "zero-page-parity-matrix.json");
  const zeroPartialGateMapPath = join(tmp, "zero-partial-production-gate-map.md");
  const zeroProductionGatesPath = join(tmp, "zero-legacy-production-acceptance-gates.md");
  const zeroEvidenceRecordPath = join(tmp, "zero-production-acceptance-evidence.md");
  const zeroReadinessReportPath = join(tmp, "zero-readiness.json");
  const zeroCloseoutSummaryPath = join(tmp, "zero-closeout-summary.json");
  const zeroPartialReportPath = join(tmp, "zero-partials.json");
  const zeroChecklistReportPath = join(tmp, "zero-evidence-checklist.json");
  const zeroPreflightManifestPath = join(tmp, "zero-preflight-artifacts.json");
  writeFileSync(envFilePath, readinessEnvFile(), "utf8");
  execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialReportPath}`, `--generated-at=${generatedAt}`], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistReportPath}`, `--generated-at=${generatedAt}`], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  writeFileSync(preflightManifestPath, preflightManifest(partialReportPath, checklistReportPath), "utf8");
  writeFileSync(
    evidenceRecordPath,
    fillTemplate(template, {
      readinessReportPath,
      closeoutSummaryPath,
      partialReportPath,
      checklistReportPath,
      preflightManifestPath,
      readinessReportDigest: "verified in closeout summary artifact digests",
      partialReportDigest: sha256File(partialReportPath),
      checklistReportDigest: sha256File(checklistReportPath),
      preflightManifestDigest: sha256File(preflightManifestPath),
    }),
    "utf8"
  );

  const closeout = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    `--summary-out=${closeoutSummaryPath}`,
    `--partials-out=${partialReportPath}`,
    `--checklist-out=${checklistReportPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    `--generated-at=${generatedAt}`,
  ]);
  assert.equal(closeout.status, 0, closeout.stdout + closeout.stderr);
  assert.match(closeout.stdout, /production closeout verified/);
  assert.match(closeout.stdout, /legacy-parity-runbook/);
  assert.match(closeout.stdout, /0404c6a/);
  assertNoSensitiveOutput(closeout.stdout + closeout.stderr);

  const report = readFileSync(readinessReportPath, "utf8");
  assertNoSensitiveOutput(report);
  const payload = JSON.parse(report) as {
    summary?: { ready?: number; needsEvidence?: number; total?: number };
    redacted?: boolean;
  };
  assert.equal(payload.redacted, true);
  assert.deepEqual(payload.summary, { ready: 12, needsEvidence: 0, total: 12 });

  const closeoutSummary = readFileSync(closeoutSummaryPath, "utf8");
  assertNoSensitiveOutput(closeoutSummary);
  const expectedPartialReportSummary = partialReportSummary(partialReportPath);
  const expectedEvidenceChecklistSummary = evidenceChecklistSummary(checklistReportPath);
  const expectedParityTracker = parityTrackerSummary("docs/page-parity-matrix.json");
  const closeoutPayload = JSON.parse(closeoutSummary) as {
    status?: string;
    schemaVersion?: number;
    generatedAt?: string;
    generatedFrom?: {
      matrix?: string;
      gateMap?: string;
      productionGates?: string;
    };
    partialReport?: string | null;
    evidenceChecklist?: string | null;
    preflightManifest?: string | null;
    partialReportSummary?: { partialRows?: number; gates?: string[]; gateCounts?: Record<string, number> } | null;
    evidenceChecklistSummary?: { gates?: number; requiredFields?: number; blockingPartialRows?: number } | null;
    artifactDigests?: Record<string, { algorithm?: string; digest?: string }>;
    artifactConsistency?: { status?: string; script?: string } | null;
    readinessSummary?: { ready?: number; needsEvidence?: number; total?: number };
    parityTracker?: { total?: number; complete?: number; partial?: number; donePct?: number; leftPct?: number };
    branch?: string;
    commit?: string;
    redacted?: boolean;
  };
  assert.deepEqual(closeoutPayload, {
    status: "production closeout verified",
    schemaVersion: 1,
    generatedAt,
    generatedFrom: {
      matrix: "docs/page-parity-matrix.json",
      gateMap: "docs/partial-production-gate-map.md",
      productionGates: "docs/legacy-production-acceptance-gates.md",
    },
    readinessReport: readinessReportPath,
    evidenceRecord: evidenceRecordPath,
    partialReport: partialReportPath,
    evidenceChecklist: checklistReportPath,
    preflightManifest: preflightManifestPath,
    partialReportSummary: expectedPartialReportSummary,
    evidenceChecklistSummary: expectedEvidenceChecklistSummary,
    artifactDigests: {
      readinessReport: {
        algorithm: "sha256",
        digest: sha256File(readinessReportPath),
      },
      evidenceRecord: {
        algorithm: "sha256",
        digest: sha256File(evidenceRecordPath),
      },
      partialReport: {
        algorithm: "sha256",
        digest: sha256File(partialReportPath),
      },
      evidenceChecklist: {
        algorithm: "sha256",
        digest: sha256File(checklistReportPath),
      },
      preflightManifest: {
        algorithm: "sha256",
        digest: sha256File(preflightManifestPath),
      },
    },
    artifactConsistency: {
      status: "verified",
      script: "src/scripts/verify-production-artifact-consistency-contract.ts",
    },
    readinessSummary: { ready: 12, needsEvidence: 0, total: 12 },
    parityTracker: expectedParityTracker,
    requireZeroPartials: false,
    branch: "legacy-parity-runbook",
    commit: "0404c6a",
    redacted: true,
  });

  const partialReport = readFileSync(partialReportPath, "utf8");
  assertNoSensitiveOutput(partialReport);
  const partialPayload = JSON.parse(partialReport) as {
    generatedFrom?: { matrix?: string; gateMap?: string; productionGates?: string };
    summary?: { partialRows?: number; gateCounts?: Record<string, number> };
  };
  assert.deepEqual(partialPayload.generatedFrom, {
    matrix: "docs/page-parity-matrix.json",
    gateMap: "docs/partial-production-gate-map.md",
    productionGates: "docs/legacy-production-acceptance-gates.md",
  });
  assert.deepEqual(partialPayload.summary, expectedPartialReportSummary);

  const checklistReport = readFileSync(checklistReportPath, "utf8");
  assertNoSensitiveOutput(checklistReport);
  const checklistPayload = JSON.parse(checklistReport) as {
    generatedFrom?: { partialGateMap?: string; productionGates?: string };
    summary?: { gates?: number; requiredFields?: number; blockingPartialRows?: number };
  };
  assert.deepEqual(checklistPayload.generatedFrom, {
    evidenceSpec: "src/scripts/production-acceptance-evidence-spec.ts",
    evidenceTemplate: "docs/production-acceptance-evidence-template.md",
    partialGateMap: "docs/partial-production-gate-map.md",
    productionGates: "docs/legacy-production-acceptance-gates.md",
  });
  assert.deepEqual(checklistPayload.summary, expectedEvidenceChecklistSummary);

  const staleCommit = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=deadbeef",
  ]);
  assert.equal(staleCommit.status, 1);
  assert.match(staleCommit.stderr, /Modern branch\/commit must include commit deadbeef/);
  assertNoSensitiveOutput(staleCommit.stdout + staleCommit.stderr);

  const unresolvedPartials = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    `--summary-out=${closeoutSummaryPath}`,
    `--partials-out=${partialReportPath}`,
    `--checklist-out=${checklistReportPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    `--generated-at=${generatedAt}`,
    "--require-zero-partials",
  ]);
  assert.equal(unresolvedPartials.status, 1);
  assert.match(
    unresolvedPartials.stderr,
    new RegExp(`requires zero partial parity rows; found ${expectedParityTracker.partial}`)
  );
  assert.match(unresolvedPartials.stdout, /production artifact consistency contract assertions passed/);
  assert.doesNotMatch(unresolvedPartials.stderr, /remaining production tickets/i);
  assert.doesNotMatch(unresolvedPartials.stderr, /Production acceptance evidence failed/i);
  assertNoSensitiveOutput(unresolvedPartials.stdout + unresolvedPartials.stderr);

  writeFileSync(zeroParityMatrixPath, zeroPartialMatrixJson(), "utf8");
  writeFileSync(zeroPartialGateMapPath, zeroPartialGateMapMarkdown(), "utf8");
  copyFileSync("docs/legacy-production-acceptance-gates.md", zeroProductionGatesPath);
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-partials.ts",
    "--json",
    `--out=${zeroPartialReportPath}`,
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${zeroParityMatrixPath}`,
    `--partial-gate-map=${zeroPartialGateMapPath}`,
    `--production-gates=${zeroProductionGatesPath}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-evidence-checklist.ts",
    "--json",
    `--out=${zeroChecklistReportPath}`,
    `--generated-at=${generatedAt}`,
    `--partial-gate-map=${zeroPartialGateMapPath}`,
    `--production-gates=${zeroProductionGatesPath}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  writeFileSync(zeroPreflightManifestPath, preflightManifest(zeroPartialReportPath, zeroChecklistReportPath), "utf8");
  writeFileSync(
    zeroEvidenceRecordPath,
    fillTemplate(template, {
      readinessReportPath: zeroReadinessReportPath,
      closeoutSummaryPath: zeroCloseoutSummaryPath,
      partialReportPath: zeroPartialReportPath,
      checklistReportPath: zeroChecklistReportPath,
      preflightManifestPath: zeroPreflightManifestPath,
      readinessReportDigest: "verified in closeout summary artifact digests",
      partialReportDigest: sha256File(zeroPartialReportPath),
      checklistReportDigest: sha256File(zeroChecklistReportPath),
      preflightManifestDigest: sha256File(zeroPreflightManifestPath),
    }),
    "utf8"
  );
  const zeroCloseout = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${zeroEvidenceRecordPath}`,
    `--out=${zeroReadinessReportPath}`,
    `--summary-out=${zeroCloseoutSummaryPath}`,
    `--partials-out=${zeroPartialReportPath}`,
    `--checklist-out=${zeroChecklistReportPath}`,
    `--preflight-manifest=${zeroPreflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${zeroParityMatrixPath}`,
    `--partial-gate-map=${zeroPartialGateMapPath}`,
    `--production-gates=${zeroProductionGatesPath}`,
    "--require-zero-partials",
  ]);
  assert.equal(zeroCloseout.status, 0, zeroCloseout.stdout + zeroCloseout.stderr);
  assertNoSensitiveOutput(zeroCloseout.stdout + zeroCloseout.stderr);
  const zeroCloseoutPayload = JSON.parse(readFileSync(zeroCloseoutSummaryPath, "utf8")) as {
    generatedFrom?: {
      matrix?: string;
      gateMap?: string;
      productionGates?: string;
    };
    requireZeroPartials?: boolean;
    partialReportSummary?: { partialRows?: number; gates?: string[]; gateCounts?: Record<string, number> } | null;
    evidenceChecklistSummary?: { blockingPartialRows?: number } | null;
    parityTracker?: { total?: number; complete?: number; partial?: number; donePct?: number; leftPct?: number };
    artifactConsistency?: { status?: string } | null;
  };
  assert.deepEqual(zeroCloseoutPayload.generatedFrom, {
    matrix: zeroParityMatrixPath,
    gateMap: zeroPartialGateMapPath,
    productionGates: zeroProductionGatesPath,
  });
  assert.deepEqual(zeroCloseoutPayload.partialReportSummary, {
    partialRows: 0,
    gates: [],
    gateCounts: {},
  });
  assert.equal(zeroCloseoutPayload.evidenceChecklistSummary?.blockingPartialRows, 0);
  assert.deepEqual(zeroCloseoutPayload.parityTracker, parityTrackerSummary(zeroParityMatrixPath));
  assert.equal(zeroCloseoutPayload.requireZeroPartials, true);
  assert.equal(zeroCloseoutPayload.artifactConsistency?.status, "verified");

  const missingFinalArtifacts = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--require-zero-partials",
  ]);
  assert.equal(missingFinalArtifacts.status, 2);
  assert.match(missingFinalArtifacts.stderr, /must also include --summary-out, --partials-out, and --checklist-out/);
  assertNoSensitiveOutput(missingFinalArtifacts.stdout + missingFinalArtifacts.stderr);

  const missingFinalReleaseRef = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    `--summary-out=${closeoutSummaryPath}`,
    `--partials-out=${partialReportPath}`,
    `--checklist-out=${checklistReportPath}`,
    "--require-zero-partials",
  ]);
  assert.equal(missingFinalReleaseRef.status, 2);
  assert.match(missingFinalReleaseRef.stderr, /must include explicit --branch and --commit release refs/);
  assertNoSensitiveOutput(missingFinalReleaseRef.stdout + missingFinalReleaseRef.stderr);

  const invalidGeneratedAt = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--generated-at=not-a-date",
  ]);
  assert.equal(invalidGeneratedAt.status, 2);
  assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);
  assertNoSensitiveOutput(invalidGeneratedAt.stdout + invalidGeneratedAt.stderr);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production closeout contract assertions passed");

function readinessEnvFile() {
  return [
    "PUSH_DELIVERY_PROVIDER=webhook",
    "PUSH_DELIVERY_WEBHOOK_URL=https://example.invalid/closeout-push-secret",
    "EMAIL_DELIVERY_PROVIDER=resend",
    "RESEND_API_KEY=re_closeout_secret_should_not_print",
    "EMAIL_FROM=noreply@example.invalid",
    "SMS_DELIVERY_PROVIDER=webhook",
    "SMS_DELIVERY_WEBHOOK_URL=https://example.invalid/closeout-sms-secret",
    "WHATSAPP_DELIVERY_PROVIDER=webhook",
    "WHATSAPP_DELIVERY_WEBHOOK_URL=https://example.invalid/closeout-whatsapp-secret",
    "PROVIDER_DELIVERY_ACCEPTANCE_REPORT=closeout-secret-provider-delivery-id",
    "PROVIDER_CHANNEL_ROLLOUT_REPORT=closeout-secret-provider-rollout-id",
    "PROVIDER_RESPONSE_ID_AUDIT_REPORT=closeout-secret-provider-response-id-audit-id",
    "PROVIDER_CHANNEL_DECISION_REPORT=closeout-secret-provider-decision-id",
    "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=closeout-secret-provider-partial-row-coverage-id",
    "CRON_SECRET=closeout_cron_secret_should_not_print",
    "LEGACY_PRODUCTION_DUMP_MANIFEST=closeout-secret-dump-id",
    "LEGACY_SCHOOL_YEAR_DUMP_COVERAGE_REPORT=closeout-secret-school-year-dump-coverage-id",
    "LEGACY_DUMP_CHECKSUM_MANIFEST=closeout-secret-dump-checksum-id",
    "LEGACY_FIRST_MIGRATION_SOURCE_REPORT=closeout-secret-first-migration-source-id",
    "LEGACY_MEDIA_AUDIT_REPORT=closeout-secret-media-audit-id",
    "LEGACY_MEDIA_EXPORT_MANIFEST=closeout-secret-media-export-id",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=closeout-secret-media-upload-id",
    "LEGACY_MEDIA_STORAGE_INTEGRITY_REPORT=closeout-secret-media-storage-integrity-id",
    "LEGACY_MEDIA_MISSING_FILE_TRIAGE_REPORT=closeout-secret-media-missing-file-triage-id",
    "LEGACY_MEDIA_URL_APPLY_MANIFEST=closeout-secret-media-url-apply-id",
    "MIGRATION_RECONCILIATION_REPORT=closeout-secret-reconciliation-id",
    "MIGRATION_RECONCILIATION_MISMATCH_TRIAGE_REPORT=closeout-secret-reconciliation-mismatch-triage-id",
    "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT=closeout-secret-reconciliation-acceptance-id",
    "PRODUCTION_CRONTAB_EVIDENCE=closeout-secret-crontab-id",
    "CRON_HELPER_DECISION_REPORT=closeout-secret-cron-helper-decision-id",
    "CRON_SCHEDULE_COVERAGE_REPORT=closeout-secret-cron-schedule-coverage-id",
    "HOSTED_DAILY_SCHEDULE_EVIDENCE=closeout-secret-hosted-daily-schedule-id",
    "HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE=closeout-secret-hosted-ten-minute-schedule-id",
    "HOSTED_SCHEDULER_EVIDENCE=closeout-secret-scheduler-id",
    "CRON_PARTIAL_ROW_COVERAGE_REPORT=closeout-secret-cron-partial-row-coverage-id",
    "NATIVE_IOS_ACCEPTANCE_REPORT=closeout-secret-ios-id",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=closeout-secret-android-id",
    "NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=closeout-secret-native-route-id",
    "NATIVE_CRASH_PARSER_AUDIT_REPORT=closeout-secret-native-crash-parser-id",
    "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT=closeout-secret-native-parent-flow-id",
    "NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT=closeout-secret-native-notifications-messages-alarms-id",
    "NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT=closeout-secret-native-push-token-id",
    "NATIVE_PARTIAL_ROW_COVERAGE_REPORT=closeout-secret-native-partial-row-coverage-id",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=closeout-secret-nature-id",
    "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=closeout-secret-nature-group-comparison-id",
    "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=closeout-secret-nature-partial-row-coverage-id",
    "PRINT_ACCOUNTING_MATRIX_ACCEPTANCE_REPORT=closeout-secret-print-accounting-matrix-id",
    "PRINT_INVOICE_RECEIPT_ACCEPTANCE_REPORT=closeout-secret-print-invoice-receipt-id",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=closeout-secret-print-id",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=closeout-secret-calls-id",
    "CALL_SUBMITTED_DRAFT_ACCEPTANCE_REPORT=closeout-secret-call-submitted-draft-id",
    "CALL_PHP_BRIDGE_ACCEPTANCE_REPORT=closeout-secret-call-php-bridge-id",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=closeout-secret-nursery-id",
    "NURSERY_BRANCH_BRIDGE_ACCEPTANCE_REPORT=closeout-secret-nursery-branch-bridge-id",
    "NURSERY_DOCUMENT_UPLOAD_ACCEPTANCE_REPORT=closeout-secret-nursery-document-upload-id",
    "LEGACY_ACL_ACCEPTANCE_REPORT=closeout-secret-acl-id",
    "LEGACY_PAGE_GUARD_ACCEPTANCE_REPORT=closeout-secret-legacy-page-guard-id",
    "LEGACY_ACTION_GUARD_ACCEPTANCE_REPORT=closeout-secret-legacy-action-guard-id",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=closeout-secret-backfill-id",
    "LEGACY_BACKFILL_RERUN_REPORT=closeout-secret-backfill-rerun-id",
    "LEGACY_BACKFILL_TICKET_TRIAGE_REPORT=closeout-secret-backfill-ticket-triage-id",
    "",
  ].join("\n");
}

function fillTemplate(markdown: string, artifactPaths: ArtifactPaths) {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith("|")) return line;

      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 2) return line;

      const [field, value] = cells;
      if (
        field === "Field" ||
        field === "Evidence" ||
        /^-+$/.test(field) ||
        /^-+$/.test(value)
      ) {
        return line;
      }

      return `| ${field} | ${filledValueFor(field, artifactPaths)} |`;
    })
    .join("\n");
}

type ArtifactPaths = {
  readinessReportPath: string;
  closeoutSummaryPath: string;
  partialReportPath: string;
  checklistReportPath: string;
  preflightManifestPath: string;
  readinessReportDigest: string;
  partialReportDigest: string;
  checklistReportDigest: string;
  preflightManifestDigest: string;
};

function filledValueFor(field: string, artifactPaths: ArtifactPaths) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
  if (field === "Redacted readiness report") return artifactPaths.readinessReportPath;
  if (field === "Redacted readiness report SHA-256") return artifactPaths.readinessReportDigest;
  if (field === "Redacted closeout summary") return artifactPaths.closeoutSummaryPath;
  if (field === "Redacted closeout summary SHA-256") return "verified in evidence package manifest";
  if (field === "Partial gate report") return artifactPaths.partialReportPath;
  if (field === "Partial gate report SHA-256") return artifactPaths.partialReportDigest;
  if (field === "Production evidence checklist") return artifactPaths.checklistReportPath;
  if (field === "Production evidence checklist SHA-256") return artifactPaths.checklistReportDigest;
  if (field === "Production preflight manifest") return artifactPaths.preflightManifestPath;
  if (field === "Production preflight manifest SHA-256") return artifactPaths.preflightManifestDigest;
  if (field === "Release decision") return "accepted";
  if (field === "Remaining production tickets") return "none";
  if (field === "Approval link/id") return "release-ticket-verified";
  return "accepted evidence recorded in release-ticket-verified";
}

function runCloseout(args: string[]): CommandResult {
  try {
    const stdout = execFileSync("pnpm", ["tsx", script, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const result = error as {
      status?: number;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };
    return {
      status: result.status ?? 1,
      stdout: String(result.stdout ?? ""),
      stderr: String(result.stderr ?? ""),
    };
  }
}

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
      row.status = "complete - production evidence accepted for zero-partial closeout contract";
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

function preflightManifest(partialReportPath: string, checklistReportPath: string) {
  const blockingGateSummary = buildBlockingGateSummary(partialReportPath);
  return `${JSON.stringify(
    {
      status: "production preflight artifacts verified",
      schemaVersion: 1,
      generatedAt,
      generatedFrom: {
        matrix: "docs/page-parity-matrix.json",
        gateMap: "docs/partial-production-gate-map.md",
      },
      artifacts: {
        partialReport: {
          path: partialReportPath,
          sha256: sha256File(partialReportPath),
        },
        evidenceChecklist: {
          path: checklistReportPath,
          sha256: sha256File(checklistReportPath),
        },
      },
      blockingGateSummary,
      redacted: true,
    },
    null,
    2
  )}\n`;
}

function buildBlockingGateSummary(partialReportPath: string) {
  const partialReport = JSON.parse(readFileSync(partialReportPath, "utf8")) as {
    generatedFrom?: { matrix?: string; gateMap?: string; productionGates?: string };
  };
  const status = JSON.parse(
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-gate-status.ts",
      "--json",
      "--blocking-only",
      `--generated-at=${generatedAt}`,
      ...optionalArg("--parity-matrix", partialReport.generatedFrom?.matrix),
      ...optionalArg("--partial-gate-map", partialReport.generatedFrom?.gateMap),
      ...optionalArg("--production-gates", partialReport.generatedFrom?.productionGates),
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
  ) as {
    summary?: {
      gates?: number;
      ready?: number;
      needsEvidence?: number;
      blockingPartialRows?: number;
      missingEvidenceItems?: number;
    };
    gates?: Array<{ gate?: string }>;
  };

  return {
    gates: status.summary?.gates ?? 0,
    ready: status.summary?.ready ?? 0,
    needsEvidence: status.summary?.needsEvidence ?? 0,
    blockingPartialRows: status.summary?.blockingPartialRows ?? 0,
    missingEvidenceItems: status.summary?.missingEvidenceItems ?? 0,
    gatesToClose: (status.gates ?? []).map((gate) => gate.gate).filter((gate): gate is string => Boolean(gate)),
  };
}

function partialReportSummary(path: string) {
  const report = JSON.parse(readFileSync(path, "utf8")) as {
    summary?: { partialRows?: number | null; gates?: string[]; gateCounts?: Record<string, number> };
  };
  return {
    partialRows: report.summary?.partialRows ?? null,
    gates: report.summary?.gates ?? [],
    gateCounts: report.summary?.gateCounts ?? {},
  };
}

function evidenceChecklistSummary(path: string) {
  const report = JSON.parse(readFileSync(path, "utf8")) as {
    summary?: { gates?: number | null; requiredFields?: number | null; blockingPartialRows?: number | null };
  };
  return {
    gates: report.summary?.gates ?? null,
    requiredFields: report.summary?.requiredFields ?? null,
    blockingPartialRows: report.summary?.blockingPartialRows ?? null,
  };
}

function parityTrackerSummary(path: string) {
  const matrix = JSON.parse(readFileSync(path, "utf8")) as unknown;
  let total = 0;
  let partial = 0;

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as { status?: unknown };
    if (typeof row.status === "string") {
      total += 1;
      if (row.status.toLowerCase().startsWith("partial")) {
        partial += 1;
      }
    }
    Object.values(row).forEach(walk);
  }

  walk(matrix);
  const complete = total - partial;
  const donePct = Math.round((complete / total) * 1000) / 10;
  const leftPct = Math.round((100 - donePct) * 10) / 10;
  return { total, complete, partial, donePct, leftPct };
}

function assertNoSensitiveOutput(output: string) {
  for (const fragment of [
    "https://example.invalid",
    "secret_should_not_print",
    "closeout-secret-dump-id",
    "closeout-secret-school-year-dump-coverage-id",
    "closeout-secret-dump-checksum-id",
    "closeout-secret-first-migration-source-id",
    "closeout-secret-media-audit-id",
    "closeout-secret-media-export-id",
    "closeout-secret-media-upload-id",
    "closeout-secret-media-storage-integrity-id",
    "closeout-secret-media-missing-file-triage-id",
    "closeout-secret-media-url-apply-id",
    "closeout-secret-provider-delivery-id",
    "closeout-secret-provider-rollout-id",
    "closeout-secret-provider-response-id-audit-id",
    "closeout-secret-provider-decision-id",
    "closeout-secret-provider-partial-row-coverage-id",
    "closeout-secret-reconciliation-id",
    "closeout-secret-reconciliation-mismatch-triage-id",
    "closeout-secret-reconciliation-acceptance-id",
    "closeout-secret-crontab-id",
    "closeout-secret-cron-helper-decision-id",
    "closeout-secret-cron-schedule-coverage-id",
    "closeout-secret-hosted-daily-schedule-id",
    "closeout-secret-hosted-ten-minute-schedule-id",
    "closeout-secret-scheduler-id",
    "closeout-secret-cron-partial-row-coverage-id",
    "closeout-secret-ios-id",
    "closeout-secret-android-id",
    "closeout-secret-native-route-id",
    "closeout-secret-native-crash-parser-id",
    "closeout-secret-native-parent-flow-id",
    "closeout-secret-native-notifications-messages-alarms-id",
    "closeout-secret-native-push-token-id",
    "closeout-secret-native-partial-row-coverage-id",
    "closeout-secret-nature-id",
    "closeout-secret-nature-group-comparison-id",
    "closeout-secret-nature-partial-row-coverage-id",
    "closeout-secret-print-accounting-matrix-id",
    "closeout-secret-print-invoice-receipt-id",
    "closeout-secret-print-id",
    "closeout-secret-calls-id",
    "closeout-secret-call-submitted-draft-id",
    "closeout-secret-call-php-bridge-id",
    "closeout-secret-nursery-id",
    "closeout-secret-nursery-branch-bridge-id",
    "closeout-secret-nursery-document-upload-id",
    "closeout-secret-acl-id",
    "closeout-secret-legacy-page-guard-id",
    "closeout-secret-legacy-action-guard-id",
    "closeout-secret-backfill-id",
    "closeout-secret-backfill-rerun-id",
    "closeout-secret-backfill-ticket-triage-id",
  ]) {
    assert.doesNotMatch(output, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in closeout output`);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function optionalArg(name: string, value: string | null | undefined) {
  return value ? [`${name}=${value}`] : [];
}
