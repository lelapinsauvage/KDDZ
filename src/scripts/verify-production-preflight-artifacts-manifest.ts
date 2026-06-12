import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

type ArtifactRef = {
  path?: string;
  algorithm?: string;
  digest?: string;
};

type PreflightManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: {
    partialReport?: ArtifactRef;
    evidenceChecklist?: ArtifactRef;
    blockingGateStatus?: ArtifactRef;
    focusedArtifactsManifest?: ArtifactRef;
  };
  verifiedBy?: string[];
  redacted?: boolean;
};

type BlockingGateStatus = {
  status?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
  };
  gates?: Array<{
    gate?: string;
    blockingPartialRows?: unknown[];
  }>;
};

type FocusedManifest = {
  status?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
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
assert.equal(blockingStatus.generatedFrom?.matrix, manifest.generatedFrom.matrix);
assert.equal(blockingStatus.generatedFrom?.gateMap, manifest.generatedFrom.gateMap);
assert.deepEqual(blockingStatus.gates?.map((gate) => gate.gate), [
  "PROD-CRON",
  "PROD-NATIVE",
  "PROD-NATURE",
  "PROD-PROVIDERS",
]);
assert.equal(blockingStatus.summary?.gates, 4);
assert.equal(blockingStatus.summary?.blockingPartialRows, 17);
assert.ok(blockingStatus.gates?.every((gate) => (gate.blockingPartialRows?.length ?? 0) > 0));

const focusedManifest = readJson<FocusedManifest>(manifest.artifacts?.focusedArtifactsManifest?.path ?? "");
assert.equal(focusedManifest.status, "production focused artifacts verified");
assert.equal(focusedManifest.generatedFrom?.matrix, manifest.generatedFrom.matrix);
assert.equal(focusedManifest.generatedFrom?.gateMap, manifest.generatedFrom.gateMap);

console.log("production preflight artifacts manifest assertions passed");

function verifyArtifactRef(label: string, artifact: ArtifactRef | undefined) {
  assert.ok(artifact?.path, `${label} is missing path`);
  assert.equal(artifact.algorithm, "sha256", `${label} must use sha256`);
  assert.match(artifact.digest ?? "", /^[a-f0-9]{64}$/, `${label} digest must be a sha256 hex value`);
  assert.equal(artifact.digest, sha256File(artifact.path), `${label} digest drifted`);
  assertNoSensitiveOutput(readFileSync(artifact.path, "utf8"));
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
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
