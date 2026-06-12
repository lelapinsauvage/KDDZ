import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

type ArtifactRef = {
  path?: string;
  algorithm?: string;
  digest?: string;
};

type GeneratedArtifact = {
  status?: string;
  generatedAt?: string;
};

type PartialReport = GeneratedArtifact & {
  summary?: {
    partialRows?: number;
    gateCounts?: Record<string, number>;
  };
};

type EvidenceChecklist = GeneratedArtifact & {
  generatedFrom?: {
    productionGates?: string;
  };
  summary?: {
    blockingPartialRows?: number;
  };
};

type PreflightManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  releaseMetadata?: ReleaseMetadata;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: {
    partialReport?: ArtifactRef;
    evidenceChecklist?: ArtifactRef;
    blockingGateStatus?: ArtifactRef;
    focusedArtifactsManifest?: ArtifactRef;
    closeoutPlan?: ArtifactRef;
    readinessEnvTemplates?: Record<string, ArtifactRef>;
  };
  blockingGateSummary?: BlockingGateSummary;
  verifiedBy?: string[];
  redacted?: boolean;
};

type ReleaseMetadata = {
  branch?: string;
  commit?: string;
  acceptanceDate?: string;
};

type BlockingGateSummary = {
  gates?: number;
  ready?: number;
  needsEvidence?: number;
  blockingPartialRows?: number;
  blockingGateLinks?: number;
  missingEvidenceItems?: number;
  closeoutMode?: string;
  canCloseLocally?: boolean;
  gatesToClose?: Array<{
    gate?: string;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    nextActions?: string[];
  }>;
};

type BlockingGateStatus = {
  status?: string;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
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
  gates?: Array<{
    gate?: string;
    missingEvidence?: unknown[];
    requiredEvidenceFields?: unknown[];
    blockingGateLinks?: number;
    blockingPartialRows?: Array<{ row?: string }>;
    nextActions?: string[];
  }>;
};

type FocusedManifest = {
  status?: string;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
};

type CloseoutPlan = {
  status?: string;
  generatedAt?: string;
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
    requiredGateOrder?: string[];
  };
  sourceAlignment?: {
    status?: string;
  };
  gates?: Array<{
    gate?: string;
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

const manifestPath = optionValue("--manifest") ?? positionalArgs()[0];

if (!manifestPath || manifestPath.startsWith("-")) {
  console.error("Usage: pnpm tsx src/scripts/verify-production-preflight-artifacts-manifest.ts --manifest=<preflight-artifacts.json>");
  process.exit(2);
}

const manifest = readJson<PreflightManifest>(manifestPath);
assert.equal(manifest.status, "production preflight artifacts verified");
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.redacted, true);
assert.ok(manifest.generatedAt, "preflight artifact manifest is missing generatedAt");
assert.equal(new Date(manifest.generatedAt).toISOString(), manifest.generatedAt, "preflight artifact manifest generatedAt must be ISO");
assertNonEmptyString(manifest.generatedFrom?.matrix, "preflight artifact manifest is missing source matrix path");
assertNonEmptyString(manifest.generatedFrom?.gateMap, "preflight artifact manifest is missing source gate-map path");
assertNonEmptyString(manifest.generatedFrom?.productionGates, "preflight artifact manifest is missing source production-gates path");
assert.equal(manifest.generatedFrom?.evidenceSpec, "src/scripts/production-acceptance-evidence-spec.ts");
assert.equal(manifest.generatedFrom?.evidenceTemplate, "docs/production-acceptance-evidence-template.md");
assert.deepEqual(manifest.verifiedBy, [
  "src/scripts/verify-production-artifact-consistency-contract.ts",
  "src/scripts/verify-production-focused-artifacts-manifest.ts",
  "src/scripts/verify-production-preflight-artifacts-manifest.ts",
]);

verifyArtifactRef("partial report", manifest.artifacts?.partialReport);
verifyArtifactRef("evidence checklist", manifest.artifacts?.evidenceChecklist);
verifyArtifactRef("blocking gate status", manifest.artifacts?.blockingGateStatus);
verifyArtifactRef("focused artifacts manifest", manifest.artifacts?.focusedArtifactsManifest);
verifyArtifactRef("closeout plan", manifest.artifacts?.closeoutPlan);
verifyReadinessEnvTemplates(manifest.artifacts?.readinessEnvTemplates);
verifyReleaseMetadata(manifest.releaseMetadata);

const partialReport = readJson<PartialReport>(manifest.artifacts?.partialReport?.path ?? "");
const evidenceChecklist = readJson<EvidenceChecklist>(manifest.artifacts?.evidenceChecklist?.path ?? "");
assert.equal(partialReport.generatedAt, manifest.generatedAt);
assert.equal(evidenceChecklist.generatedAt, manifest.generatedAt);
assert.equal(evidenceChecklist.generatedFrom?.productionGates, manifest.generatedFrom.productionGates);

execFileSync("pnpm", [
  "tsx",
  "src/scripts/verify-production-artifact-consistency-contract.ts",
  `--partial-report=${manifest.artifacts?.partialReport?.path}`,
  `--checklist-report=${manifest.artifacts?.evidenceChecklist?.path}`,
], {
  cwd: process.cwd(),
  stdio: "ignore",
});
execFileSync("pnpm", [
  "tsx",
  "src/scripts/verify-production-focused-artifacts-manifest.ts",
  `--manifest=${manifest.artifacts?.focusedArtifactsManifest?.path}`,
], {
  cwd: process.cwd(),
  stdio: "ignore",
});

const blockingStatus = readJson<BlockingGateStatus>(manifest.artifacts?.blockingGateStatus?.path ?? "");
assert.equal(blockingStatus.status, "production gate status report");
assert.equal(blockingStatus.generatedAt, manifest.generatedAt);
assert.equal(blockingStatus.generatedFrom?.matrix, manifest.generatedFrom.matrix);
assert.equal(blockingStatus.generatedFrom?.gateMap, manifest.generatedFrom.gateMap);
assert.equal(blockingStatus.generatedFrom?.productionGates, manifest.generatedFrom.productionGates);
const expectedGateCounts = partialReport.summary?.gateCounts ?? {};
assert.deepEqual(blockingStatus.sourceAlignment, {
  status: "verified",
  generatedAt: manifest.generatedAt,
  readinessGeneratedAt: manifest.generatedAt,
  partialReportGeneratedAt: manifest.generatedAt,
  evidenceChecklistGeneratedAt: manifest.generatedAt,
  partialReportRows: partialReport.summary?.partialRows ?? 0,
  checklistBlockingRows: evidenceChecklist.summary?.blockingPartialRows ?? 0,
  gateCounts: expectedGateCounts,
});
assert.deepEqual(gateCounts(blockingStatus.gates ?? []), expectedGateCounts);
assert.deepEqual(gateLinkCounts(blockingStatus.gates ?? []), expectedGateCounts);
assert.deepEqual(blockingStatus.gates?.map((gate) => gate.gate), Object.keys(expectedGateCounts));
assert.equal(blockingStatus.summary?.gates, Object.keys(expectedGateCounts).length);
assert.equal(blockingStatus.summary?.blockingPartialRows, partialReport.summary?.partialRows);
assert.equal(blockingStatus.summary?.blockingGateLinks, sumValues(expectedGateCounts));
assert.equal(blockingStatus.summary?.closeoutMode, manifest.blockingGateSummary?.closeoutMode);
assert.equal(blockingStatus.summary?.canCloseLocally, manifest.blockingGateSummary?.canCloseLocally);
assert.ok(blockingStatus.gates?.every((gate) => (gate.blockingPartialRows?.length ?? 0) > 0));
assert.deepEqual(manifest.blockingGateSummary, blockingGateSummary(blockingStatus));

const focusedManifest = readJson<FocusedManifest>(manifest.artifacts?.focusedArtifactsManifest?.path ?? "");
assert.equal(focusedManifest.status, "production focused artifacts verified");
assert.equal(focusedManifest.generatedAt, manifest.generatedAt);
assert.equal(focusedManifest.generatedFrom?.matrix, manifest.generatedFrom.matrix);
assert.equal(focusedManifest.generatedFrom?.gateMap, manifest.generatedFrom.gateMap);
assert.equal(focusedManifest.generatedFrom?.productionGates, manifest.generatedFrom.productionGates);

const closeoutPlan = readJson<CloseoutPlan>(manifest.artifacts?.closeoutPlan?.path ?? "");
assert.equal(closeoutPlan.status, "production closeout plan");
assert.equal(closeoutPlan.generatedAt, manifest.generatedAt);
assert.equal(closeoutPlan.generatedFrom?.matrix, manifest.generatedFrom.matrix);
assert.equal(closeoutPlan.generatedFrom?.gateMap, manifest.generatedFrom.gateMap);
assert.equal(closeoutPlan.generatedFrom?.productionGates, manifest.generatedFrom.productionGates);
assert.equal(closeoutPlan.sourceAlignment?.status, "verified");
assert.equal(closeoutPlan.summary?.gates, manifest.blockingGateSummary?.gates);
assert.equal(closeoutPlan.summary?.ready, manifest.blockingGateSummary?.ready);
assert.equal(closeoutPlan.summary?.needsEvidence, manifest.blockingGateSummary?.needsEvidence);
assert.equal(closeoutPlan.summary?.blockingPartialRows, manifest.blockingGateSummary?.blockingPartialRows);
assert.equal(closeoutPlan.summary?.blockingGateLinks, manifest.blockingGateSummary?.blockingGateLinks);
assert.equal(closeoutPlan.summary?.missingEvidenceItems, manifest.blockingGateSummary?.missingEvidenceItems);
assert.equal(closeoutPlan.summary?.closeoutMode, manifest.blockingGateSummary?.closeoutMode);
assert.equal(closeoutPlan.summary?.canCloseLocally, manifest.blockingGateSummary?.canCloseLocally);
assert.deepEqual(closeoutPlan.summary?.requiredGateOrder, ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"]);
assert.deepEqual(
  Object.fromEntries((closeoutPlan.gates ?? []).map((gate) => [gate.gate, gate.blockingRows?.length ?? 0]).sort(([a], [b]) => String(a).localeCompare(String(b)))),
  gateCounts(blockingStatus.gates ?? [])
);
assertCloseoutPlanWorkOrders(closeoutPlan, blockingStatus);
assertReadinessEnvTemplatesMatchCloseoutPlan(manifest.artifacts?.readinessEnvTemplates, closeoutPlan);
assert.ok(closeoutPlan.finalCloseoutCommands?.some((command) => command.includes("verify-production-preflight-artifacts-manifest.ts")));
assert.ok(closeoutPlan.finalCloseoutCommands?.some((command) => command.includes("--manifest=/tmp/kiddzonl-production-evidence-package.json")));
assertReleaseMetadataAppliedToCloseoutPlan(closeoutPlan, manifest.releaseMetadata);
assertReleaseMetadataAppliedToReadinessEnvTemplates(manifest.artifacts?.readinessEnvTemplates, manifest.releaseMetadata);

console.log("production preflight artifacts manifest assertions passed");

function verifyArtifactRef(label: string, artifact: ArtifactRef | undefined) {
  assert.ok(artifact?.path, `${label} is missing path`);
  assert.equal(artifact.algorithm, "sha256", `${label} must use sha256`);
  assert.match(artifact.digest ?? "", /^[a-f0-9]{64}$/, `${label} digest must be a sha256 hex value`);
  assert.equal(artifact.digest, sha256File(artifact.path), `${label} digest drifted`);
  assertNoSensitiveOutput(readFileSync(artifact.path, "utf8"));
}

function verifyReadinessEnvTemplates(templates: Record<string, ArtifactRef> | undefined) {
  assert.deepEqual(Object.keys(templates ?? {}).sort(), ["cron", "full", "native", "nature", "provider"]);
  const expectedScopes: Record<string, string> = {
    full: "all production acceptance gates",
    cron: "PROD-CRON",
    provider: "PROD-PROVIDERS",
    native: "PROD-NATIVE",
    nature: "PROD-NATURE",
  };
  for (const [key, artifact] of Object.entries(templates ?? {})) {
    verifyArtifactRef(`readiness env template ${key}`, artifact);
    const text = readFileSync(artifact.path ?? "", "utf8");
    assert.match(text, new RegExp(`# Scope: ${expectedScopes[key]}`), `${key} readiness env template scope drifted`);
    assert.match(text, /replace-me/, `${key} readiness env template must keep placeholders`);
    assertReadinessEnvTemplatePlaceholders(text, key);
    if (key !== "full") {
      assert.match(text, new RegExp(`Finish condition: Set every ${expectedScopes[key]} evidence pointer`), `${key} readiness env template is missing work order finish condition`);
      assert.match(text, new RegExp(`--gate=${expectedScopes[key]}`), `${key} readiness env template is missing focused proof command`);
    }
  }
}

function verifyReleaseMetadata(metadata: ReleaseMetadata | undefined) {
  if (!metadata) return;
  assertNonEmptyString(metadata.branch, "preflight release metadata is missing branch");
  assertNonEmptyString(metadata.commit, "preflight release metadata is missing commit");
  assertNonEmptyString(metadata.acceptanceDate, "preflight release metadata is missing acceptanceDate");
  assert.match(metadata.acceptanceDate, /^\d{4}-\d{2}-\d{2}$/, "preflight release acceptanceDate must use YYYY-MM-DD");
}

function assertReleaseMetadataAppliedToCloseoutPlan(plan: CloseoutPlan, metadata: ReleaseMetadata | undefined) {
  if (!metadata) return;
  const expectedRef = `--branch=${metadata.branch} --commit=${metadata.commit}`;
  for (const gate of plan.gates ?? []) {
    assert.ok(gate.envTemplateCommand?.includes(`--release-branch=${metadata.branch}`), `${gate.gate} env template command release branch drifted`);
    assert.ok(gate.envTemplateCommand?.includes(`--release-commit=${metadata.commit}`), `${gate.gate} env template command release commit drifted`);
    assert.ok(gate.envTemplateCommand?.includes(`--acceptance-date=${metadata.acceptanceDate}`), `${gate.gate} env template command acceptance date drifted`);
    assert.ok(gate.envTemplateCommand?.includes("--include-work-orders"), `${gate.gate} env template command is missing work orders`);
    assert.ok(gate.envTemplateCommand?.includes(`--generated-at=${plan.generatedAt}`), `${gate.gate} env template command generatedAt drifted`);
  }
  assert.ok(
    plan.finalCloseoutCommands?.some((command) =>
      command.includes("report-production-preflight-artifacts.ts") &&
      command.includes(`--release-branch=${metadata.branch} --release-commit=${metadata.commit} --acceptance-date=${metadata.acceptanceDate}`)
    ),
    "preflight closeout plan is missing release-bound preflight regeneration command"
  );
  assert.ok(
    plan.finalCloseoutCommands?.some((command) => command.includes(`${expectedRef} --acceptance-date=${metadata.acceptanceDate}`)),
    "preflight closeout plan is missing release-bound evidence record command"
  );
  assert.ok(
    plan.finalCloseoutCommands?.some((command) => command.includes(expectedRef) && command.includes("--require-zero-partials")),
    "preflight closeout plan is missing release-bound final package commands"
  );
  assert.ok(plan.finalCloseoutCommands?.every((command) => !command.includes("<release-commit-sha>")));
  assert.ok(plan.finalCloseoutCommands?.every((command) => !command.includes("<YYYY-MM-DD>")));
  assert.ok(plan.finalCloseoutCommands?.every((command) => !command.includes("<release-generated-at-iso>")));
}

function assertReleaseMetadataAppliedToReadinessEnvTemplates(
  templates: Record<string, ArtifactRef> | undefined,
  metadata: ReleaseMetadata | undefined
) {
  if (!metadata) return;
  for (const [key, artifact] of Object.entries(templates ?? {})) {
    const text = readFileSync(artifact.path ?? "", "utf8");
    assert.match(text, new RegExp(`# Release branch: ${escapeRegExp(metadata.branch ?? "")}`), `${key} readiness env template release branch drifted`);
    assert.match(text, new RegExp(`# Release commit: ${escapeRegExp(metadata.commit ?? "")}`), `${key} readiness env template release commit drifted`);
    assert.match(text, new RegExp(`# Acceptance date: ${escapeRegExp(metadata.acceptanceDate ?? "")}`), `${key} readiness env template acceptance date drifted`);
    assert.doesNotMatch(text, /<release-generated-at-iso>/, `${key} readiness env template has an unbound generatedAt placeholder`);
  }
}

function assertReadinessEnvTemplatePlaceholders(text: string, key: string) {
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    assert.match(line, /^[A-Z_][A-Z0-9_]*=replace-me$/, `${key} readiness env template contains a non-placeholder assignment`);
  }
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gateCounts(gates: Array<{ gate?: string; blockingPartialRows?: unknown[] }>) {
  return Object.fromEntries(
    gates
      .filter((gate) => typeof gate.gate === "string")
      .map((gate): [string, number] => [gate.gate as string, gate.blockingPartialRows?.length ?? 0])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function gateLinkCounts(gates: Array<{ gate?: string; blockingGateLinks?: number }>) {
  return Object.fromEntries(
    gates
      .filter((gate) => typeof gate.gate === "string")
      .map((gate): [string, number] => [gate.gate as string, gate.blockingGateLinks ?? 0])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function blockingGateSummary(status: BlockingGateStatus): BlockingGateSummary {
  return {
    gates: status.summary?.gates ?? 0,
    ready: status.summary?.ready ?? 0,
    needsEvidence: status.summary?.needsEvidence ?? 0,
    blockingPartialRows: status.summary?.blockingPartialRows ?? 0,
    blockingGateLinks: status.summary?.blockingGateLinks ?? 0,
    missingEvidenceItems: status.summary?.missingEvidenceItems ?? 0,
    closeoutMode: status.summary?.closeoutMode ?? "unknown",
    canCloseLocally: status.summary?.canCloseLocally === true,
    gatesToClose: (status.gates ?? []).map((gate) => ({
      gate: gate.gate ?? "unknown",
      blockingPartialRows: gate.blockingPartialRows?.length ?? 0,
      blockingGateLinks: gate.blockingGateLinks ?? gate.blockingPartialRows?.length ?? 0,
      missingEvidenceItems: gate.missingEvidence?.length ?? 0,
      nextActions: gate.nextActions ?? [],
    })),
  };
}

function assertCloseoutPlanWorkOrders(plan: CloseoutPlan, status: BlockingGateStatus) {
  const statusByGate = new Map((status.gates ?? []).map((gate) => [gate.gate, gate]));
  for (const gate of plan.gates ?? []) {
    assertNonEmptyString(gate.gate, "closeout plan work order is missing gate id");
    const statusGate = statusByGate.get(gate.gate);
    assert.ok(statusGate, `${gate.gate} is missing from blocking gate status`);
    const workOrder = gate.evidenceWorkOrder;
    assert.ok(workOrder, `${gate.gate} is missing evidence work order`);
    const blockingRows = (statusGate.blockingPartialRows ?? []).map((row) => {
      assertNonEmptyString(row.row, `${gate.gate} blocking row is missing row id`);
      return row.row;
    });
    assert.equal(workOrder.externalDependency, "production evidence");
    assert.match(workOrder.finishCondition ?? "", new RegExp(`Set every ${gate.gate} evidence pointer`));
    assert.deepEqual(workOrder.evidencePointers, statusGate.missingEvidence ?? []);
    assert.deepEqual(workOrder.acceptanceCriteria, statusGate.requiredEvidenceFields ?? []);
    assert.deepEqual(workOrder.focusedCoverageRows, blockingRows, `${gate.gate} evidence work order focusedCoverageRows drifted`);
    assert.deepEqual(gate.blockingRows, blockingRows);
    assert.ok(
      workOrder.proofCommands?.some((command) =>
        command.includes(`audit-production-readiness.ts --env-file=/secure/private-readiness.env --gate=${gate.gate}`)
      ),
      `${gate.gate} work order is missing readiness proof command`
    );
    assert.ok(
      workOrder.proofCommands?.some((command) => command.includes(`report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --gate=${gate.gate}`)),
      `${gate.gate} work order is missing gate-status proof command`
    );
    for (const command of gate.focusedArtifactCommands ?? []) {
      assert.ok(workOrder.proofCommands?.includes(command), `${gate.gate} work order is missing focused artifact proof command`);
    }
  }
}

function assertReadinessEnvTemplatesMatchCloseoutPlan(
  templates: Record<string, ArtifactRef> | undefined,
  plan: CloseoutPlan
) {
  const templateKeysByGate: Record<string, string> = {
    "PROD-CRON": "cron",
    "PROD-PROVIDERS": "provider",
    "PROD-NATIVE": "native",
    "PROD-NATURE": "nature",
  };
  const fullTemplate = readFileSync(templates?.full?.path ?? "", "utf8");
  for (const gate of plan.gates ?? []) {
    assertNonEmptyString(gate.gate, "closeout plan gate is missing id for readiness env template verification");
    const focusedKey = templateKeysByGate[gate.gate];
    assertNonEmptyString(focusedKey, `${gate.gate} has no readiness env template key`);
    const focusedTemplate = readFileSync(templates?.[focusedKey]?.path ?? "", "utf8");
    assertReadinessEnvTemplateWorkOrder(focusedTemplate, gate, focusedKey);
    assertReadinessEnvTemplateWorkOrder(fullTemplate, gate, "full");
  }
}

function assertReadinessEnvTemplateWorkOrder(
  text: string,
  gate: NonNullable<CloseoutPlan["gates"]>[number],
  templateKey: string
) {
  const workOrder = gate.evidenceWorkOrder;
  assert.ok(workOrder, `${gate.gate} is missing evidence work order for readiness env template verification`);
  assert.match(
    text,
    new RegExp(`Finish condition: ${escapeRegExp(workOrder.finishCondition ?? "")}`),
    `${templateKey} readiness env template is missing ${gate.gate} finish condition`
  );
  assert.match(
    text,
    new RegExp(`Focused coverage rows: ${escapeRegExp(workOrder.focusedCoverageRows?.join(", ") ?? "")}`),
    `${templateKey} readiness env template is missing ${gate.gate} focused coverage rows`
  );
  for (const command of workOrder.proofCommands ?? []) {
    assert.match(
      text,
      new RegExp(`Proof command: ${escapeRegExp(command)}`),
      `${templateKey} readiness env template is missing ${gate.gate} proof command`
    );
  }
}

function sumValues(counts: Record<string, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  assert.doesNotMatch(outputWithoutDigests, /https?:\/\/[^\s")]+/i);
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}

function positionalArgs() {
  return process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function assertNonEmptyString(value: unknown, message: string): asserts value is string {
  assert.ok(typeof value === "string", message);
  assert.ok(value.trim(), message);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
