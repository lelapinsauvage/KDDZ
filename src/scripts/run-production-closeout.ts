import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type ReadinessReport = {
  summary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
};

type ParityRow = {
  status?: string;
  [key: string]: unknown;
};

type PartialReport = {
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
  };
};

type EvidenceChecklist = {
  summary?: {
    gates?: number;
    requiredFields?: number;
    blockingPartialRows?: number;
  };
};

const envFilePath = optionValue("--env-file");
const evidenceRecordPath = optionValue("--evidence-record");
const outputPath = optionValue("--out") ?? "/tmp/kiddzonl-production-readiness.json";
const summaryOutputPath = optionValue("--summary-out");
const partialsOutputPath = optionValue("--partials-out");
const checklistOutputPath = optionValue("--checklist-out");
const preflightManifestPath = optionValue("--preflight-manifest");
const requireZeroPartials = process.argv.includes("--require-zero-partials");
const branch = optionValue("--branch") ?? gitOutput(["branch", "--show-current"]);
const commit = optionValue("--commit") ?? gitOutput(["rev-parse", "HEAD"]);
const explicitBranch = optionValue("--branch");
const explicitCommit = optionValue("--commit");
const generatedAt = generatedAtValue();
const summaryGeneratedAt = generatedAt ?? new Date().toISOString();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";
const productionGatesPath = optionValue("--production-gates") ?? "docs/legacy-production-acceptance-gates.md";

if (!envFilePath || !evidenceRecordPath) {
  console.error(
    "Usage: pnpm tsx src/scripts/run-production-closeout.ts --env-file=<private-readiness.env> --evidence-record=<production-acceptance-evidence.md> [--out=<readiness.json>] [--summary-out=<closeout-summary.json>] [--partials-out=<partials.json>] [--checklist-out=<evidence-checklist.json>] [--preflight-manifest=<preflight-artifacts.json>] [--branch=<branch>] [--commit=<sha>] [--generated-at=<iso>] [--parity-matrix=<path>] [--partial-gate-map=<path>] [--production-gates=<path>] [--require-zero-partials]"
  );
  process.exit(2);
}
if (requireZeroPartials && (!summaryOutputPath || !partialsOutputPath || !checklistOutputPath)) {
  console.error(
    "Production closeout with --require-zero-partials must also include --summary-out, --partials-out, and --checklist-out so final evidence artifacts are archived."
  );
  process.exit(2);
}
if (requireZeroPartials && (!explicitBranch || !explicitCommit)) {
  console.error(
    "Production closeout with --require-zero-partials must include explicit --branch and --commit release refs."
  );
  process.exit(2);
}

ensureParentDir(outputPath);

run("pnpm", [
  "tsx",
  "src/scripts/audit-production-readiness.ts",
  `--env-file=${envFilePath}`,
  `--out=${outputPath}`,
  ...optionalArg("--generated-at", generatedAt),
]);

const readinessSummary = readReadinessSummary(outputPath);
const parityTracker = trackerSummary();
if (partialsOutputPath) {
  run("pnpm", [
    "tsx",
    "src/scripts/report-production-partials.ts",
    "--json",
    `--out=${partialsOutputPath}`,
    `--parity-matrix=${parityMatrixPath}`,
    `--partial-gate-map=${partialGateMapPath}`,
    `--production-gates=${productionGatesPath}`,
    ...optionalArg("--generated-at", generatedAt),
  ]);
}
if (checklistOutputPath) {
  run("pnpm", [
    "tsx",
    "src/scripts/report-production-evidence-checklist.ts",
    "--json",
    `--out=${checklistOutputPath}`,
    `--partial-gate-map=${partialGateMapPath}`,
    `--production-gates=${productionGatesPath}`,
    ...optionalArg("--generated-at", generatedAt),
  ]);
}
const artifactConsistency = partialsOutputPath && checklistOutputPath
  ? verifyArtifactConsistency()
  : null;
const partialReportSummary = partialsOutputPath ? readPartialReportSummary(partialsOutputPath) : null;
const evidenceChecklistSummary = checklistOutputPath ? readEvidenceChecklistSummary(checklistOutputPath) : null;
const artifactDigests = artifactDigestSummary({
  readinessReport: outputPath,
  evidenceRecord: evidenceRecordPath,
  partialReport: partialsOutputPath,
  evidenceChecklist: checklistOutputPath,
  preflightManifest: preflightManifestPath,
});
if (requireZeroPartials && parityTracker.partial !== 0) {
  console.error(`Production closeout requires zero partial parity rows; found ${parityTracker.partial}.`);
  process.exit(1);
}
run("pnpm", [
  "tsx",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  evidenceRecordPath,
  `--readiness-report=${outputPath}`,
  ...optionalArg("--summary-report", summaryOutputPath),
  ...optionalArg("--partial-report", partialsOutputPath),
  ...optionalArg("--checklist-report", checklistOutputPath),
  ...optionalArg("--preflight-manifest", preflightManifestPath),
  ...optionalDigestArg("--partial-digest", artifactDigests.partialReport?.digest),
  ...optionalDigestArg("--checklist-digest", artifactDigests.evidenceChecklist?.digest),
  ...optionalDigestArg("--preflight-digest", artifactDigests.preflightManifest?.digest),
  `--branch=${branch}`,
  `--commit=${commit}`,
]);

const summary = {
  status: "production closeout verified",
  schemaVersion: 1,
  generatedAt: summaryGeneratedAt,
  generatedFrom: {
    matrix: parityMatrixPath,
    gateMap: partialGateMapPath,
    productionGates: productionGatesPath,
  },
  readinessReport: outputPath,
  evidenceRecord: evidenceRecordPath,
  partialReport: partialsOutputPath ?? null,
  evidenceChecklist: checklistOutputPath ?? null,
  preflightManifest: preflightManifestPath ?? null,
  partialReportSummary,
  evidenceChecklistSummary,
  artifactDigests,
  artifactConsistency,
  readinessSummary,
  parityTracker,
  requireZeroPartials,
  branch,
  commit,
  redacted: true,
};

if (summaryOutputPath) {
  ensureParentDir(summaryOutputPath);
  writeFileSync(summaryOutputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(summary, null, 2));

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

function gitOutput(args: string[]) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ensureParentDir(path: string) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function readReadinessSummary(path: string) {
  const report = JSON.parse(readFileSync(path, "utf8")) as ReadinessReport;
  return {
    ready: report.summary?.ready ?? null,
    needsEvidence: report.summary?.needsEvidence ?? null,
    total: report.summary?.total ?? null,
  };
}

function readPartialReportSummary(path: string) {
  const report = JSON.parse(readFileSync(path, "utf8")) as PartialReport;
  return {
    partialRows: report.summary?.partialRows ?? null,
    gates: report.summary?.gates ?? [],
    gateCounts: report.summary?.gateCounts ?? {},
  };
}

function readEvidenceChecklistSummary(path: string) {
  const report = JSON.parse(readFileSync(path, "utf8")) as EvidenceChecklist;
  return {
    gates: report.summary?.gates ?? null,
    requiredFields: report.summary?.requiredFields ?? null,
    blockingPartialRows: report.summary?.blockingPartialRows ?? null,
  };
}

function artifactDigestSummary(paths: Record<string, string | null>) {
  return Object.fromEntries(
    Object.entries(paths)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([name, path]) => [
        name,
        {
          algorithm: "sha256",
          digest: sha256File(path),
        },
      ])
  );
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function trackerSummary() {
  const matrix = JSON.parse(readFileSync(parityMatrixPath, "utf8")) as ParityRow[];
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

    const row = value as ParityRow;
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

  return {
    total,
    complete,
    partial,
    donePct,
    leftPct,
  };
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function generatedAtValue() {
  const value = optionValue("--generated-at");
  if (!value) return null;

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

function optionalArg(name: string, value: string | null) {
  return value ? [`${name}=${value}`] : [];
}

function optionalDigestArg(name: string, value: string | undefined) {
  return value ? [`${name}=${value}`] : [];
}

function verifyArtifactConsistency() {
  run("pnpm", [
    "tsx",
    "src/scripts/verify-production-artifact-consistency-contract.ts",
    ...optionalArg("--partial-report", partialsOutputPath),
    ...optionalArg("--checklist-report", checklistOutputPath),
  ]);
  return {
    status: "verified",
    script: "src/scripts/verify-production-artifact-consistency-contract.ts",
  };
}
