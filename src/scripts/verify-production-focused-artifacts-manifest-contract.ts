import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-focused-artifacts-manifest-"));
const generatedAt = "2026-06-10T00:00:00.000Z";

try {
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-focused-artifacts.ts",
    `--out-dir=${tmp}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const manifestPath = join(tmp, "kiddzonl-production-focused-artifacts.json");
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    `--manifest=${manifestPath}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    generatedAt?: string;
    artifacts?: Array<{ partialReport?: { path?: string; digest?: string } }>;
  };
  assert.equal(manifest.generatedAt, generatedAt);
  assert.equal(manifest.artifacts?.length, 4);

  const staleManifestPath = join(tmp, "stale-focused-artifacts.json");
  manifest.artifacts![0]!.partialReport!.digest = "0".repeat(64);
  writeFileSync(staleManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const stale = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    `--manifest=${staleManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /digest drifted/);

  const productionGateSourceMismatchManifestPath = join(tmp, "production-gates-source-mismatch-focused-artifacts.json");
  const productionGateSourceMismatchManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    artifacts?: Array<{ partialReport?: { path?: string; digest?: string } }>;
  };
  const productionGateSourceMismatchPartialPath = productionGateSourceMismatchManifest.artifacts?.[0]?.partialReport?.path;
  assert.ok(productionGateSourceMismatchPartialPath);
  const productionGateSourceMismatchPartial = JSON.parse(readFileSync(productionGateSourceMismatchPartialPath, "utf8")) as {
    generatedFrom?: { productionGates?: string };
  };
  productionGateSourceMismatchPartial.generatedFrom = {
    ...productionGateSourceMismatchPartial.generatedFrom,
    productionGates: "docs/other-legacy-production-acceptance-gates.md",
  };
  writeFileSync(productionGateSourceMismatchPartialPath, `${JSON.stringify(productionGateSourceMismatchPartial, null, 2)}\n`, "utf8");
  productionGateSourceMismatchManifest.artifacts![0]!.partialReport!.digest = sha256File(productionGateSourceMismatchPartialPath);
  writeFileSync(
    productionGateSourceMismatchManifestPath,
    `${JSON.stringify(productionGateSourceMismatchManifest, null, 2)}\n`,
    "utf8"
  );
  const productionGateSourceMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    `--manifest=${productionGateSourceMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(productionGateSourceMismatch.status, 1);
  assert.match(productionGateSourceMismatch.stderr, /partial report production-gates source drifted/);

  execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-focused-artifacts.ts",
    `--out-dir=${tmp}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const timestampMismatchManifestPath = join(tmp, "timestamp-mismatch-focused-artifacts.json");
  const timestampMismatchManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    artifacts?: Array<{ partialReport?: { path?: string; digest?: string } }>;
  };
  const timestampMismatchPartialPath = timestampMismatchManifest.artifacts?.[0]?.partialReport?.path;
  assert.ok(timestampMismatchPartialPath);
  const timestampMismatchPartial = JSON.parse(readFileSync(timestampMismatchPartialPath, "utf8")) as { generatedAt?: string };
  timestampMismatchPartial.generatedAt = "2026-06-10T00:00:01.000Z";
  writeFileSync(timestampMismatchPartialPath, `${JSON.stringify(timestampMismatchPartial, null, 2)}\n`, "utf8");
  timestampMismatchManifest.artifacts![0]!.partialReport!.digest = sha256File(timestampMismatchPartialPath);
  writeFileSync(timestampMismatchManifestPath, `${JSON.stringify(timestampMismatchManifest, null, 2)}\n`, "utf8");
  const timestampMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    `--manifest=${timestampMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(timestampMismatch.status, 1);
  assert.match(timestampMismatch.stderr, /partial report generatedAt drifted/);

  const missingManifest = spawnSync("pnpm", ["tsx", "src/scripts/verify-production-focused-artifacts-manifest.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(missingManifest.status, 2);
  assert.match(missingManifest.stderr, /--manifest=<focused-artifacts\.json>/);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production focused artifacts manifest contract assertions passed");

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
