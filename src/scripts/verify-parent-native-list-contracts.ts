import assert from "node:assert/strict";
import type { MealType } from "@/generated/prisma/client";
import {
  buildEmptyLegacyNativeListPayload,
  mapLegacyAbsenceReport,
  mapLegacyFinancePayment,
  mapLegacyFoodCalendarItems,
  mapLegacyHoliday,
  shouldUseLegacyNativeListFallback,
  stripLegacyFoodCalendarGroupingFields,
} from "@/lib/parent-native-list-contracts";

const absence = mapLegacyAbsenceReport({
  id: "modern-absence-id",
  legacyId: 77,
  date: new Date("2026-06-07T00:00:00.000Z"),
  reason: "sick",
  absentFrom: null,
  absentTo: null,
  hospitalized: true,
  hospitalName: null,
  doctorName: null,
  status: "PENDING",
  legacyData: null,
});

const absenceStringKeys = [
  "report_id",
  "reportdate",
  "ab_reason",
  "ab_from",
  "ab_to",
  "attend_hos",
  "hos_name",
  "dr_name",
  "is_rep_draft",
] as const;

for (const key of absenceStringKeys) {
  assert.equal(typeof absence[key], "string", `absence ${key} must be string`);
}
assert.equal(absence.report_id, "77");
assert.equal(absence.ab_from, "2026-06-07");
assert.equal(absence.ab_to, "2026-06-07");
assert.equal(absence.attend_hos, "Yes");

const payment = mapLegacyFinancePayment({
  legacyId: 9,
  amount: "385.00",
  currency: "$",
  date: new Date("2026-06-07T00:00:00.000Z"),
  dateFrom: null,
  dateTo: null,
  method: "CASH",
  category: "XTRA_TIME",
  notes: null,
  legacyData: null,
});

const paymentStringKeys = [
  "type",
  "target",
  "for",
  "year",
  "from",
  "to",
  "currency",
  "datetime",
  "amount",
] as const;

for (const key of paymentStringKeys) {
  assert.equal(typeof payment[key], "string", `payment ${key} must be string`);
}
assert.equal(payment.type, "cash");
assert.equal(payment.target, "extra");

const foodItems = mapLegacyFoodCalendarItems([
  {
    id: "breakfast-row",
    legacyId: 12,
    legacyBranchId: 3,
    date: new Date("2026-06-07T00:00:00.000Z"),
    mealType: "BREAKFAST" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Labneh" },
  },
  {
    id: "lunch-row",
    legacyId: 12,
    legacyBranchId: 3,
    date: new Date("2026-06-07T00:00:00.000Z"),
    mealType: "LUNCH" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Rice" },
  },
]);
assert.equal(foodItems.length, 1);
const food = stripLegacyFoodCalendarGroupingFields(foodItems[0]);
assert.deepEqual(food, {
  dessert: "Fruit",
  date: "2026-06-07",
  bname: "Labneh",
  lname: "Rice",
});

const currentYear = new Date().getFullYear();
const holiday = mapLegacyHoliday({
  name: "Fallback name",
  description: "Independence Day",
  date: new Date("2018-11-22T00:00:00.000Z"),
  repeated: true,
});
assert.equal(holiday.description, "Independence Day");
assert.equal(holiday.date, `${currentYear}-11-22`);

assert.deepEqual(buildEmptyLegacyNativeListPayload(), [
  { name: "", status: false, count: 0 },
]);
assert.deepEqual(buildEmptyLegacyNativeListPayload({ branch_id: 0 }), [
  { name: "", status: false, count: 0, branch_id: 0 },
]);

assert.equal(
  shouldUseLegacyNativeListFallback({ method: "POST" }, new Error("bad row")),
  true,
  "native POST list feeds must keep PHP empty-header fallback on unexpected route errors"
);
assert.equal(
  shouldUseLegacyNativeListFallback({ method: "GET" }, { code: "P1001" }),
  true,
  "database connection failures must keep PHP empty-header fallback"
);
assert.equal(
  shouldUseLegacyNativeListFallback({ method: "GET" }, new Error("bad row")),
  false,
  "non-connection GET errors should remain hard failures for authenticated web flows"
);

console.log("parent native list legacy contract assertions passed");
