import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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
    artifacts?: Array<{ partialReport?: { digest?: string } }>;
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
