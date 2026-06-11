import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

try {
  const envFilePath = join(tmp, "private-readiness.env");
  const evidenceRecordPath = join(tmp, "production-acceptance-evidence.md");
  const readinessReportPath = join(tmp, "readiness.json");
  const closeoutSummaryPath = join(tmp, "closeout-summary.json");
  const partialReportPath = join(tmp, "partials.json");
  const checklistReportPath = join(tmp, "evidence-checklist.json");
  writeFileSync(envFilePath, readinessEnvFile(), "utf8");
  writeFileSync(evidenceRecordPath, fillTemplate(template), "utf8");

  const closeout = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${readinessReportPath}`,
    `--summary-out=${closeoutSummaryPath}`,
    `--partials-out=${partialReportPath}`,
    `--checklist-out=${checklistReportPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
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
  const closeoutPayload = JSON.parse(closeoutSummary) as {
    status?: string;
    partialReport?: string | null;
    evidenceChecklist?: string | null;
    readinessSummary?: { ready?: number; needsEvidence?: number; total?: number };
    parityTracker?: { total?: number; complete?: number; partial?: number; donePct?: number; leftPct?: number };
    branch?: string;
    commit?: string;
    redacted?: boolean;
  };
  assert.deepEqual(closeoutPayload, {
    status: "production closeout verified",
    readinessReport: readinessReportPath,
    evidenceRecord: evidenceRecordPath,
    partialReport: partialReportPath,
    evidenceChecklist: checklistReportPath,
    readinessSummary: { ready: 12, needsEvidence: 0, total: 12 },
    parityTracker: { total: 1713, complete: 1696, partial: 17, donePct: 99, leftPct: 1 },
    requireZeroPartials: false,
    branch: "legacy-parity-runbook",
    commit: "0404c6a",
    redacted: true,
  });

  const partialReport = readFileSync(partialReportPath, "utf8");
  assertNoSensitiveOutput(partialReport);
  const partialPayload = JSON.parse(partialReport) as {
    summary?: { partialRows?: number; gateCounts?: Record<string, number> };
  };
  assert.equal(partialPayload.summary?.partialRows, 17);
  assert.deepEqual(partialPayload.summary?.gateCounts, {
    "PROD-CRON": 9,
    "PROD-NATIVE": 3,
    "PROD-NATURE": 1,
    "PROD-PROVIDERS": 14,
  });

  const checklistReport = readFileSync(checklistReportPath, "utf8");
  assertNoSensitiveOutput(checklistReport);
  const checklistPayload = JSON.parse(checklistReport) as {
    summary?: { gates?: number; requiredFields?: number; blockingPartialRows?: number };
  };
  assert.deepEqual(checklistPayload.summary, {
    gates: 12,
    requiredFields: 69,
    blockingPartialRows: 17,
  });

  const staleCommit = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${join(tmp, "stale-readiness.json")}`,
    "--branch=legacy-parity-runbook",
    "--commit=deadbeef",
  ]);
  assert.equal(staleCommit.status, 1);
  assert.match(staleCommit.stderr, /Modern branch\/commit must include commit deadbeef/);
  assertNoSensitiveOutput(staleCommit.stdout + staleCommit.stderr);

  const unresolvedPartials = runCloseout([
    `--env-file=${envFilePath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--out=${join(tmp, "unresolved-partials-readiness.json")}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--require-zero-partials",
  ]);
  assert.equal(unresolvedPartials.status, 1);
  assert.match(unresolvedPartials.stderr, /requires zero partial parity rows; found 17/);
  assertNoSensitiveOutput(unresolvedPartials.stdout + unresolvedPartials.stderr);
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
    "CRON_SECRET=closeout_cron_secret_should_not_print",
    "LEGACY_PRODUCTION_DUMP_MANIFEST=closeout-secret-dump-id",
    "LEGACY_MEDIA_EXPORT_MANIFEST=closeout-secret-media-export-id",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=closeout-secret-media-upload-id",
    "MIGRATION_RECONCILIATION_REPORT=closeout-secret-reconciliation-id",
    "PRODUCTION_CRONTAB_EVIDENCE=closeout-secret-crontab-id",
    "HOSTED_SCHEDULER_EVIDENCE=closeout-secret-scheduler-id",
    "NATIVE_IOS_ACCEPTANCE_REPORT=closeout-secret-ios-id",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=closeout-secret-android-id",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=closeout-secret-nature-id",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=closeout-secret-print-id",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=closeout-secret-calls-id",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=closeout-secret-nursery-id",
    "LEGACY_ACL_ACCEPTANCE_REPORT=closeout-secret-acl-id",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=closeout-secret-backfill-id",
    "",
  ].join("\n");
}

function fillTemplate(markdown: string) {
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

      return `| ${field} | ${filledValueFor(field)} |`;
    })
    .join("\n");
}

function filledValueFor(field: string) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
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

function assertNoSensitiveOutput(output: string) {
  for (const fragment of [
    "https://example.invalid",
    "secret_should_not_print",
    "closeout-secret-dump-id",
    "closeout-secret-media-export-id",
    "closeout-secret-media-upload-id",
    "closeout-secret-reconciliation-id",
    "closeout-secret-crontab-id",
    "closeout-secret-scheduler-id",
    "closeout-secret-ios-id",
    "closeout-secret-android-id",
    "closeout-secret-nature-id",
    "closeout-secret-print-id",
    "closeout-secret-calls-id",
    "closeout-secret-nursery-id",
    "closeout-secret-acl-id",
    "closeout-secret-backfill-id",
  ]) {
    assert.doesNotMatch(output, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in closeout output`);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
