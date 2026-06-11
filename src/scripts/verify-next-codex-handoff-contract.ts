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
  "CRON_PARTIAL_ROW_COVERAGE_REPORT",
  "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT",
  "NATIVE_PARTIAL_ROW_COVERAGE_REPORT",
  "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT",
  "--generated-at=<release-generated-at-iso>",
  "--require-zero-partials",
  "`b593e4c chore: verify focused production artifacts`",
  "`60ef356 docs: guard focused partial report handoff`",
  "`4440183 chore: add focused production partial reports`",
  "`663bd0e chore: prove zero partial closeout summaries`",
  "`e378e55 chore: prove zero partial production closeout`",
  "`93d580f chore: allow zero partial consistency artifacts`",
  "`a57ce71 chore: require nature partial row coverage evidence`",
  "`5dde0d3 chore: require native partial row coverage evidence`",
  "`6eb8828 chore: require cron partial row coverage evidence`",
  "`58dc92b chore: require provider partial row coverage evidence`",
  "`dc56542 chore: require provider channel decision evidence`",
  "`14707cd chore: require reconciliation triage evidence`",
  "Focused Production Partial Reports",
  "verify focused production artifacts",
  "summary.gateFilter",
  "verify-production-artifact-consistency-contract.ts",
  "--gate=PROD-PROVIDERS",
  "--gate=PROD-NATIVE",
  "--gate=PROD-NATURE",
  "Zero-Partial Closeout Hardening",
  "Artifact consistency no longer hardcodes today's 17 partial rows",
  "--parity-matrix=<path>",
  "--partial-gate-map=<path>",
  "Production Evidence Timestamp Hardening",
  "closeout summary and evidence package manifest both carry `schemaVersion: 1`",
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
  "Recent pushed commits:\\n9973efc chore: surface package artifact timestamps",
  "Recent commits on `legacy-parity-runbook`:\\n\\n- `d4d2251 chore: version closeout summaries`",
  "18eb7ae chore: require explicit final closeout ref",
  "b60a5fd chore: require final closeout release ref",
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
