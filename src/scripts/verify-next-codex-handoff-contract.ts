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
  "`9b2db15 chore: bind preflight manifest in acceptance evidence`",
  "`7bbcffc docs: refresh production closure handoff`",
  "`ee2b8ce chore: summarize blocking gates in preflight manifest`",
  "`378a1ae chore: add gate status next actions`",
  "`f786c73 chore: derive closeout summary tracker`",
  "`7c3c7d2 chore: derive closeout blocker summaries`",
  "`e0911c8 chore: derive gate ledger blocker counts`",
  "`b3ac002 chore: derive evidence checklist blocker rows`",
  "`3ece949 chore: derive gate status blocker counts`",
  "`f3b1477 chore: derive preflight contract blocker counts`",
  "pnpm tsx src/scripts/report-production-partials.ts --json",
  "pnpm tsx src/scripts/report-production-evidence-checklist.ts --json",
  "pnpm tsx src/scripts/render-production-readiness-env-template.ts --out=/secure/private-readiness.env",
  "pnpm tsx src/scripts/report-production-gate-status.ts --json --blocking-only --out=/tmp/kiddzonl-production-blocking-gate-status.json --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=/tmp/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/verify-production-preflight-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json",
  "pnpm run verify:production-gates",
  "`8557360 chore: verify production preflight manifests`",
  "`388567c chore: generate production preflight artifacts`",
  "`fc63539 chore: focus production gate status on blockers`",
  "`f200c9e chore: generate production readiness env template`",
  "`da487a0 chore: render production acceptance evidence`",
  "`1b5f27c chore: gate production status on readiness`",
  "`d9690f9 chore: add production gate status report`",
  "`16a6e11 docs: refresh focused artifact handoff`",
  "CRON_PARTIAL_ROW_COVERAGE_REPORT",
  "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT",
  "NATIVE_PARTIAL_ROW_COVERAGE_REPORT",
  "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT",
  "--generated-at=<release-generated-at-iso>",
  "--require-zero-partials",
  "`317b06e chore: verify focused production artifact manifests`",
  "`df68947 chore: generate focused production artifact bundle`",
  "`63db45e docs: require focused gate artifact pairs`",
  "`1d33c58 chore: verify all focused production artifacts`",
  "`f60d416 docs: refresh focused artifact handoff`",
  "`b593e4c chore: verify focused production artifacts`",
  "`60ef356 docs: guard focused partial report handoff`",
  "`4440183 chore: add focused production partial reports`",
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
  "consistency verifier also requires both artifacts to name the same gate-map source path",
  "verify-production-focused-artifacts-contract.ts",
  "verify-production-focused-artifacts-manifest-contract.ts",
  "saved-manifest verification now also requires every nested focused partial/checklist artifact to match the manifest timestamp, source matrix/gate-map paths, and gate filter",
  "report-production-focused-artifacts.ts --out-dir=<dir>",
  "verify-production-focused-artifacts-manifest.ts --manifest=<path>",
  "kiddzonl-production-focused-artifacts.json",
  "kiddzonl-production-preflight-artifacts",
  "pnpm tsx src/scripts/report-production-focused-artifacts.ts --out-dir=/tmp/kiddzonl-production-focused-artifacts --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/verify-production-focused-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-focused-artifacts/kiddzonl-production-focused-artifacts.json",
  "pnpm tsx src/scripts/render-production-acceptance-evidence-record.ts --out=/secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --acceptance-date=<YYYY-MM-DD>",
  "pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials",
  "pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials",
  "pnpm tsx src/scripts/report-production-gate-status.ts --json --env-file=/secure/private-readiness.env --out=/tmp/kiddzonl-production-gate-status.json --generated-at=<release-generated-at-iso> --require-ready",
  "--gate=PROD-PROVIDERS",
  "--gate=PROD-NATIVE",
  "--gate=PROD-NATURE",
  "Zero-Partial Closeout Hardening",
  "Artifact consistency no longer hardcodes today's 17 partial rows",
  "production gate suite also derives its tracker assertion from `report-production-partials.ts --json`",
  "--parity-matrix=<path>",
  "--partial-gate-map=<path>",
  "Production Evidence Timestamp Hardening",
  "closeout summary and evidence package manifest both carry `schemaVersion: 1`",
  "Package verification requires the closeout summary, readiness report, partial report, evidence checklist, and preflight manifest to share that same package `generatedAt`",
  "closeout plus evidence package contracts reject archived partial/checklist/preflight artifacts or saved package manifests whose source provenance drifts from the closeout",
  "Production Acceptance Closure",
  "Production Preflight Bundle",
  "report-production-gate-status.ts --require-ready",
  "--require-no-blockers",
  "sourceAlignment.status=verified",
  "report-production-gate-status.ts --blocking-only",
  "redacted `nextActions`",
  "focused partial/checklist archive commands",
  "report-production-preflight-artifacts.ts --out-dir=<dir>",
  "verify-production-preflight-artifacts-manifest.ts --manifest=<path>",
  "top-level `blockingGateSummary`",
  "rejects drift between `blockingGateSummary` and the nested blocker-only gate-status report",
  "preflight verifier now requires the blocker-status report plus nested focused manifest to match those recorded source paths",
  "requires the blocker-status report to retain `sourceAlignment.status=verified`",
  "all bundled JSON artifacts to share the preflight `generatedAt`",
  "render-production-acceptance-evidence-record.ts",
  "computes readiness, partial, checklist, and preflight manifest SHA-256 values",
  "The acceptance verifier can now require `--preflight-manifest=<path>` and `--preflight-digest=<sha256>`",
  "records that the closeout summary hash is verified in the evidence package manifest",
  "verify-production-gate-status-contract.ts",
  "verify-production-acceptance-evidence-renderer-contract.ts",
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
