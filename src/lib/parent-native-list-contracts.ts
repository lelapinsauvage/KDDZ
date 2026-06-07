import type { MealType, Prisma } from "@/generated/prisma/client";
import { formatDate } from "@/lib/parent-auth";

export type LegacyAbsenceReportRow = {
  id: string;
  legacyId: number | null;
  date: Date;
  reason: string | null;
  absentFrom: Date | null;
  absentTo: Date | null;
  hospitalized: boolean;
  hospitalName: string | null;
  doctorName: string | null;
  status: string;
  legacyData: Prisma.JsonValue | null;
};

export type LegacyPaymentRow = {
  legacyId: number | null;
  amount: unknown;
  currency: string;
  date: Date;
  dateFrom: Date | null;
  dateTo: Date | null;
  method: string;
  category: string;
  notes: string | null;
  legacyData: Prisma.JsonValue | null;
};

export type LegacyFoodCalendarRow = {
  id: string;
  legacyId: number | null;
  legacyBranchId: number | null;
  date: Date;
  mealType: MealType;
  legacyData: Prisma.JsonValue | null;
  food: { name: string };
};

export type LegacyFoodCalendarItem = {
  legacyId: number | null;
  date: string;
  dessert: string;
  bname: string;
  lname: string;
};

export function mapLegacyAbsenceReport(report: LegacyAbsenceReportRow) {
  const legacy = asRecord(report.legacyData);

  return {
    report_id: readString(legacy, ["report_id"]) ?? String(report.legacyId ?? report.id),
    reportdate: readString(legacy, ["reportdate"]) ?? formatDate(report.date),
    ab_reason: readString(legacy, ["ab_reason"]) ?? report.reason ?? "",
    ab_from:
      readString(legacy, ["ab_from"]) ?? formatDate(report.absentFrom ?? report.date),
    ab_to:
      readString(legacy, ["ab_to"]) ??
      formatDate(report.absentTo ?? report.absentFrom ?? report.date),
    attend_hos:
      readString(legacy, ["attend_hos"]) ?? (report.hospitalized ? "Yes" : "No"),
    hos_name: readString(legacy, ["hos_name"]) ?? report.hospitalName ?? "",
    dr_name: readString(legacy, ["dr_name"]) ?? report.doctorName ?? "",
    is_rep_draft:
      readString(legacy, ["is_rep_draft"]) ??
      (report.status === "PENDING" ? "1" : "0"),
  };
}

export function mapLegacyFinancePayment(payment: LegacyPaymentRow) {
  const legacy = asRecord(payment.legacyData);

  return {
    type: readString(legacy, ["type"]) ?? mapLegacyPaymentMethod(payment.method),
    target: readString(legacy, ["target"]) ?? mapLegacyPaymentTarget(payment.category),
    for: readString(legacy, ["for"]) ?? payment.notes ?? "",
    year: readString(legacy, ["year"]) ?? String(payment.date.getUTCFullYear()),
    from: readString(legacy, ["from"]) ?? formatDate(payment.dateFrom),
    to: readString(legacy, ["to"]) ?? formatDate(payment.dateTo),
    currency: readString(legacy, ["currency"]) ?? payment.currency,
    datetime: readString(legacy, ["datetime"]) ?? formatDate(payment.date),
    amount: readString(legacy, ["amount"]) ?? String(payment.amount),
  };
}

export function mapLegacyFoodCalendarItems(rows: LegacyFoodCalendarRow[]) {
  const groups = new Map<string, LegacyFoodCalendarItem>();

  for (const row of rows) {
    const legacy = asRecord(row.legacyData);
    const date = readString(legacy, ["date"]) ?? formatDate(row.date);
    const key = row.legacyId !== null ? `legacy:${row.legacyId}` : `date:${date}`;

    if (!groups.has(key)) {
      groups.set(key, {
        legacyId: row.legacyId,
        date,
        dessert: readString(legacy, ["dessert"]) ?? "",
        bname: "",
        lname: "",
      });
    }

    const item = groups.get(key)!;
    if (!item.dessert) item.dessert = readString(legacy, ["dessert"]) ?? "";
    if (row.mealType === "BREAKFAST") item.bname = row.food.name;
    if (row.mealType === "LUNCH") item.lname = row.food.name;
    if (row.mealType === "DESSERT" && !item.dessert) item.dessert = row.food.name;
  }

  return [...groups.values()].sort((left, right) => {
    if (left.legacyId !== null && right.legacyId !== null) {
      return left.legacyId - right.legacyId;
    }
    return left.date.localeCompare(right.date);
  });
}

export function stripLegacyFoodCalendarGroupingFields(
  item: LegacyFoodCalendarItem
) {
  return {
    dessert: item.dessert,
    date: item.date,
    bname: item.bname,
    lname: item.lname,
  };
}

export function mapLegacyHoliday(holiday: {
  name: string;
  description: string | null;
  date: Date;
  repeated: boolean;
}) {
  return {
    description: holiday.description || holiday.name || "",
    date: formatLegacyHolidayDate(holiday.date, holiday.repeated),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return null;
}

function mapLegacyPaymentMethod(method: string) {
  return method.toLowerCase();
}

function mapLegacyPaymentTarget(category: string) {
  const map: Record<string, string> = {
    REGISTRATION: "reg",
    MONTHLY: "monthly",
    BUS: "bus",
    XTRA_TIME: "extra",
    FOOD: "food",
    OTHER: "other",
  };
  return map[category] ?? category.toLowerCase();
}

function formatLegacyHolidayDate(date: Date, repeated: boolean) {
  if (!repeated) return formatDate(date);

  const nextDate = new Date(date);
  const currentYear = new Date().getFullYear();
  if (nextDate.getUTCFullYear() !== currentYear) {
    nextDate.setUTCFullYear(currentYear);
  }
  return formatDate(nextDate);
}
