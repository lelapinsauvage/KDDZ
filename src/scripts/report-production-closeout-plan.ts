import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type GateStatusReport = {
  schemaVersion?: number;
  generatedAt?: string;
  redacted?: boolean;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
  };
  sourceAlignment?: {
    status?: string;
  };
  gates?: Array<{
    gate?: string;
    status?: string;
    missingEvidence?: string[];
    requiredEvidenceFields?: string[];
    blockingGateLinks?: number;
    blockingPartialRows?: Array<{
      row?: string;
      statusAnchor?: string;
      closureReason?: string;
    }>;
    nextActions?: string[];
  }>;
};

type CloseoutPlan = {
  status: "production closeout plan";
  schemaVersion: 1;
  generatedAt: string;
  redacted: true;
  generatedFrom: GateStatusReport["generatedFrom"];
  summary: NonNullable<GateStatusReport["summary"]> & {
    requiredGateOrder: string[];
  };
  sourceAlignment: GateStatusReport["sourceAlignment"];
  gates: Array<{
    gate: string;
    status: string;
    missingEvidence: string[];
    requiredEvidenceFields: string[];
    blockingRows: string[];
    blockingGateLinks: number;
    envTemplateCommand: string;
    focusedArtifactCommands: string[];
    evidenceWorkOrder: {
      externalDependency: "production evidence";
      finishCondition: string;
      evidencePointers: string[];
      acceptanceCriteria: string[];
      focusedCoverageRows: string[];
      proofCommands: string[];
    };
    nextActions: string[];
  }>;
  finalCloseoutCommands: string[];
};

const json = process.argv.includes("--json");
const outputPath = optionValue("--out");
const envFilePath = optionValue("--env-file");
const releaseBranch = optionValue("--release-branch") ?? "legacy-parity-runbook";
const releaseCommit = optionValue("--release-commit") ?? "<release-commit-sha>";
const acceptanceDate = optionValue("--acceptance-date") ?? "<YYYY-MM-DD>";
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";
const productionGatesPath = optionValue("--production-gates") ?? "docs/legacy-production-acceptance-gates.md";

const gateStatus = runJson<GateStatusReport>("src/scripts/report-production-gate-status.ts", [
  "--json",
  "--blocking-only",
  `--generated-at=${generatedAt}`,
  ...optionalArg("--env-file", envFilePath),
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
]);

assert.equal(gateStatus.redacted, true);
assert.equal(gateStatus.schemaVersion, 1);
assert.equal(gateStatus.generatedAt, generatedAt);
assert.equal(gateStatus.sourceAlignment?.status, "verified");
assertNoSensitiveOutput(JSON.stringify(gateStatus));

const gates = (gateStatus.gates ?? []).map((gate) => {
  assert.ok(gate.gate, "closeout plan gate is missing an id");
  const artifact = focusedArtifactForGate(gate.gate);
  const blockingRows = (gate.blockingPartialRows ?? []).map((row) => {
    assert.ok(row.row, `${gate.gate} blocking row is missing an id`);
    return row.row;
  });
  const focusedArtifactCommands = [
    `pnpm tsx src/scripts/report-production-partials.ts --json --gate=${gate.gate} --out=/tmp/kiddzonl-production-${artifact.slug}-partials.json --generated-at=<release-generated-at-iso>`,
    `pnpm tsx src/scripts/report-production-evidence-checklist.ts --json --gate=${gate.gate} --out=/tmp/kiddzonl-production-${artifact.slug}-checklist.json --generated-at=<release-generated-at-iso>`,
    `pnpm tsx src/scripts/verify-production-artifact-consistency-contract.ts --partial-report=/tmp/kiddzonl-production-${artifact.slug}-partials.json --checklist-report=/tmp/kiddzonl-production-${artifact.slug}-checklist.json`,
  ];
  return {
    gate: gate.gate,
    status: gate.status ?? "needs-evidence",
    missingEvidence: gate.missingEvidence ?? [],
    requiredEvidenceFields: gate.requiredEvidenceFields ?? [],
    blockingRows,
    blockingGateLinks: gate.blockingGateLinks ?? 0,
    envTemplateCommand: `pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=${gate.gate} --out=/secure/private-readiness-${artifact.slug}.env`,
    focusedArtifactCommands,
    evidenceWorkOrder: {
      externalDependency: "production evidence",
      finishCondition: `Set every ${gate.gate} evidence pointer, archive focused coverage for ${blockingRows.join(", ")}, then rerun gate status with --require-ready --require-no-blockers.`,
      evidencePointers: gate.missingEvidence ?? [],
      acceptanceCriteria: gate.requiredEvidenceFields ?? [],
      focusedCoverageRows: blockingRows,
      proofCommands: [
        `pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --gate=${gate.gate} --generated-at=<release-generated-at-iso>`,
        ...focusedArtifactCommands,
        `pnpm tsx src/scripts/report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --gate=${gate.gate} --generated-at=<release-generated-at-iso> --require-ready`,
      ],
    },
    nextActions: gate.nextActions ?? [],
  };
});

const requiredGateOrder = ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"];
if (gates.length > 0) {
  assert.deepEqual(
    [...gates.map((gate) => gate.gate)].sort(),
    [...requiredGateOrder].sort(),
    "closeout plan must cover the four current external production blocker gates while blockers remain"
  );
}

const plan: CloseoutPlan = {
  status: "production closeout plan",
  schemaVersion: 1,
  generatedAt,
  redacted: true,
  generatedFrom: gateStatus.generatedFrom,
  summary: {
    gates: gateStatus.summary?.gates ?? gates.length,
    ready: gateStatus.summary?.ready ?? 0,
    needsEvidence: gateStatus.summary?.needsEvidence ?? 0,
    blockingPartialRows: gateStatus.summary?.blockingPartialRows ?? 0,
    blockingGateLinks: gateStatus.summary?.blockingGateLinks ?? 0,
    missingEvidenceItems: gateStatus.summary?.missingEvidenceItems ?? 0,
    closeoutMode: gateStatus.summary?.closeoutMode ?? "external-production-evidence",
    canCloseLocally: gateStatus.summary?.canCloseLocally ?? false,
    requiredGateOrder,
  },
  sourceAlignment: gateStatus.sourceAlignment,
  gates,
  finalCloseoutCommands: finalCloseoutCommands({
    releaseBranch,
    releaseCommit,
    acceptanceDate,
  }),
};

assertNoSensitiveOutput(JSON.stringify(plan));

const rendered = json ? `${JSON.stringify(plan, null, 2)}\n` : renderMarkdown(plan);
if (outputPath) {
  ensureParentDir(outputPath);
  writeFileSync(outputPath, rendered, "utf8");
}
process.stdout.write(rendered);

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

function renderMarkdown(plan: CloseoutPlan) {
  const lines = [
    "# Production Closeout Plan",
    "",
    `Generated at: ${plan.generatedAt}`,
    "",
    `Ready gates: ${plan.summary.ready}/${plan.summary.gates}`,
    `Needs evidence: ${plan.summary.needsEvidence}/${plan.summary.gates}`,
    `Blocking partial rows: ${plan.summary.blockingPartialRows}`,
    `Blocking gate links: ${plan.summary.blockingGateLinks}`,
    `Missing evidence items: ${plan.summary.missingEvidenceItems}`,
    `Closeout mode: ${plan.summary.closeoutMode}`,
    `Can close locally: ${plan.summary.canCloseLocally ? "yes" : "no"}`,
    "",
    `Source alignment: ${plan.sourceAlignment?.status ?? "unknown"}`,
    `Source matrix: ${plan.generatedFrom?.matrix ?? "unknown"}`,
    `Source gate map: ${plan.generatedFrom?.gateMap ?? "unknown"}`,
    `Source production gates: ${plan.generatedFrom?.productionGates ?? "unknown"}`,
    "",
    "## Evidence Work Orders",
    "",
    ...plan.gates.flatMap((gate) => [
      `### ${gate.gate}`,
      "",
      `Finish condition: ${gate.evidenceWorkOrder.finishCondition}`,
      "",
      `Evidence pointers: ${gate.evidenceWorkOrder.evidencePointers.join(", ") || "-"}`,
      "",
      `Acceptance criteria: ${gate.evidenceWorkOrder.acceptanceCriteria.join("; ") || "-"}`,
      "",
      `Focused coverage rows: ${gate.evidenceWorkOrder.focusedCoverageRows.join(", ") || "-"}`,
      "",
      "```bash",
      ...gate.evidenceWorkOrder.proofCommands,
      "```",
      "",
    ]),
    "| Gate | Missing evidence | Blocking rows | Env template | Focused artifact commands |",
    "| --- | --- | --- | --- | --- |",
    ...plan.gates.map((gate) =>
      [
        gate.gate,
        gate.missingEvidence.join(", ") || "-",
        gate.blockingRows.join(", ") || "-",
        gate.envTemplateCommand,
        gate.focusedArtifactCommands.join("<br>"),
      ].join(" | ")
    ).map((row) => `| ${row} |`),
    "",
    "## Final Closeout Commands",
    "",
    "```bash",
    ...plan.finalCloseoutCommands,
    "```",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function focusedArtifactForGate(gate: string) {
  const artifacts: Record<string, { slug: string }> = {
    "PROD-CRON": { slug: "cron" },
    "PROD-PROVIDERS": { slug: "provider" },
    "PROD-NATIVE": { slug: "native" },
    "PROD-NATURE": { slug: "nature" },
  };
  const artifact = artifacts[gate];
  assert.ok(artifact, `unsupported production closeout gate ${gate}`);
  return artifact;
}

function finalCloseoutCommands(params: {
  releaseBranch: string;
  releaseCommit: string;
  acceptanceDate: string;
}) {
  return [
    "pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=/tmp/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>",
    "pnpm tsx src/scripts/verify-production-preflight-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json",
    `pnpm tsx src/scripts/render-production-acceptance-evidence-record.ts --out=/secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=${params.releaseBranch} --commit=${params.releaseCommit} --acceptance-date=${params.acceptanceDate}`,
    `pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=${params.releaseBranch} --commit=${params.releaseCommit} --generated-at=<release-generated-at-iso> --require-zero-partials`,
    "pnpm tsx src/scripts/report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --out=/tmp/kiddzonl-production-gate-status.json --generated-at=<release-generated-at-iso> --require-ready --require-no-blockers",
    `pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=${params.releaseBranch} --commit=${params.releaseCommit} --require-zero-partials`,
    `pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=${params.releaseBranch} --commit=${params.releaseCommit} --require-zero-partials`,
    `pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest=/tmp/kiddzonl-production-evidence-package.json --branch=${params.releaseBranch} --commit=${params.releaseCommit} --require-zero-partials`,
  ];
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
  const value = optionValue("--generated-at") ?? new Date().toISOString();
  assert.doesNotThrow(() => new Date(value).toISOString());
  assert.equal(new Date(value).toISOString(), value, `--generated-at must be a full ISO timestamp, got ${value}`);
  return value;
}
