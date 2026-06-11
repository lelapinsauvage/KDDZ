import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type GateStatus = "ready-to-review" | "needs-evidence";

type ReadinessReport = {
  schemaVersion?: number;
  generatedAt?: string;
  redacted?: boolean;
  summary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
  gates?: Array<{
    gate?: string;
    status?: GateStatus;
    present?: string[];
    missing?: string[];
  }>;
};

type PartialReport = {
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
  };
  rows?: Array<{
    row?: string;
    statusAnchor?: string;
    gates?: string[];
    closureReason?: string;
  }>;
};

type EvidenceChecklist = {
  summary?: {
    gates?: number;
    requiredFields?: number;
    blockingPartialRows?: number;
  };
  gates?: Array<{
    gate?: string;
    requiredFields?: string[];
    blockingPartialRows?: Array<{
      row?: string;
      statusAnchor?: string;
      closureReason?: string;
    }>;
  }>;
};

type GateClosureStatus = {
  gate: string;
  status: GateStatus;
  missingEvidence: string[];
  presentEvidence: string[];
  requiredEvidenceFields: string[];
  blockingPartialRows: Array<{
    row: string;
    statusAnchor: string;
    closureReason: string;
  }>;
};

const json = process.argv.includes("--json");
const outputPath = optionValue("--out");
const envFilePath = optionValue("--env-file");
const generatedAt = generatedAtValue();
const selectedGate = optionValue("--gate");
const requireReady = process.argv.includes("--require-ready");
const blockingOnly = process.argv.includes("--blocking-only");
const parityMatrixPath = optionValue("--parity-matrix");
const partialGateMapPath = optionValue("--partial-gate-map");

const readiness = runJson<ReadinessReport>("src/scripts/audit-production-readiness.ts", [
  "--json",
  `--generated-at=${generatedAt}`,
  ...optionalArg("--env-file", envFilePath),
  ...optionalArg("--gate", selectedGate),
]);
const partials = runJson<PartialReport>("src/scripts/report-production-partials.ts", [
  "--json",
  `--generated-at=${generatedAt}`,
  ...optionalArg("--gate", selectedGate),
  ...optionalArg("--parity-matrix", parityMatrixPath),
  ...optionalArg("--partial-gate-map", partialGateMapPath),
]);
const checklist = runJson<EvidenceChecklist>("src/scripts/report-production-evidence-checklist.ts", [
  "--json",
  `--generated-at=${generatedAt}`,
  ...optionalArg("--gate", selectedGate),
  ...optionalArg("--partial-gate-map", partialGateMapPath),
]);

assert.equal(readiness.redacted, true);
assert.equal(partials.summary?.partialRows, uniqueRows(partials.rows ?? []).size);
assert.equal(checklist.summary?.blockingPartialRows, uniqueChecklistRows(checklist).size);

const readinessByGate = new Map((readiness.gates ?? []).map((gate) => [gate.gate, gate]));
const checklistByGate = new Map((checklist.gates ?? []).map((gate) => [gate.gate, gate]));
const allGates = [...new Set([
  ...(readiness.gates ?? []).map((gate) => gate.gate).filter(isString),
  ...(checklist.gates ?? []).map((gate) => gate.gate).filter(isString),
])].sort();

const gates: GateClosureStatus[] = allGates.map((gate) => {
  const readinessGate = readinessByGate.get(gate);
  const checklistGate = checklistByGate.get(gate);
  return {
    gate,
    status: readinessGate?.status ?? "needs-evidence",
    missingEvidence: readinessGate?.missing ?? [],
    presentEvidence: readinessGate?.present ?? [],
    requiredEvidenceFields: checklistGate?.requiredFields ?? [],
    blockingPartialRows: (checklistGate?.blockingPartialRows ?? []).map((row) => ({
      row: row.row ?? "unknown",
      statusAnchor: row.statusAnchor ?? "unknown",
      closureReason: row.closureReason ?? "unknown",
    })),
  };
}).filter((gate) => !blockingOnly || gate.blockingPartialRows.length > 0);

const blockingRows = uniqueRows(gates.flatMap((gate) => gate.blockingPartialRows));

const payload = {
  status: "production gate status report",
  schemaVersion: 1,
  generatedAt,
  redacted: true,
  generatedFrom: {
    readinessAudit: "src/scripts/audit-production-readiness.ts",
    partialReport: "src/scripts/report-production-partials.ts",
    evidenceChecklist: "src/scripts/report-production-evidence-checklist.ts",
  },
  summary: {
    gates: gates.length,
    ready: gates.filter((gate) => gate.status === "ready-to-review").length,
    needsEvidence: gates.filter((gate) => gate.status === "needs-evidence").length,
    blockingPartialRows: blockingRows.size,
    missingEvidenceItems: gates.reduce((count, gate) => count + gate.missingEvidence.length, 0),
  },
  partialReportSummary: partials.summary,
  evidenceChecklistSummary: checklist.summary,
  gates,
};

assertNoSensitiveOutput(JSON.stringify(payload));

const rendered = json ? `${JSON.stringify(payload, null, 2)}\n` : renderMarkdown(payload);
if (outputPath) {
  ensureParentDir(outputPath);
  writeFileSync(outputPath, rendered, "utf8");
}
process.stdout.write(rendered);

if (requireReady && payload.summary.needsEvidence > 0) {
  process.exitCode = 1;
}

function runJson<T>(script: string, args: string[]) {
  const result = spawnSync("pnpm", ["tsx", script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (!result.stdout.trim()) {
    throw new Error(`${script} did not print JSON output:\n${result.stderr}`);
  }
  assertNoSensitiveOutput(result.stdout + result.stderr);
  return JSON.parse(result.stdout) as T;
}

function renderMarkdown(payload: {
  generatedAt: string;
  summary: {
    gates: number;
    ready: number;
    needsEvidence: number;
    blockingPartialRows: number;
    missingEvidenceItems: number;
  };
  gates: GateClosureStatus[];
}) {
  const lines = [
    "# Production Gate Status Report",
    "",
    `Generated at: ${payload.generatedAt}`,
    "",
    `Ready gates: ${payload.summary.ready}/${payload.summary.gates}`,
    `Needs evidence: ${payload.summary.needsEvidence}/${payload.summary.gates}`,
    `Blocking partial rows: ${payload.summary.blockingPartialRows}`,
    `Missing evidence items: ${payload.summary.missingEvidenceItems}`,
    "",
    "| Gate | Status | Blocking rows | Missing evidence | Required fields |",
    "| --- | --- | --- | --- | --- |",
    ...payload.gates.map((gate) => {
      const rows = gate.blockingPartialRows.map((row) => row.row).join(", ") || "-";
      return `| ${gate.gate} | ${gate.status} | ${rows} | ${gate.missingEvidence.join(", ") || "-"} | ${gate.requiredEvidenceFields.length} |`;
    }),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function uniqueRows(rows: Array<{ row?: string }>) {
  return new Set(rows.map((row) => row.row).filter(isString));
}

function uniqueChecklistRows(checklist: EvidenceChecklist) {
  return new Set(
    (checklist.gates ?? [])
      .flatMap((gate) => gate.blockingPartialRows ?? [])
      .map((row) => row.row)
      .filter(isString)
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function ensureParentDir(path: string) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  assert.doesNotMatch(outputWithoutDigests, /https?:\/\/[^\s")]+/i);
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function optionalArg(name: string, value: string | null | undefined) {
  return value ? [`${name}=${value}`] : [];
}

function generatedAtValue() {
  const value = optionValue("--generated-at");
  if (!value) return new Date().toISOString();

  try {
    if (new Date(value).toISOString() === value) {
      return value;
    }
  } catch {
    // Report a stable CLI error below.
  }

  console.error("--generated-at must be an ISO timestamp, for example 2026-06-10T00:00:00.000Z");
  process.exit(2);
}
