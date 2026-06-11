import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type PartialReport = {
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
  };
  rows?: Array<{
    row?: string;
    statusAnchor?: string;
    gates?: string[];
    closureReason?: string;
    matrixStatus?: string;
  }>;
};

const report = JSON.parse(
  execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }),
) as PartialReport;

const docs = {
  gateMap: readFileSync("docs/partial-production-gate-map.md", "utf8"),
  gates: readFileSync("docs/legacy-production-acceptance-gates.md", "utf8"),
  cron: readFileSync("docs/cron-notification-matrix.md", "utf8"),
  native: readFileSync("docs/native-acceptance-ledger.md", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
  handoff: readFileSync("docs/NEXT-CODEX-HANDOFF.md", "utf8"),
};

assert.equal(report.summary?.partialRows, 17);
assert.deepEqual(report.summary?.gates, [
  "PROD-CRON",
  "PROD-NATIVE",
  "PROD-NATURE",
  "PROD-PROVIDERS",
]);
assert.deepEqual(report.summary?.gateCounts, {
  "PROD-CRON": 9,
  "PROD-NATIVE": 3,
  "PROD-NATURE": 1,
  "PROD-PROVIDERS": 14,
});

const rows = report.rows ?? [];
assert.equal(rows.length, 17);

assertRowsForGate("PROD-CRON", [
  "legacy assessment alarms bridge",
  "legacy birthday alarms bridge",
  "legacy contract alarms bridge",
  "legacy event alarms bridge",
  "legacy insurance alarms bridge",
  "legacy medical alarms bridge",
  "legacy medicine alarms bridge",
  "legacy payment alarms bridge",
  "legacy vaccination alarms bridge",
]);

assertRowsForGate("PROD-PROVIDERS", [
  "legacy assessment alarms bridge",
  "legacy birthday alarms bridge",
  "legacy contract alarms bridge",
  "legacy insurance alarms bridge",
  "legacy medical alarms bridge",
  "legacy medicine alarms bridge",
  "legacy message alarms bridge",
  "legacy other alarms bridge",
  "legacy request alarms bridge",
  "legacy vaccination alarms bridge",
  "legacy bulk compose options",
  "legacy class child selection/admin fanout",
  "legacy direct compose/thread access",
  "parent PWA shell",
]);

assertRowsForGate("PROD-NATIVE", [
  "legacy direct compose/thread access",
  "legacy parent login contract",
  "parent PWA shell",
]);

assertRowsForGate("PROD-NATURE", ["parent PWA shell"]);

for (const marker of [
  "production crontab",
  "hosted scheduler",
  "birthday, assessment, insurance, vaccination, payment, event, and holiday generation",
  "contract alarm generation",
  "10-minute medication cycle",
  "external provider push/SMS/email execution",
]) {
  assertIncludes(docs.cron, marker, "cron matrix");
}

for (const marker of [
  "legacy-production-acceptance-gates.md",
  "Remaining native acceptance gates",
  "iOS build",
  "Android build",
  "real device push tokens",
  "SMS and WhatsApp flagged messages",
  "canonical production dump/import",
  "ordering/content still needs acceptance after the canonical production import",
]) {
  assertIncludes(docs.native, marker, "native acceptance ledger");
}

for (const marker of [
  "PRODUCTION_CRONTAB_EVIDENCE",
  "HOSTED_SCHEDULER_EVIDENCE",
  "PROVIDER_CHANNEL_ROLLOUT_REPORT",
  "PROVIDER_RESPONSE_ID_AUDIT_REPORT",
  "PUSH_DELIVERY_PROVIDER",
  "SMS_DELIVERY_PROVIDER",
  "WHATSAPP_DELIVERY_PROVIDER",
  "NATIVE_IOS_ACCEPTANCE_REPORT",
  "NATIVE_ANDROID_ACCEPTANCE_REPORT",
  "NATIVE_CRASH_PARSER_AUDIT_REPORT",
  "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT",
  "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT",
  "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT",
]) {
  assertIncludes(docs.gates, marker, "production gates");
}

for (const marker of [
  "PROD-CRON",
  "PROD-PROVIDERS",
  "PROD-NATIVE",
  "PROD-NATURE",
]) {
  assertIncludes(docs.gateMap, marker, "partial gate map");
  assertIncludes(docs.handoff, marker, "next handoff");
}

assert.match(docs.topGaps, /production provider credential\/native-device acceptance/);
assert.match(docs.topGaps, /dynamic `notifications_nature` ordering\/names\/active flags/);
assert.match(docs.handoff, /Continue from the remaining production\/external gates/);

console.log("production gate ledger contract assertions passed");

function assertRowsForGate(gate: string, expectedAnchors: string[]) {
  const actualAnchors = rows
    .filter((row) => row.gates?.includes(gate))
    .map((row) => row.statusAnchor);

  assert.deepEqual(actualAnchors, expectedAnchors, `${gate} partial rows drifted`);

  for (const anchor of expectedAnchors) {
    const row = rows.find((item) => item.statusAnchor === anchor);
    assert.ok(row, `${gate} is missing ${anchor}`);
    assert.match(row.matrixStatus ?? "", new RegExp(escapeRegExp(anchor), "i"));
    assert.ok(row.closureReason, `${gate} ${anchor} is missing closure reason`);
  }
}

function assertIncludes(text: string, marker: string, label: string) {
  assert.ok(text.includes(marker), `${label} missing marker: ${marker}`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
