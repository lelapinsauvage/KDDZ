import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildLegacyFoodNameMap,
  dailyReportClothingFlags,
  dailyReportFoodLabel,
  dailyReportLegacyDataPatch,
  dailyReportLegacyProgress,
  dailyReportLegacyWorkflowPatch,
  dailyReportNeedFlags,
  dailyReportSupplementalFields,
  legacyDailyFoodId,
  legacyDailyFoodName,
} from "@/lib/legacy-daily-report-fields";

const dashboardPage = readFileSync(
  "src/app/(app)/children/[id]/dashboard/page.tsx",
  "utf8",
);
const childReportPage = readFileSync(
  "src/app/(app)/children/[id]/report/page.tsx",
  "utf8",
);
const dailyDetailPage = readFileSync(
  "src/app/(app)/daily-reports/[id]/page.tsx",
  "utf8",
);
const dailyPrintPage = readFileSync(
  "src/app/(app)/daily-reports/[id]/print/page.tsx",
  "utf8",
);
const dailyReportForm = readFileSync(
  "src/components/daily-reports/daily-report-form.tsx",
  "utf8",
);
const legacyDailyReportFields = readFileSync(
  "src/lib/legacy-daily-report-fields.ts",
  "utf8",
);

const foodNames = buildLegacyFoodNameMap([
  {
    legacyId: 8,
    sourceDatabase: "garderie_2024",
    name: "Labneh",
  },
  {
    legacyId: 8,
    sourceDatabase: "garderie_2025",
    name: "Manoushe",
  },
  {
    legacyId: 9,
    sourceDatabase: null,
    name: "Rice",
  },
]);

assert.equal(
  legacyDailyFoodName(
    { sourceDatabase: "garderie_2025", breakfast_id: "8" },
    "breakfast_id",
    foodNames,
  ),
  "Manoushe",
);
assert.equal(
  legacyDailyFoodName({ lunch_id: "9" }, "lunch_id", foodNames),
  "Rice",
);
assert.equal(legacyDailyFoodId({ breakfast_id: "0" }, "breakfast_id"), null);
assert.equal(
  dailyReportFoodLabel({
    relatedName: "First-class food",
    legacyData: { sourceDatabase: "garderie_2025", breakfast_id: "8" },
    legacyIdKey: "breakfast_id",
    legacyFoodNames: foodNames,
  }),
  "First-class food",
);
assert.equal(
  dailyReportFoodLabel({
    relatedName: null,
    legacyData: { sourceDatabase: "missing", breakfast_id: "77" },
    legacyIdKey: "breakfast_id",
    legacyFoodNames: foodNames,
  }),
  "Food #77",
);

assert.deepEqual(
  dailyReportClothingFlags({
    pantchecked: "1",
    shirtchecked: "0",
    clothesSweater: true,
    tshirthecked: "true",
    boxerchecked: 1,
    sockschecked: "checked",
  }),
  {
    clothesPants: true,
    clothesShirt: true,
    clothesSweater: true,
    clothesTshirt: true,
    clothesUnderwear: true,
    clothesSocks: true,
  },
);

assert.deepEqual(
  dailyReportNeedFlags({
    constipation: "1",
    wipeschecked: "checked",
    brushchecked: 1,
    towelchecked: "true",
    diaperschecked: "yes",
    babybottlechecked: "on",
    milkchecked: "0",
  }),
  {
    constipation: true,
    needsWipes: true,
    needsBrush: true,
    needsTowel: true,
    needsDiapers: true,
    needsBabyBottle: true,
    needsMilk: false,
  },
);

assert.deepEqual(
  dailyReportSupplementalFields({
    earlyDinnerFoodId: "modern-food-id",
    lunch_id2: "88",
    lunchf2: "half",
    lntime2: "16:20",
    mood2: "neutral",
    sleep_from1: "12:30",
    sleep_to1: "13:00",
    sleep_from2: "14:10",
    sleep_to2: "14:40",
  }),
  {
    earlyDinnerFoodId: "modern-food-id",
    earlyDinnerPortion: "half",
    earlyDinnerTime: "16:20",
    moodNoon: "neutral",
    secondSleepFrom: "12:30",
    secondSleepTo: "13:00",
    thirdSleepFrom: "14:10",
    thirdSleepTo: "14:40",
  },
);

assert.deepEqual(
  dailyReportSupplementalFields({
    lunch_id2: "88",
    lunchf2: "bad-value",
    mood2: "bad-value",
  }),
  {
    earlyDinnerFoodId: "88",
    earlyDinnerPortion: undefined,
    earlyDinnerTime: "",
    moodNoon: undefined,
    secondSleepFrom: "",
    secondSleepTo: "",
    thirdSleepFrom: "",
    thirdSleepTo: "",
  },
);

const patch = dailyReportLegacyDataPatch(
  {
    attendanceMode: "PRESENT",
    reportDate: "2026-06-10",
    breakfastFoodId: "breakfast-food-id",
    breakfastPortion: "ALL",
    breakfastTime: "08:15",
    lunchFoodId: "lunch-food-id",
    lunchPortion: "HALF",
    lunchTime: "12:05",
    dessert: "Pudding",
    dessertPortion: "LITTLE",
    dessertTime: "13:00",
    isSleep: true,
    sleepFrom: "11:45",
    sleepTo: "12:10",
    mood: "FUSSY",
    earlyDinnerFoodId: "modern-food-id",
    earlyDinnerLegacyId: "88",
    earlyDinnerPortion: "little",
    earlyDinnerTime: "16:30",
    moodNoon: "happy",
    secondSleepFrom: "12:15",
    secondSleepTo: "12:45",
    thirdSleepFrom: "14:00",
    thirdSleepTo: "14:20",
    clothesPants: true,
    clothesSweater: false,
    clothesTshirt: true,
    clothesUnderwear: false,
    clothesSocks: true,
    constipation: true,
    needsWipes: true,
    needsBrush: false,
    needsTowel: true,
    needsDiapers: false,
    needsBabyBottle: true,
    needsMilk: false,
    applyFoodForAll: true,
    absentReason: "",
    absentFrom: "",
    absentTo: "",
    hospitalAttend: false,
  },
  {
    sourceDatabase: "garderie_2025",
    sourceTable: "t_daily_report",
    report_id: 42,
  },
  { workflowStatus: "DRAFT" },
) as Record<string, unknown>;

assert.equal(patch.sourceDatabase, "garderie_2025");
assert.equal(patch.sourceTable, "t_daily_report");
assert.equal(patch.report_id, 42);
assert.equal(patch.status, "present");
assert.equal(patch.reportdate, "2026-06-10");
assert.equal(patch.breakf, "well");
assert.equal(patch.lunchf, "half");
assert.equal(patch.dessert, "Pudding");
assert.equal(patch.dess_portion, "little");
assert.equal(patch.desstime, "13:00");
assert.equal(patch.has_dess, "1");
assert.equal(patch.is_sleep, "1");
assert.equal(patch.sleep_from, "11:45");
assert.equal(patch.sleep_to, "12:10");
assert.equal(patch.food_for_all, "1");
assert.equal(patch.d_progress_all, 100);
assert.equal(patch.is_rep_draft, "1");
assert.equal(patch.mood, "sad");
assert.equal(patch.earlyDinnerFoodId, "modern-food-id");
assert.equal(patch.lunch_id2, "88");
assert.equal(patch.lunchf2, "little");
assert.equal(patch.lntime2, "16:30");
assert.equal(patch.mood2, "happy");
assert.equal(patch.sleep_from1, "12:15");
assert.equal(patch.sleep_to1, "12:45");
assert.equal(patch.sleep_from2, "14:00");
assert.equal(patch.sleep_to2, "14:20");
assert.equal(patch.clothesPants, true);
assert.equal(patch.clothesShirt, false);
assert.equal(patch.clothesSweater, false);
assert.equal(patch.pantchecked, "1");
assert.equal(patch.shirtchecked, "0");
assert.equal(patch.tshirthecked, "1");
assert.equal(patch.boxerchecked, "0");
assert.equal(patch.sockschecked, "1");
assert.equal(patch.constipation, "1");
assert.equal(patch.wipeschecked, "1");
assert.equal(patch.brushchecked, "0");
assert.equal(patch.towelchecked, "1");
assert.equal(patch.diaperschecked, "0");
assert.equal(patch.babybottlechecked, "1");
assert.equal(patch.milkchecked, "0");

assert.equal(
  dailyReportLegacyProgress({
    attendanceMode: "PRESENT",
    breakfastFoodId: "",
    breakfastPortion: "ALL",
    breakfastTime: "",
    lunchFoodId: "lunch-food-id",
    lunchPortion: "NONE",
    lunchTime: "",
    dessert: "",
    dessertPortion: undefined,
    dessertTime: "",
    isSleep: true,
    sleepFrom: "",
    sleepTo: "12:10",
  }),
  50,
);

assert.equal(
  dailyReportLegacyProgress({
    attendanceMode: "ABSENT",
    breakfastFoodId: "",
    breakfastPortion: undefined,
    breakfastTime: "",
    lunchFoodId: "",
    lunchPortion: undefined,
    lunchTime: "",
    dessert: "",
    dessertPortion: undefined,
    dessertTime: "",
    isSleep: false,
    sleepFrom: "",
    sleepTo: "",
  }),
  100,
);

const submittedPatch = dailyReportLegacyWorkflowPatch("SUBMITTED", patch) as Record<
  string,
  unknown
>;
assert.equal(submittedPatch.is_rep_draft, "0");
assert.equal(submittedPatch.report_id, 42);

for (const page of [
  dashboardPage,
  childReportPage,
  dailyDetailPage,
  dailyPrintPage,
]) {
  assert.match(page, /dailyReportFoodLabel/);
  assert.match(page, /loadLegacyDailyReportFoodNames/);
  assert.match(page, /legacyIdKey: "breakfast_id"/);
  assert.match(page, /legacyIdKey: "lunch_id"/);
}

assert.match(dashboardPage, /recentReportsRaw\.map\(\(report\) => report\.legacyData\)/);
assert.match(dashboardPage, /legacyDailyRecord\(r\.legacyData\)/);
assert.match(dashboardPage, /legacyDailyText\(legacy\.dessert\)/);

for (const legacyFormSurface of [
  "ATTENDANCE STATUS",
  "Breakfast",
  "Lunch",
  "Early Dinner",
  "Dessert",
  "Milk Intake",
  "Second Nap",
  "Third Nap",
  "Constipation",
  "Daily Needs",
  "Wipes",
  "Brush",
  "Towel",
  "Diapers",
  "Baby Bottle",
  "Attachments",
  "Save as Draft",
  "Submit Report",
]) {
  assert.match(dailyReportForm, new RegExp(legacyFormSurface, "i"));
}

for (const legacyFieldKey of [
  "lunch_id2",
  "lunchf2",
  "lntime2",
  "sleep_from1",
  "sleep_to1",
  "sleep_from2",
  "sleep_to2",
  "mood2",
  "constipation",
  "wipeschecked",
  "brushchecked",
  "towelchecked",
  "diaperschecked",
  "babybottlechecked",
  "milkchecked",
]) {
  assert.match(legacyDailyReportFields, new RegExp(legacyFieldKey));
}

console.log("legacy daily report field contract assertions passed");
