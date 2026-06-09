export type LegacyChildDailyReportColumnId =
  | "date"
  | "breakfastType"
  | "breakfastPortion"
  | "lunchType"
  | "lunchPortion"
  | "dessertType"
  | "dessertPortion"
  | "milkCc"
  | "sleepFrom"
  | "sleepTo"
  | "urinePotty"
  | "stoolPotty"
  | "urineDiaper"
  | "stoolDiaper"
  | "fever1Temp"
  | "fever1Time"
  | "fever2Temp"
  | "fever2Time"
  | "clothesPants"
  | "clothesShirt"
  | "clothesTshirt"
  | "clothesUnderwear"
  | "clothesSocks"
  | "actions";

export type LegacyChildDailyReportHeaderGroup = {
  id: string;
  label: string;
  columns: Array<{
    id: LegacyChildDailyReportColumnId;
    label: string;
  }>;
};

export const legacyChildDailyReportHeaderGroups = [
  { id: "date", label: "Date", columns: [{ id: "date", label: "" }] },
  {
    id: "breakfast",
    label: "BreakFast",
    columns: [
      { id: "breakfastType", label: "Type" },
      { id: "breakfastPortion", label: "Portion" },
    ],
  },
  {
    id: "lunch",
    label: "Lunch",
    columns: [
      { id: "lunchType", label: "Type" },
      { id: "lunchPortion", label: "Portion" },
    ],
  },
  {
    id: "dessert",
    label: "Dessert",
    columns: [
      { id: "dessertType", label: "Type" },
      { id: "dessertPortion", label: "Portion" },
    ],
  },
  { id: "milk", label: "Milk", columns: [{ id: "milkCc", label: "CC" }] },
  {
    id: "nap",
    label: "Nap",
    columns: [
      { id: "sleepFrom", label: "From" },
      { id: "sleepTo", label: "To" },
    ],
  },
  {
    id: "pot",
    label: "Pot",
    columns: [
      { id: "urinePotty", label: "Urine" },
      { id: "stoolPotty", label: "Stool" },
    ],
  },
  {
    id: "diaper",
    label: "Diaper",
    columns: [
      { id: "urineDiaper", label: "Urine" },
      { id: "stoolDiaper", label: "Stool" },
    ],
  },
  {
    id: "fever1",
    label: "Fever 1",
    columns: [
      { id: "fever1Temp", label: "*" },
      { id: "fever1Time", label: "Time" },
    ],
  },
  {
    id: "fever2",
    label: "Fever 2",
    columns: [
      { id: "fever2Temp", label: "*" },
      { id: "fever2Time", label: "Time" },
    ],
  },
  { id: "pant", label: "Pant", columns: [{ id: "clothesPants", label: "" }] },
  { id: "shirt", label: "Shirt", columns: [{ id: "clothesShirt", label: "" }] },
  { id: "tshirt", label: "T-Shirt", columns: [{ id: "clothesTshirt", label: "" }] },
  {
    id: "boxer",
    label: "Boxer",
    columns: [{ id: "clothesUnderwear", label: "" }],
  },
  { id: "socks", label: "Socks", columns: [{ id: "clothesSocks", label: "" }] },
  { id: "actions", label: "Actions", columns: [{ id: "actions", label: "" }] },
] satisfies LegacyChildDailyReportHeaderGroup[];

export function legacyChildDailyReportHeaderRows() {
  const firstRow: string[] = [];
  const secondRow: string[] = [];

  for (const group of legacyChildDailyReportHeaderGroups) {
    firstRow.push(group.label);
    for (let index = 1; index < group.columns.length; index++) {
      firstRow.push("");
    }

    for (const column of group.columns) {
      secondRow.push(column.label);
    }
  }

  return [firstRow, secondRow] as const;
}
