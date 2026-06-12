import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const script = "src/scripts/report-production-partials.ts";

const jsonOutput = execFileSync("pnpm", ["tsx", script, "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

const payload = JSON.parse(jsonOutput) as {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  summary?: { partialRows?: number; gates?: string[]; gateCounts?: Record<string, number> };
  rows?: Array<{ row?: string; gates?: string[]; matrixStatus?: string; closureReason?: string }>;
};

assert.equal(payload.status, "production partial gate report");
assert.equal(payload.schemaVersion, 1);
assertValidIsoTimestamp(payload.generatedAt, "partial report generatedAt");
const rows = payload.rows ?? [];
const expectedGateCounts = gateCounts(rows);
assert.equal(payload.summary?.partialRows, rows.length);
assert.deepEqual(payload.summary?.gates, Object.keys(expectedGateCounts));
assert.deepEqual(payload.summary?.gateCounts, expectedGateCounts);
assert.deepEqual(rowsForGate("PROD-CRON"), ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"]);
assert.deepEqual(rowsForGate("PROD-PROVIDERS"), [
  "P01",
  "P02",
  "P03",
  "P05",
  "P06",
  "P07",
  "P08",
  "P09",
  "P11",
  "P12",
  "P13",
  "P14",
  "P15",
  "P17",
]);
assert.deepEqual(rowsForGate("PROD-NATIVE"), ["P15", "P16", "P17"]);
assert.deepEqual(rowsForGate("PROD-NATURE"), ["P17"]);
assert.ok(rows.length > 0, "live production partial report should currently list unresolved rows");
assert.equal(payload.rows?.[0]?.row, "P01");
assert.equal(payload.rows?.at(-1)?.row, `P${String(rows.length).padStart(2, "0")}`);
assert.match(payload.rows?.[0]?.matrixStatus ?? "", /legacy assessment alarms bridge/);
assert.match(payload.rows?.at(-1)?.matrixStatus ?? "", /parent PWA shell/);
assert.ok(payload.rows?.every((row) => row.gates?.length), "every partial row must list production gates");
assert.ok(payload.rows?.every((row) => row.closureReason), "every partial row must include a closure reason");

const markdownOutput = execFileSync("pnpm", ["tsx", script], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.match(markdownOutput, /Production Partial Gate Report/);
assert.match(markdownOutput, /Generated at: \d{4}-\d{2}-\d{2}T/);
assert.match(markdownOutput, new RegExp(`Partial rows: ${rows.length}`));
for (const [gate, count] of Object.entries(expectedGateCounts)) {
  assert.match(markdownOutput, new RegExp(`\\| ${escapeRegExp(gate)} \\| ${count} \\|`));
}
assert.match(markdownOutput, new RegExp(`P${String(rows.length).padStart(2, "0")}`));

const frozenOutput = execFileSync("pnpm", ["tsx", script, "--json", "--generated-at=2026-06-10T00:00:00.000Z"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const frozenPayload = JSON.parse(frozenOutput) as typeof payload;
assert.equal(frozenPayload.generatedAt, "2026-06-10T00:00:00.000Z");

const cronOutput = execFileSync("pnpm", ["tsx", script, "--json", "--gate=PROD-CRON", "--generated-at=2026-06-10T00:00:00.000Z"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const cronPayload = JSON.parse(cronOutput) as typeof payload & {
  summary?: typeof payload.summary & { gateFilter?: string };
};
assert.equal(cronPayload.generatedAt, "2026-06-10T00:00:00.000Z");
const cronRows = rows.filter((row) => row.gates?.includes("PROD-CRON"));
assert.equal(cronPayload.summary?.partialRows, cronRows.length);
assert.equal(cronPayload.summary?.gateFilter, "PROD-CRON");
assert.deepEqual(cronPayload.summary?.gateCounts, gateCounts(cronRows));
assert.equal(cronPayload.rows?.length, cronRows.length);
assert.ok(cronPayload.rows?.every((row) => row.gates?.includes("PROD-CRON")), "focused report must only include selected-gate rows");
assert.equal(cronPayload.rows?.[0]?.row, cronRows[0]?.row);
assert.equal(cronPayload.rows?.at(-1)?.row, cronRows.at(-1)?.row);

const nativeMarkdown = execFileSync("pnpm", ["tsx", script, "--gate=PROD-NATIVE", "--generated-at=2026-06-10T00:00:00.000Z"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const nativeRows = rows.filter((row) => row.gates?.includes("PROD-NATIVE"));
assert.match(nativeMarkdown, new RegExp(`Partial rows: ${nativeRows.length}`));
assert.match(nativeMarkdown, new RegExp(`\\| PROD-NATIVE \\| ${nativeRows.length} \\|`));
assert.doesNotMatch(nativeMarkdown, /P01/);
assert.match(nativeMarkdown, new RegExp(nativeRows[0]?.row ?? "P15"));
assert.match(nativeMarkdown, new RegExp(nativeRows.at(-1)?.row ?? "P17"));

const invalidGate = spawnSync("pnpm", ["tsx", script, "--json", "--gate=PROD-UNKNOWN"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(invalidGate.status, 2);
assert.match(invalidGate.stderr, /Unknown production gate or no mapped partial rows/);

const invalidGeneratedAt = spawnSync("pnpm", ["tsx", script, "--json", "--generated-at=not-a-date"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(invalidGeneratedAt.status, 2);
assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);

console.log("production partial report contract assertions passed");

function assertValidIsoTimestamp(value: string | undefined, label: string) {
  assert.ok(value, `${label} is missing`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be an ISO timestamp`);
}

function gateCounts(rows: Array<{ gates?: string[] }>) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const gate of row.gates ?? []) {
      counts[gate] = (counts[gate] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function rowsForGate(gate: string) {
  return rows
    .filter((row) => row.gates?.includes(gate))
    .map((row) => row.row)
    .filter((row): row is string => typeof row === "string");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
