import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production gate status contract assertions passed");
