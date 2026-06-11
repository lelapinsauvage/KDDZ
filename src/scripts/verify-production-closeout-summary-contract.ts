import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type DigestRecord = {
  algorithm?: string;
  digest?: string;
};

type CloseoutSummary = {
  status?: string;
  readinessReport?: string;
  evidenceRecord?: string;
  partialReport?: string | null;
  evidenceChecklist?: string | null;
  partialReportSummary?: PartialReportSummary | null;
  evidenceChecklistSummary?: EvidenceChecklistSummary | null;
  artifactDigests?: {
    readinessReport?: DigestRecord;
    partialReport?: DigestRecord;
    evidenceChecklist?: DigestRecord;
  };
  artifactConsistency?: {
    status?: string;
    script?: string;
  } | null;
  readinessSummary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
  parityTracker?: {
    total?: number;
    complete?: number;
    partial?: number;
    donePct?: number;
    leftPct?: number;
  };
  branch?: string;
  commit?: string;
  redacted?: boolean;
};

type PartialReportSummary = {
  partialRows?: number | null;
  gates?: string[];
  gateCounts?: Record<string, number>;
};

type EvidenceChecklistSummary = {
  gates?: number | null;
  requiredFields?: number | null;
  blockingPartialRows?: number | null;
};

type PartialReport = {
  summary?: PartialReportSummary;
};

type EvidenceChecklist = {
  summary?: EvidenceChecklistSummary;
};

const summaryPath = positionalArg();

if (summaryPath) {
  verifyCloseoutSummary(summaryPath);
} else {
  verifySelfTestContract();
}

console.log("production closeout summary contract assertions passed");

function verifyCloseoutSummary(path: string) {
  const summaryText = readFileSync(path, "utf8");
  assertNoSensitiveOutput(summaryText);

  const summary = JSON.parse(summaryText) as CloseoutSummary;
  assert.equal(summary.status, "production closeout verified");
  assert.equal(summary.redacted, true);
  assert.deepEqual(summary.readinessSummary, { ready: 12, needsEvidence: 0, total: 12 });
  assert.deepEqual(summary.parityTracker, { total: 1713, complete: 1696, partial: 17, donePct: 99, leftPct: 1 });

  const readinessReportPath = optionValue("--readiness-report") ?? summary.readinessReport;
  const partialReportPath = optionValue("--partial-report") ?? summary.partialReport ?? null;
  const checklistReportPath = optionValue("--checklist-report") ?? summary.evidenceChecklist ?? null;

  assert.ok(readinessReportPath, "closeout summary is missing readiness report path");
  assert.equal(summary.readinessReport, readinessReportPath);
  assertDigest(summary.artifactDigests?.readinessReport, readinessReportPath, "readiness report");

  if (partialReportPath) {
    assert.equal(summary.partialReport, partialReportPath);
    assertDigest(summary.artifactDigests?.partialReport, partialReportPath, "partial report");
    const partialReport = readArtifact<PartialReport>(partialReportPath);
    assert.deepEqual(summary.partialReportSummary, normalizePartialSummary(partialReport.summary));
  }

  if (checklistReportPath) {
    assert.equal(summary.evidenceChecklist, checklistReportPath);
    assertDigest(summary.artifactDigests?.evidenceChecklist, checklistReportPath, "evidence checklist");
    const checklist = readArtifact<EvidenceChecklist>(checklistReportPath);
    assert.deepEqual(summary.evidenceChecklistSummary, normalizeChecklistSummary(checklist.summary));
  }

  if (partialReportPath && checklistReportPath) {
    assert.deepEqual(summary.artifactConsistency, {
      status: "verified",
      script: "src/scripts/verify-production-artifact-consistency-contract.ts",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
  }
}

function verifySelfTestContract() {
  const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-closeout-summary-"));
  try {
    const envFilePath = join(tmp, "private-readiness.env");
    const evidenceRecordPath = join(tmp, "production-acceptance-evidence.md");
    const readinessReportPath = join(tmp, "readiness.json");
    const closeoutSummaryPath = join(tmp, "closeout-summary.json");
    const partialReportPath = join(tmp, "partials.json");
    const checklistReportPath = join(tmp, "evidence-checklist.json");

    writeFileSync(envFilePath, readinessEnvFile(), "utf8");
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialReportPath}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistReportPath}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    writeFileSync(
      evidenceRecordPath,
      fillTemplate(readFileSync("docs/production-acceptance-evidence-template.md", "utf8"), {
        readinessReportPath,
        closeoutSummaryPath,
        partialReportPath,
        checklistReportPath,
        readinessReportDigest: "verified in closeout summary artifact digests",
        partialReportDigest: sha256File(partialReportPath),
        checklistReportDigest: sha256File(checklistReportPath),
      }),
      "utf8"
    );

    execFileSync("pnpm", [
      "tsx",
      "src/scripts/run-production-closeout.ts",
      `--env-file=${envFilePath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--out=${readinessReportPath}`,
      `--summary-out=${closeoutSummaryPath}`,
      `--partials-out=${partialReportPath}`,
      `--checklist-out=${checklistReportPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    assertSuccessfulVerifier([
      closeoutSummaryPath,
      `--readiness-report=${readinessReportPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
    ]);

    const staleDigestPath = join(tmp, "stale-digest-summary.json");
    const staleDigestSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    if (staleDigestSummary.artifactDigests?.partialReport) {
      staleDigestSummary.artifactDigests.partialReport.digest = "0".repeat(64);
    }
    writeJson(staleDigestPath, staleDigestSummary);
    assertFailingVerifier(
      [staleDigestPath, `--partial-report=${partialReportPath}`],
      /partial report digest mismatch/
    );

    const staleCountPath = join(tmp, "stale-count-summary.json");
    const staleCountSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    if (staleCountSummary.evidenceChecklistSummary) {
      staleCountSummary.evidenceChecklistSummary.blockingPartialRows = 16;
    }
    writeJson(staleCountPath, staleCountSummary);
    assertFailingVerifier(
      [staleCountPath, `--checklist-report=${checklistReportPath}`],
      /Expected values to be strictly deep-equal/
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function assertDigest(record: DigestRecord | undefined, path: string, label: string) {
  assert.equal(record?.algorithm, "sha256", `${label} digest algorithm must be sha256`);
  assert.equal(record?.digest, sha256File(path), `${label} digest mismatch`);
}

function readArtifact<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function normalizePartialSummary(summary: PartialReportSummary | undefined): PartialReportSummary {
  return {
    partialRows: summary?.partialRows ?? null,
    gates: summary?.gates ?? [],
    gateCounts: summary?.gateCounts ?? {},
  };
}

function normalizeChecklistSummary(summary: EvidenceChecklistSummary | undefined): EvidenceChecklistSummary {
  return {
    gates: summary?.gates ?? null,
    requiredFields: summary?.requiredFields ?? null,
    blockingPartialRows: summary?.blockingPartialRows ?? null,
  };
}

function assertSuccessfulVerifier(args: string[]) {
  const result = runVerifier(args);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assertNoSensitiveOutput(result.stdout + result.stderr);
}

function assertFailingVerifier(args: string[], pattern: RegExp) {
  const result = runVerifier(args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, pattern);
  assertNoSensitiveOutput(result.stdout + result.stderr);
}

function runVerifier(args: string[]): CommandResult {
  const result = spawnSync("pnpm", ["tsx", "src/scripts/verify-production-closeout-summary-contract.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readinessEnvFile() {
  return [
    "PUSH_DELIVERY_PROVIDER=webhook",
    "PUSH_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-push-secret",
    "EMAIL_DELIVERY_PROVIDER=resend",
    "RESEND_API_KEY=re_summary_secret_should_not_print",
    "EMAIL_FROM=noreply@example.invalid",
    "SMS_DELIVERY_PROVIDER=webhook",
    "SMS_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-sms-secret",
    "WHATSAPP_DELIVERY_PROVIDER=webhook",
    "WHATSAPP_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-whatsapp-secret",
    "CRON_SECRET=summary_cron_secret_should_not_print",
    "LEGACY_PRODUCTION_DUMP_MANIFEST=summary-secret-dump-id",
    "LEGACY_MEDIA_EXPORT_MANIFEST=summary-secret-media-export-id",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=summary-secret-media-upload-id",
    "MIGRATION_RECONCILIATION_REPORT=summary-secret-reconciliation-id",
    "PRODUCTION_CRONTAB_EVIDENCE=summary-secret-crontab-id",
    "HOSTED_SCHEDULER_EVIDENCE=summary-secret-scheduler-id",
    "NATIVE_IOS_ACCEPTANCE_REPORT=summary-secret-ios-id",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=summary-secret-android-id",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=summary-secret-nature-id",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=summary-secret-print-id",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=summary-secret-calls-id",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=summary-secret-nursery-id",
    "LEGACY_ACL_ACCEPTANCE_REPORT=summary-secret-acl-id",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=summary-secret-backfill-id",
    "",
  ].join("\n");
}

type ArtifactPaths = {
  readinessReportPath: string;
  closeoutSummaryPath: string;
  partialReportPath: string;
  checklistReportPath: string;
  readinessReportDigest: string;
  partialReportDigest: string;
  checklistReportDigest: string;
};

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
      if (field === "Field" || field === "Evidence" || /^-+$/.test(field) || /^-+$/.test(value)) {
        return line;
      }

      return `| ${field} | ${filledValueFor(field, artifactPaths)} |`;
    })
    .join("\n");
}

function filledValueFor(field: string, artifactPaths: ArtifactPaths) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
  if (field === "Redacted readiness report") return artifactPaths.readinessReportPath;
  if (field === "Redacted readiness report SHA-256") return artifactPaths.readinessReportDigest;
  if (field === "Redacted closeout summary") return artifactPaths.closeoutSummaryPath;
  if (field === "Partial gate report") return artifactPaths.partialReportPath;
  if (field === "Partial gate report SHA-256") return artifactPaths.partialReportDigest;
  if (field === "Production evidence checklist") return artifactPaths.checklistReportPath;
  if (field === "Production evidence checklist SHA-256") return artifactPaths.checklistReportDigest;
  if (field === "Release decision") return "accepted";
  if (field === "Remaining production tickets") return "none";
  if (field === "Approval link/id") return "release-ticket-verified";
  return "accepted evidence recorded in release-ticket-verified";
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  for (const fragment of [
    "https://example.invalid",
    "secret_should_not_print",
    "summary-secret-dump-id",
    "summary-secret-media-export-id",
    "summary-secret-media-upload-id",
    "summary-secret-reconciliation-id",
    "summary-secret-crontab-id",
    "summary-secret-scheduler-id",
    "summary-secret-ios-id",
    "summary-secret-android-id",
    "summary-secret-nature-id",
    "summary-secret-print-id",
    "summary-secret-calls-id",
    "summary-secret-nursery-id",
    "summary-secret-acl-id",
    "summary-secret-backfill-id",
  ]) {
    assert.doesNotMatch(outputWithoutDigests, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in closeout summary output`);
  }
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}

function positionalArg() {
  return process.argv.find((arg, index) => index > 1 && !arg.startsWith("--")) ?? null;
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
