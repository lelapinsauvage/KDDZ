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
const requireZeroPartials = process.argv.includes("--require-zero-partials");
const branch = optionValue("--branch") ?? gitOutput(["branch", "--show-current"]);
const commit = optionValue("--commit") ?? gitOutput(["rev-parse", "HEAD"]);

if (!envFilePath || !evidenceRecordPath) {
  console.error(
    "Usage: pnpm tsx src/scripts/run-production-closeout.ts --env-file=<private-readiness.env> --evidence-record=<production-acceptance-evidence.md> [--out=<readiness.json>] [--summary-out=<closeout-summary.json>] [--partials-out=<partials.json>] [--checklist-out=<evidence-checklist.json>] [--branch=<branch>] [--commit=<sha>] [--require-zero-partials]"
  );
  process.exit(2);
}

ensureParentDir(outputPath);

run("pnpm", [
  "tsx",
  "src/scripts/audit-production-readiness.ts",
  `--env-file=${envFilePath}`,
  `--out=${outputPath}`,
]);

const readinessSummary = readReadinessSummary(outputPath);
const parityTracker = trackerSummary();
if (partialsOutputPath) {
  run("pnpm", [
    "tsx",
    "src/scripts/report-production-partials.ts",
    "--json",
    `--out=${partialsOutputPath}`,
  ]);
}
if (checklistOutputPath) {
  run("pnpm", [
    "tsx",
    "src/scripts/report-production-evidence-checklist.ts",
    "--json",
    `--out=${checklistOutputPath}`,
  ]);
}
const artifactConsistency = partialsOutputPath && checklistOutputPath
  ? verifyArtifactConsistency()
  : null;
const partialReportSummary = partialsOutputPath ? readPartialReportSummary(partialsOutputPath) : null;
const evidenceChecklistSummary = checklistOutputPath ? readEvidenceChecklistSummary(checklistOutputPath) : null;
const artifactDigests = artifactDigestSummary({
  readinessReport: outputPath,
  partialReport: partialsOutputPath,
  evidenceChecklist: checklistOutputPath,
});
run("pnpm", [
  "tsx",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  evidenceRecordPath,
  `--readiness-report=${outputPath}`,
  ...optionalArg("--summary-report", summaryOutputPath),
  ...optionalArg("--partial-report", partialsOutputPath),
  ...optionalArg("--checklist-report", checklistOutputPath),
  ...optionalDigestArg("--partial-digest", artifactDigests.partialReport?.digest),
  ...optionalDigestArg("--checklist-digest", artifactDigests.evidenceChecklist?.digest),
  `--branch=${branch}`,
  `--commit=${commit}`,
]);
if (requireZeroPartials && parityTracker.partial !== 0) {
  console.error(`Production closeout requires zero partial parity rows; found ${parityTracker.partial}.`);
  process.exit(1);
}

const summary = {
  status: "production closeout verified",
  readinessReport: outputPath,
  evidenceRecord: evidenceRecordPath,
  partialReport: partialsOutputPath ?? null,
  evidenceChecklist: checklistOutputPath ?? null,
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
  const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as ParityRow[];
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
  ]);
  return {
    status: "verified",
    script: "src/scripts/verify-production-artifact-consistency-contract.ts",
  };
}
