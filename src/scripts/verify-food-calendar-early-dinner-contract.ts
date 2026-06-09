import assert from "node:assert/strict";
import type { MealType } from "@/generated/prisma/client";
import {
  mapLegacyFoodCalendarItems,
  stripLegacyFoodCalendarGroupingFields,
} from "@/lib/parent-native-list-contracts";

const legacyDate = new Date("2026-06-07T00:00:00.000Z");

const foodItems = mapLegacyFoodCalendarItems([
  {
    id: "breakfast-row",
    legacyId: 44,
    legacyBranchId: 8,
    date: legacyDate,
    mealType: "BREAKFAST" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Manoushe" },
  },
  {
    id: "lunch-row",
    legacyId: 44,
    legacyBranchId: 8,
    date: legacyDate,
    mealType: "LUNCH" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Chicken rice" },
  },
  {
    id: "early-dinner-row",
    legacyId: 44,
    legacyBranchId: 8,
    date: legacyDate,
    mealType: "SNACK" as MealType,
    legacyData: { date: "2026-06-07", dessert: "Fruit" },
    food: { name: "Vegetable soup" },
  },
]);

assert.equal(foodItems.length, 1, "legacy hid rows must collapse into one native item");
assert.deepEqual(stripLegacyFoodCalendarGroupingFields(foodItems[0]), {
  dessert: "Fruit",
  date: "2026-06-07",
  bname: "Manoushe",
  lname: "Chicken rice",
  edinner: "Vegetable soup",
});

console.log("food calendar early dinner legacy contract assertions passed");
