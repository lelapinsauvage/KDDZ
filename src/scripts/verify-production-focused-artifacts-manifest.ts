import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

type FocusedManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: FocusedManifestArtifact[];
  redacted?: boolean;
};

type FocusedManifestArtifact = {
  gate?: string;
  partialReport?: ArtifactRef;
  evidenceChecklist?: ArtifactRef;
  blockingRows?: string[];
  verifiedBy?: string;
};

type ArtifactRef = {
  path?: string;
  algorithm?: string;
  digest?: string;
};

type GeneratedPartialReport = {
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
  summary?: {
    gateFilter?: string;
  };
};

type GeneratedEvidenceChecklist = {
  generatedAt?: string;
  generatedFrom?: {
    partialGateMap?: string;
  };
  summary?: {
    gateFilter?: string;
  };
};

const expectedGates = [
  { gate: "PROD-CRON", rows: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"] },
  {
    gate: "PROD-PROVIDERS",
    rows: ["P01", "P02", "P03", "P05", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P14", "P15", "P17"],
  },
  { gate: "PROD-NATIVE", rows: ["P15", "P16", "P17"] },
  { gate: "PROD-NATURE", rows: ["P17"] },
] as const;

const manifestPath = optionValue("--manifest") ?? positionalArgs()[0];

if (!manifestPath || manifestPath.startsWith("-")) {
  console.error("Usage: pnpm tsx src/scripts/verify-production-focused-artifacts-manifest.ts --manifest=<focused-artifacts.json>");
  process.exit(2);
}

const manifest = readJson<FocusedManifest>(manifestPath);
assert.equal(manifest.status, "production focused artifacts verified");
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.redacted, true);
assert.ok(manifest.generatedAt, "focused artifact manifest is missing generatedAt");
assert.equal(new Date(manifest.generatedAt).toISOString(), manifest.generatedAt, "focused artifact manifest generatedAt must be ISO");
assertNonEmptyString(manifest.generatedFrom?.matrix, "focused artifact manifest is missing source matrix path");
assertNonEmptyString(manifest.generatedFrom?.gateMap, "focused artifact manifest is missing source gate-map path");
assertNonEmptyString(manifest.generatedFrom?.productionGates, "focused artifact manifest is missing source production-gates path");
assert.equal(manifest.generatedFrom?.evidenceSpec, "src/scripts/production-acceptance-evidence-spec.ts");
assert.equal(manifest.generatedFrom?.evidenceTemplate, "docs/production-acceptance-evidence-template.md");
assert.deepEqual(manifest.artifacts?.map((artifact) => artifact.gate), expectedGates.map((entry) => entry.gate));

for (const expected of expectedGates) {
  const artifact: FocusedManifestArtifact | undefined = manifest.artifacts?.find((entry) => entry.gate === expected.gate);
  assert.ok(artifact, `${expected.gate} is missing from focused artifact manifest`);
  assert.deepEqual(artifact.blockingRows, expected.rows);
  assert.equal(artifact.verifiedBy, "src/scripts/verify-production-artifact-consistency-contract.ts");
  verifyArtifactRef(`${expected.gate} partial report`, artifact.partialReport);
  verifyArtifactRef(`${expected.gate} evidence checklist`, artifact.evidenceChecklist);
  const partial: GeneratedPartialReport = readJson<GeneratedPartialReport>(artifact.partialReport?.path ?? "");
  const checklist: GeneratedEvidenceChecklist = readJson<GeneratedEvidenceChecklist>(artifact.evidenceChecklist?.path ?? "");
  assert.equal(partial.generatedAt, manifest.generatedAt, `${expected.gate} partial report generatedAt drifted`);
  assert.equal(checklist.generatedAt, manifest.generatedAt, `${expected.gate} evidence checklist generatedAt drifted`);
  assert.equal(partial.generatedFrom?.matrix, manifest.generatedFrom.matrix, `${expected.gate} partial report matrix source drifted`);
  assert.equal(partial.generatedFrom?.gateMap, manifest.generatedFrom.gateMap, `${expected.gate} partial report gate-map source drifted`);
  assert.equal(
    partial.generatedFrom?.productionGates,
    manifest.generatedFrom.productionGates,
    `${expected.gate} partial report production-gates source drifted`
  );
  assert.equal(checklist.generatedFrom?.partialGateMap, manifest.generatedFrom.gateMap, `${expected.gate} checklist gate-map source drifted`);
  assert.equal(partial.summary?.gateFilter, expected.gate, `${expected.gate} partial report gate filter drifted`);
  assert.equal(checklist.summary?.gateFilter, expected.gate, `${expected.gate} checklist gate filter drifted`);
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-artifact-consistency-contract.ts",
    `--partial-report=${artifact.partialReport?.path}`,
    `--checklist-report=${artifact.evidenceChecklist?.path}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
}

console.log("production focused artifacts manifest assertions passed");

function verifyArtifactRef(label: string, artifact: ArtifactRef | undefined) {
  assert.ok(artifact?.path, `${label} is missing path`);
  assert.equal(artifact.algorithm, "sha256", `${label} must use sha256`);
  assert.match(artifact.digest ?? "", /^[a-f0-9]{64}$/, `${label} digest must be a sha256 hex value`);
  assert.equal(artifact.digest, sha256File(artifact.path), `${label} digest drifted`);
  assertNoSensitiveOutput(readFileSync(artifact.path, "utf8"));
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
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
