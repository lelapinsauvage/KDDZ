import assert from "node:assert/strict";
import type { PortionSize } from "@/generated/prisma/client";
import {
  buildEmptyLegacyDailyPayload,
  mapLegacyDailyReport,
  mapLegacyDetailedDailyReport,
} from "@/lib/parent-daily-contract";

type DailyReportFixture = Parameters<typeof mapLegacyDailyReport>[0];

assert.deepEqual(buildEmptyLegacyDailyPayload(), [
  { name: "", status: false, count: 0 },
]);

const report: DailyReportFixture = {
  id: "modern-report-id",
  reportDate: new Date("2026-06-07T00:00:00.000Z"),
  status: "SUBMITTED",
  breakfastPortion: "LITTLE" as PortionSize,
  breakfastTime: new Date("1970-01-01T07:30:00.000Z"),
  lunchPortion: "ALL" as PortionSize,
  lunchTime: new Date("1970-01-01T12:15:00.000Z"),
  dessert: "Apple",
  dessertPortion: "HALF" as PortionSize,
  dessertTime: new Date("1970-01-01T15:05:00.000Z"),
  isSleep: true,
  sleepFrom: new Date("1970-01-01T13:00:00.000Z"),
  sleepTo: new Date("1970-01-01T14:00:00.000Z"),
  diarrhea: true,
  urinePotty: 1,
  stoolPotty: 2,
  urineDiaper: 3,
  stoolDiaper: 4,
  mood: "happy",
  cough: true,
  runnyNose: true,
  vomit: false,
  remarks: "ok",
  legacyData: {
    report_id: 42,
    breakf: "little",
    lunchf: "well",
    dess_portion: "2",
    diahria: "1",
  },
  breakfastFood: { name: "Eggs" },
  lunchFood: { name: "Rice" },
  fevers: [
    { temperature: "38.1", time: new Date("1970-01-01T09:00:00.000Z") },
    { temperature: "38.2", time: new Date("1970-01-01T10:00:00.000Z") },
    { temperature: "38.3", time: new Date("1970-01-01T11:00:00.000Z") },
    { temperature: "38.4", time: new Date("1970-01-01T12:00:00.000Z") },
    { temperature: "38.5", time: new Date("1970-01-01T13:00:00.000Z") },
  ],
  milks: [{ amountCc: 120, time: new Date("1970-01-01T16:30:00.000Z") }],
};

const simple = mapLegacyDailyReport(report);
assert.equal(simple.report_id, "42");
assert.equal(simple.status, "present");
assert.equal(simple.breakf, 2);
assert.equal(simple.lunchf, 4);
assert.equal(simple.diahria, "1");
assert.equal(simple["8"], "38.5");
assert.equal(simple["9"], "13:00");
assert.equal(simple.mcc, 120);
assert.equal(simple.mtime, "16:30");

const detailed = mapLegacyDetailedDailyReport(report, new Map([[5, "Syrup"]]));
for (const key of [
  "report_id",
  "reportdate",
  "status",
  "lname",
  "lntime",
  "bftime",
  "bname",
  "dessert",
  "desstime",
  "has_dess",
  "mood",
  "mood2",
  "ur_di",
  "ur_pot",
  "stool_di",
  "stool_pot",
  "diarrhea",
  "constipation",
  "sleep_from",
  "sleep_to",
  "sleep_from1",
  "sleep_to1",
  "sleep_from2",
  "sleep_to2",
  "is_sleep",
  "boxerchecked",
  "pantchecked",
  "shirtchecked",
  "sockschecked",
  "tshirthecked",
  "brushchecked",
  "towelchecked",
  "diaperschecked",
  "babybottlechecked",
  "milkchecked",
  "wipeschecked",
  "remarks",
  "vomit",
  "cough",
  "rnose",
]) {
  assert.notEqual(detailed[key], undefined, `${key} missing`);
}

assert.equal(detailed.report_id, "42");
assert.equal(detailed.status, "present");
assert.equal(typeof detailed.breakf, "number");
assert.equal(typeof detailed.lunchf, "number");
assert.equal(typeof detailed.dess_portion, "number");
assert.ok(Array.isArray(detailed.fever));
assert.ok(Array.isArray(detailed.milk));
assert.ok(Array.isArray(detailed.takenmeds_Arr));
assert.equal((detailed.fever as unknown[]).length, 5);
assert.equal((detailed.milk as Record<string, unknown>[])[0]?.mcc, "120");

console.log("parent daily legacy contract assertions passed");
