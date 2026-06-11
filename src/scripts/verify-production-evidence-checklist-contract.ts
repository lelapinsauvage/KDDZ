import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const script = "src/scripts/report-production-evidence-checklist.ts";

const jsonOutput = execFileSync("pnpm", ["tsx", script, "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

const payload = JSON.parse(jsonOutput) as {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  summary?: { gates?: number; requiredFields?: number; blockingPartialRows?: number };
  gates?: Array<{ gate?: string; requiredFields?: string[]; blockingPartialRows?: Array<{ row?: string }> }>;
};

assert.equal(payload.status, "production evidence checklist");
assert.equal(payload.schemaVersion, 1);
assertValidIsoTimestamp(payload.generatedAt, "evidence checklist generatedAt");
assert.equal(payload.summary?.gates, 12);
assert.equal(payload.summary?.requiredFields, 70);
assert.equal(payload.summary?.blockingPartialRows, 17);
assert.equal(payload.gates?.length, 12);
assert.equal(payload.gates?.[0]?.gate, "PROD-DUMPS");
assert.equal(payload.gates?.[11]?.gate, "PROD-BACKFILL");

const providerGate = payload.gates?.find((gate) => gate.gate === "PROD-PROVIDERS");
assert.ok(providerGate);
assert.deepEqual(providerGate.requiredFields, [
  "Push provider configured",
  "Email provider configured",
  "SMS provider configured",
  "WhatsApp provider configured",
  "Test families sent",
  "Sent/skipped/failed counts recorded",
  "Provider response ids recorded without secrets",
  "Provider partial row coverage reviewed",
]);
assert.equal(providerGate.blockingPartialRows?.length, 14);
assert.equal(providerGate.blockingPartialRows?.[0]?.row, "P01");
assert.equal(providerGate.blockingPartialRows?.[13]?.row, "P17");

const cronOutput = execFileSync("pnpm", ["tsx", script, "--json", "--gate=PROD-CRON"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const cronPayload = JSON.parse(cronOutput) as typeof payload;
assert.equal(cronPayload.summary?.gates, 1);
assert.equal(cronPayload.summary?.requiredFields, 7);
assert.equal(cronPayload.summary?.blockingPartialRows, 9);
assert.equal(cronPayload.gates?.[0]?.gate, "PROD-CRON");

const markdownOutput = execFileSync("pnpm", ["tsx", script, "--gate=PROD-NATIVE"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.match(markdownOutput, /Production Evidence Checklist/);
assert.match(markdownOutput, /Generated at: \d{4}-\d{2}-\d{2}T/);
assert.match(markdownOutput, /## PROD-NATIVE/);
assert.match(markdownOutput, /iOS build tested against `master.php`/);
assert.match(markdownOutput, /P17/);

const frozenOutput = execFileSync("pnpm", ["tsx", script, "--json", "--generated-at=2026-06-10T00:00:00.000Z"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const frozenPayload = JSON.parse(frozenOutput) as typeof payload;
assert.equal(frozenPayload.generatedAt, "2026-06-10T00:00:00.000Z");

const invalidGeneratedAt = spawnSync("pnpm", ["tsx", script, "--json", "--generated-at=not-a-date"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(invalidGeneratedAt.status, 2);
assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);

const unknownGate = spawnSync("pnpm", ["tsx", script, "--gate=PROD-UNKNOWN"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(unknownGate.status, 2);
assert.match(unknownGate.stderr, /Unknown production gate: PROD-UNKNOWN/);

console.log("production evidence checklist contract assertions passed");

function assertValidIsoTimestamp(value: string | undefined, label: string) {
  assert.ok(value, `${label} is missing`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be an ISO timestamp`);
}
