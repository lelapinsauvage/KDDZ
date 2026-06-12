import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type ParityRow = {
  status?: string;
};

type PartialReport = {
  summary?: {
    partialRows?: number;
  };
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
const partialReport = JSON.parse(
  execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }),
) as PartialReport;
const totalRows = matrix.length;
const partialRowCount = partialReport.summary?.partialRows ?? partialRows.length;
const completeRowCount = totalRows - partialRowCount;
const donePct = Math.round((completeRowCount / totalRows) * 1000) / 10;
const leftPct = Math.round((100 - donePct) * 10) / 10;

assert.equal(completeRows.length, completeRowCount, "handoff complete count must match current production partial report");
assert.equal(partialRows.length, partialRowCount, "handoff partial count must match current production partial report");

for (const expected of [
  `Total matrix rows: \`${totalRows}\``,
  `Complete rows: \`${completeRowCount}\``,
  `Partial rows: \`${partialRowCount}\``,
  `Current tracker: \`${formatPercent(donePct)}% done / ${formatPercent(leftPct)}% left\``,
  "`PROD-CRON`, `PROD-NATIVE`, `PROD-NATURE`, and `PROD-PROVIDERS`",
  "`d01bddd test: guard production gate row coverage labels`",
  "`109c237 docs: narrow provider gate row coverage`",
  "`7d0bf44 chore: guard preflight artifact source alignment`",
  "`0a5c2d4 chore: derive focused artifact blocking rows`",
  "`33a6932 docs: refresh top gaps acceptance framing`",
  "`5016930 docs: tighten native acceptance boundary`",
  "`8718d1f docs: close general alarm read-state wording`",
  "`b40bfe3 docs: require preflight manifest in summary verification`",
  "`3ccf0cb chore: expose production gate closure links`",
  "`1c37842 chore: bind preflight manifest in evidence package`",
  "`4a1745b chore: bind preflight manifest in closeout`",
  "`ad7d3ac docs: refresh production closure handoff`",
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
  "pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=PROD-CRON",
  "pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=PROD-PROVIDERS",
  "pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=PROD-NATIVE",
  "pnpm tsx src/scripts/render-production-readiness-env-template.ts --gate=PROD-NATURE",
  "pnpm tsx src/scripts/report-production-gate-status.ts --json --blocking-only --out=/tmp/kiddzonl-production-blocking-gate-status.json --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/report-production-closeout-plan.ts --json --out=/tmp/kiddzonl-production-closeout-plan.json --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=/tmp/kiddzonl-production-preflight-artifacts --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/verify-production-preflight-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json",
  "pnpm run verify:production-gates",
  "`e605cdf docs: cover focused readiness templates`",
  "`7deab7d docs: document partial report provenance`",
  "`6b1fba4 chore: expose partial report source provenance`",
  "`33899e2 chore: expose checklist source provenance`",
  "`8557360 chore: verify production preflight manifests`",
  "`388567c chore: generate production preflight artifacts`",
  "`06aa0df chore: preserve preflight closeout summary`",
  "including `blockingGateLinks`, `closeoutMode`, and `canCloseLocally`",
  "`fc63539 chore: focus production gate status on blockers`",
  "`f200c9e chore: generate production readiness env template`",
  "`cacf7ef chore: fail zero-partial closeout early`",
  "fails immediately after generating and consistency-checking the partial/checklist artifacts when `--require-zero-partials` sees unresolved partial rows, before validating the final acceptance record",
  "17 unique blocking partial rows, 27 blocking gate links",
  "`closeoutMode: \"external-production-evidence\"`",
  "`canCloseLocally: false`",
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
  "consistency verifier also requires both artifacts to name the same gate-map and production-gates source paths",
  "verify-production-focused-artifacts-contract.ts",
  "verify-production-focused-artifacts-manifest-contract.ts",
  "saved-manifest verification now also requires every nested focused partial/checklist artifact to match the manifest timestamp, source matrix/gate-map/production-gates paths, and gate filter",
  "report-production-focused-artifacts.ts --out-dir=<dir>",
  "verify-production-focused-artifacts-manifest.ts --manifest=<path>",
  "kiddzonl-production-focused-artifacts.json",
  "kiddzonl-production-preflight-artifacts",
  "pnpm tsx src/scripts/report-production-focused-artifacts.ts --out-dir=/tmp/kiddzonl-production-focused-artifacts --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/verify-production-focused-artifacts-manifest.ts --manifest=/tmp/kiddzonl-production-focused-artifacts/kiddzonl-production-focused-artifacts.json",
  "pnpm tsx src/scripts/report-production-closeout-plan.ts --json --out=/tmp/kiddzonl-production-closeout-plan.json --generated-at=<release-generated-at-iso>",
  "pnpm tsx src/scripts/render-production-acceptance-evidence-record.ts --out=/secure/production-acceptance-evidence.md --readiness-report=/tmp/kiddzonl-production-readiness.json --summary-report=/tmp/kiddzonl-production-closeout-summary.json --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --acceptance-date=<YYYY-MM-DD>",
  "pnpm run closeout:production -- --env-file=/secure/private-readiness.env --evidence-record=/secure/production-acceptance-evidence.md --out=/tmp/kiddzonl-production-readiness.json --summary-out=/tmp/kiddzonl-production-closeout-summary.json --partials-out=/tmp/kiddzonl-production-partials.json --checklist-out=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --generated-at=<release-generated-at-iso> --require-zero-partials",
  "pnpm tsx src/scripts/verify-production-closeout-summary-contract.ts /tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials",
  "pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest-out=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials",
  "pnpm tsx src/scripts/verify-production-evidence-package-contract.ts --summary-report=/tmp/kiddzonl-production-closeout-summary.json --readiness-report=/tmp/kiddzonl-production-readiness.json --evidence-record=/secure/production-acceptance-evidence.md --partial-report=/tmp/kiddzonl-production-partials.json --checklist-report=/tmp/kiddzonl-production-evidence-checklist.json --preflight-manifest=/tmp/kiddzonl-production-preflight-artifacts/kiddzonl-production-preflight-artifacts.json --manifest=/tmp/kiddzonl-production-evidence-package.json --branch=legacy-parity-runbook --commit=<release-commit-sha> --require-zero-partials",
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
  "source matrix/gate-map/production-gates paths",
  "closeout plus evidence package contracts reject archived partial/checklist/preflight artifacts or saved package manifests whose source provenance drifts from the closeout",
  "markdown partial report now prints source matrix, partial gate map, and production-gates paths",
  "markdown evidence checklist now prints its evidence spec, template, partial gate map, and production-gates paths",
  "emits source matrix/gate-map/production-gates paths as markdown or redacted JSON",
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
  "Closeout, closeout-summary verification, and evidence-package verification now all carry the same archived `--preflight-manifest=<path>` and digest",
  "The acceptance verifier can require `--preflight-manifest=<path>` and `--preflight-digest=<sha256>`",
  "focused readiness env templates for all four remaining blocking gates",
  "verify-production-readiness-env-template-contract.ts` now proves the native and notification-nature focused templates",
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
  new RegExp(`The remaining ${partialRowCount} partial rows are production/external acceptance gates`),
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

function formatPercent(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
