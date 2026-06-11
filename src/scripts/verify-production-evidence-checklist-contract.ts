import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const script = "src/scripts/report-production-evidence-checklist.ts";

const jsonOutput = execFileSync("pnpm", ["tsx", script, "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

const payload = JSON.parse(jsonOutput) as {
  status?: string;
  summary?: { gates?: number; requiredFields?: number; blockingPartialRows?: number };
  gates?: Array<{ gate?: string; requiredFields?: string[]; blockingPartialRows?: Array<{ row?: string }> }>;
};

assert.equal(payload.status, "production evidence checklist");
assert.equal(payload.summary?.gates, 12);
assert.equal(payload.summary?.requiredFields, 69);
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
assert.match(markdownOutput, /## PROD-NATIVE/);
assert.match(markdownOutput, /iOS build tested against `master.php`/);
assert.match(markdownOutput, /P17/);

const unknownGate = spawnSync("pnpm", ["tsx", script, "--gate=PROD-UNKNOWN"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(unknownGate.status, 2);
assert.match(unknownGate.stderr, /Unknown production gate: PROD-UNKNOWN/);

console.log("production evidence checklist contract assertions passed");
