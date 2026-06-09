import assert from "node:assert/strict";
import {
  legacyChildDailyReportHeaderGroups,
  legacyChildDailyReportHeaderRows,
} from "@/lib/legacy-child-report-table-contract";

const [firstRow, secondRow] = legacyChildDailyReportHeaderRows();

assert.deepEqual(firstRow, [
  "Date",
  "BreakFast",
  "",
  "Lunch",
  "",
  "Dessert",
  "",
  "Milk",
  "Nap",
  "",
  "Pot",
  "",
  "Diaper",
  "",
  "Fever 1",
  "",
  "Fever 2",
  "",
  "Pant",
  "Shirt",
  "T-Shirt",
  "Boxer",
  "Socks",
  "Actions",
]);

assert.deepEqual(secondRow, [
  "",
  "Type",
  "Portion",
  "Type",
  "Portion",
  "Type",
  "Portion",
  "CC",
  "From",
  "To",
  "Urine",
  "Stool",
  "Urine",
  "Stool",
  "*",
  "Time",
  "*",
  "Time",
  "",
  "",
  "",
  "",
  "",
  "",
]);

assert.equal(firstRow.length, 24);
assert.equal(secondRow.length, 24);
assert.equal(
  legacyChildDailyReportHeaderGroups.reduce(
    (total, group) => total + group.columns.length,
    0,
  ),
  24,
);

console.log("child report grouped header legacy contract assertions passed");
