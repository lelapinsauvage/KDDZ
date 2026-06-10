import assert from "node:assert/strict";
import {
  buildLegacyFoodNameMap,
  dailyReportClothingFlags,
  dailyReportFoodLabel,
  dailyReportLegacyDataPatch,
  dailyReportNeedFlags,
  dailyReportSupplementalFields,
  legacyDailyFoodId,
  legacyDailyFoodName,
} from "@/lib/legacy-daily-report-fields";

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
  },
  {
    sourceDatabase: "garderie_2025",
    sourceTable: "t_daily_report",
    report_id: 42,
  },
) as Record<string, unknown>;

assert.equal(patch.sourceDatabase, "garderie_2025");
assert.equal(patch.sourceTable, "t_daily_report");
assert.equal(patch.report_id, 42);
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

console.log("legacy daily report field contract assertions passed");
