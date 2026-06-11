import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type ParityRow = {
  status?: string;
};

const handoff = readFileSync("docs/NEXT-CODEX-HANDOFF.md", "utf8");
const partialMap = readFileSync("docs/partial-production-gate-map.md", "utf8");
const productionGates = readFileSync("docs/legacy-production-acceptance-gates.md", "utf8");
const matrix = JSON.parse(
  readFileSync("docs/page-parity-matrix.json", "utf8"),
) as ParityRow[];

const partialRows = matrix.filter((row) =>
  String(row.status ?? "").startsWith("partial"),
);
const completeRows = matrix.filter((row) =>
  String(row.status ?? "").startsWith("restored") ||
  String(row.status ?? "").startsWith("mapped") ||
  String(row.status ?? "").startsWith("retired"),
);

assert.equal(matrix.length, 1713, "handoff contract matrix total drifted");
assert.equal(completeRows.length, 1696, "handoff contract complete count drifted");
assert.equal(partialRows.length, 17, "handoff contract partial count drifted");

for (const expected of [
  "Total matrix rows: `1713`",
  "Complete rows: `1696`",
  "Partial rows: `17`",
  "Current tracker: `99% done / 1% left`",
  "`PROD-CRON`, `PROD-NATIVE`, `PROD-NATURE`, and `PROD-PROVIDERS`",
  "pnpm tsx src/scripts/report-production-partials.ts --json",
  "pnpm tsx src/scripts/report-production-evidence-checklist.ts --json",
  "pnpm run verify:production-gates",
  "--generated-at=<release-generated-at-iso>",
  "--require-zero-partials",
  "`e7bb81b chore: version evidence package manifests`",
  "`29e45e9 chore: timestamp evidence package manifests`",
  "`7b58b2f chore: freeze readiness evidence timestamps`",
  "`de7a99a chore: validate production artifact timestamps`",
  "Production Evidence Timestamp Hardening",
  "evidence package manifest also carries a top-level `generatedAt` and `schemaVersion: 1`",
]) {
  assert.ok(handoff.includes(expected), `handoff missing current marker: ${expected}`);
}

for (const gate of ["PROD-CRON", "PROD-NATIVE", "PROD-NATURE", "PROD-PROVIDERS"]) {
  assert.match(handoff, new RegExp(gate), `handoff missing ${gate}`);
  assert.match(partialMap, new RegExp(gate), `partial map missing ${gate}`);
  assert.match(productionGates, new RegExp(gate), `production gates doc missing ${gate}`);
}

for (const stale of [
  "70.9%",
  "29.1%",
  "35.3%",
  "64.7%",
  "next recommended slice is parent native `notifications_master.php`",
  "Exact Next Best Slice\\n\\nContinue with parent native API compatibility",
]) {
  assert.doesNotMatch(handoff, new RegExp(stale), `handoff still contains stale marker: ${stale}`);
}

assert.match(
  handoff,
  /The remaining 17 partial rows are production\/external acceptance gates/,
);
assert.match(
  handoff,
  /Do not mark the restoration goal complete until `docs\/page-parity-matrix\.json` has zero partial rows/,
);
assert.match(
  handoff,
  /canonical production SQL\/media import and reconciliation/,
);

console.log("next Codex handoff contract assertions passed");
