import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const script = "src/scripts/report-production-partials.ts";

const jsonOutput = execFileSync("pnpm", ["tsx", script, "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

const payload = JSON.parse(jsonOutput) as {
  status?: string;
  summary?: { partialRows?: number; gates?: string[]; gateCounts?: Record<string, number> };
  rows?: Array<{ row?: string; gates?: string[]; matrixStatus?: string; closureReason?: string }>;
};

assert.equal(payload.status, "production partial gate report");
assert.equal(payload.summary?.partialRows, 17);
assert.deepEqual(payload.summary?.gates, ["PROD-CRON", "PROD-NATIVE", "PROD-NATURE", "PROD-PROVIDERS"]);
assert.deepEqual(payload.summary?.gateCounts, {
  "PROD-CRON": 9,
  "PROD-NATIVE": 3,
  "PROD-NATURE": 1,
  "PROD-PROVIDERS": 14,
});
assert.equal(payload.rows?.length, 17);
assert.equal(payload.rows?.[0]?.row, "P01");
assert.equal(payload.rows?.[16]?.row, "P17");
assert.match(payload.rows?.[0]?.matrixStatus ?? "", /legacy assessment alarms bridge/);
assert.match(payload.rows?.[16]?.matrixStatus ?? "", /parent PWA shell/);
assert.ok(payload.rows?.every((row) => row.gates?.length), "every partial row must list production gates");
assert.ok(payload.rows?.every((row) => row.closureReason), "every partial row must include a closure reason");

const markdownOutput = execFileSync("pnpm", ["tsx", script], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.match(markdownOutput, /Production Partial Gate Report/);
assert.match(markdownOutput, /Partial rows: 17/);
assert.match(markdownOutput, /\| PROD-PROVIDERS \| 14 \|/);
assert.match(markdownOutput, /P17/);

console.log("production partial report contract assertions passed");
