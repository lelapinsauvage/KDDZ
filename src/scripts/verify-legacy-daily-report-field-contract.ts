import assert from "node:assert/strict";
import {
  buildLegacyFoodNameMap,
  dailyReportClothingFlags,
  dailyReportFoodLabel,
  dailyReportLegacyDataPatch,
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

const patch = dailyReportLegacyDataPatch(
  {
    clothesPants: true,
    clothesSweater: false,
    clothesTshirt: true,
    clothesUnderwear: false,
    clothesSocks: true,
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
assert.equal(patch.clothesPants, true);
assert.equal(patch.clothesShirt, false);
assert.equal(patch.clothesSweater, false);
assert.equal(patch.pantchecked, "1");
assert.equal(patch.shirtchecked, "0");
assert.equal(patch.tshirthecked, "1");
assert.equal(patch.boxerchecked, "0");
assert.equal(patch.sockschecked, "1");

console.log("legacy daily report field contract assertions passed");
