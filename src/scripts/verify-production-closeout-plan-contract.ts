import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CloseoutPlan = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  redacted?: boolean;
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
    requiredGateOrder?: string[];
  };
  sourceAlignment?: {
    status?: string;
  };
  gates?: Array<{
    gate?: string;
    missingEvidence?: string[];
    requiredEvidenceFields?: string[];
    blockingRows?: string[];
    envTemplateCommand?: string;
    focusedArtifactCommands?: string[];
    evidenceWorkOrder?: {
      externalDependency?: string;
      finishCondition?: string;
      evidencePointers?: string[];
      acceptanceCriteria?: string[];
      focusedCoverageRows?: string[];
      proofCommands?: string[];
    };
  }>;
  finalCloseoutCommands?: string[];
};

const generatedAt = "2026-06-12T00:00:00.000Z";
const output = execFileSync("pnpm", [
  "tsx",
  "src/scripts/report-production-closeout-plan.ts",
  "--json",
  `--generated-at=${generatedAt}`,
], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const plan = JSON.parse(output) as CloseoutPlan;

assert.equal(plan.status, "production closeout plan");
assert.equal(plan.schemaVersion, 1);
assert.equal(plan.generatedAt, generatedAt);
assert.equal(plan.redacted, true);
assert.equal(plan.summary?.gates, 4);
assert.equal(plan.summary?.ready, 0);
assert.equal(plan.summary?.needsEvidence, 4);
assert.equal(plan.summary?.blockingPartialRows, 17);
assert.equal(plan.summary?.blockingGateLinks, 27);
assert.equal(plan.summary?.missingEvidenceItems, 28);
assert.equal(plan.summary?.closeoutMode, "external-production-evidence");
assert.equal(plan.summary?.canCloseLocally, false);
assert.deepEqual(plan.summary?.requiredGateOrder, ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"]);
assert.equal(plan.sourceAlignment?.status, "verified");

const gates = new Map((plan.gates ?? []).map((gate) => [gate.gate, gate]));
for (const gate of ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"]) {
  const entry = gates.get(gate);
  assert.ok(entry, `${gate} is missing from closeout plan`);
  assert.ok((entry.missingEvidence?.length ?? 0) > 0, `${gate} should list missing evidence pointers`);
  assert.ok((entry.requiredEvidenceFields?.length ?? 0) > 0, `${gate} should list required evidence fields`);
  assert.ok((entry.blockingRows?.length ?? 0) > 0, `${gate} should list blocking rows`);
  assert.match(entry.envTemplateCommand ?? "", new RegExp(`render-production-readiness-env-template\\.ts --gate=${gate}`));
  assert.equal(entry.focusedArtifactCommands?.length, 3);
  assert.equal(entry.evidenceWorkOrder?.externalDependency, "production evidence");
  assert.match(entry.evidenceWorkOrder?.finishCondition ?? "", new RegExp(`Set every ${gate} evidence pointer`));
  assert.deepEqual(entry.evidenceWorkOrder?.evidencePointers, entry.missingEvidence);
  assert.deepEqual(entry.evidenceWorkOrder?.acceptanceCriteria, entry.requiredEvidenceFields);
  assert.deepEqual(entry.evidenceWorkOrder?.focusedCoverageRows, entry.blockingRows);
  assert.ok(entry.evidenceWorkOrder?.proofCommands?.some((command) => command.includes(`audit-production-readiness.ts --env-file=/secure/private-readiness.env --gate=${gate}`)));
  assert.ok(entry.evidenceWorkOrder?.proofCommands?.some((command) => command.includes(`report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --gate=${gate}`)));
}

assert.deepEqual(gates.get("PROD-CRON")?.blockingRows, ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"]);
assert.deepEqual(gates.get("PROD-NATIVE")?.blockingRows, ["P15", "P16", "P17"]);
assert.deepEqual(gates.get("PROD-NATURE")?.blockingRows, ["P17"]);
assert.deepEqual(gates.get("PROD-PROVIDERS")?.blockingRows, [
  "P01",
  "P02",
  "P03",
  "P05",
  "P06",
  "P07",
  "P08",
  "P09",
  "P11",
  "P12",
  "P13",
  "P14",
  "P15",
  "P17",
]);

assert.ok(plan.finalCloseoutCommands?.some((command) => command.includes("verify-production-preflight-artifacts-manifest.ts")));
assert.ok(plan.finalCloseoutCommands?.some((command) => command.includes("--manifest-out=/tmp/kiddzonl-production-evidence-package.json")));
assert.ok(plan.finalCloseoutCommands?.some((command) => command.includes("--manifest=/tmp/kiddzonl-production-evidence-package.json")));
assert.ok(plan.finalCloseoutCommands?.some((command) => command.includes("--require-ready --require-no-blockers")));
assert.ok(plan.finalCloseoutCommands?.some((command) => command.includes("--branch=legacy-parity-runbook --commit=<release-commit-sha>")));
assertNoSensitiveOutput(output);

const boundOutput = execFileSync("pnpm", [
  "tsx",
  "src/scripts/report-production-closeout-plan.ts",
  "--json",
  `--generated-at=${generatedAt}`,
  "--release-branch=legacy-parity-runbook",
  "--release-commit=0d26d0c",
  "--acceptance-date=2026-06-12",
], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const boundPlan = JSON.parse(boundOutput) as CloseoutPlan;
assert.ok(boundPlan.finalCloseoutCommands?.some((command) =>
  command.includes("--branch=legacy-parity-runbook --commit=0d26d0c --acceptance-date=2026-06-12")
));
assert.ok(boundPlan.finalCloseoutCommands?.every((command) => !command.includes("<release-commit-sha>")));
assert.ok(boundPlan.finalCloseoutCommands?.every((command) => !command.includes("<YYYY-MM-DD>")));
assertNoSensitiveOutput(boundOutput);

const markdown = execFileSync("pnpm", [
  "tsx",
  "src/scripts/report-production-closeout-plan.ts",
  `--generated-at=${generatedAt}`,
], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.match(markdown, /# Production Closeout Plan/);
assert.match(markdown, /PROD-CRON/);
assert.match(markdown, /Evidence Work Orders/);
assert.match(markdown, /Finish condition: Set every PROD-CRON evidence pointer/);
assert.match(markdown, /Final Closeout Commands/);
assertNoSensitiveOutput(markdown);

const tmp = mkdtempSync(join(tmpdir(), "closeout-plan-"));
const outPath = join(tmp, "plan.json");
execFileSync("pnpm", [
  "tsx",
  "src/scripts/report-production-closeout-plan.ts",
  "--json",
  `--generated-at=${generatedAt}`,
  `--out=${outPath}`,
], {
  cwd: process.cwd(),
  stdio: "ignore",
});
assert.deepEqual(JSON.parse(readFileSync(outPath, "utf8")), plan);

console.log("production closeout plan contract assertions passed");

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  assert.doesNotMatch(outputWithoutDigests, /https?:\/\/[^\s")]+/i);
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}
