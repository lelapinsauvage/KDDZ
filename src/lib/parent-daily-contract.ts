import { NextRequest } from "next/server";
import type { PortionSize, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  formatDate,
  formatTime,
  jsonError,
  mapPortionSize,
  verifyParentToken,
} from "@/lib/parent-auth";

export type ParentDailyChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

export type ParentDailyUser = {
  id: string;
  childId: string;
  legacyChildId: number | null;
  child: ParentDailyChild;
};

type DailyReportForParent = {
  id: string;
  reportDate: Date;
  status: string;
  breakfastPortion: PortionSize | null;
  breakfastTime: Date | null;
  lunchPortion: PortionSize | null;
  lunchTime: Date | null;
  dessert: string | null;
  dessertPortion: PortionSize | null;
  dessertTime: Date | null;
  isSleep: boolean;
  sleepFrom: Date | null;
  sleepTo: Date | null;
  diarrhea: boolean;
  urinePotty: number;
  stoolPotty: number;
  urineDiaper: number;
  stoolDiaper: number;
  mood: string | null;
  cough: boolean;
  runnyNose: boolean;
  vomit: boolean;
  remarks: string | null;
  legacyData: Prisma.JsonValue | null;
  breakfastFood: { name: string } | null;
  lunchFood: { name: string } | null;
  fevers: { temperature: unknown; time: Date }[];
  milks: { amountCc: number; time: Date }[];
};

export async function readPostedParentDailyChildId(request: NextRequest) {
  const body = await readRequestBody(request);
  return readString(asRecord(body), ["usites", "pid", "child_id", "childId"]);
}

export function matchesParentDailyChildId(
  child: ParentDailyChild,
  postedChildId: string
) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
}

export function matchesParentDailyUserChildId(
  parentUser: ParentDailyUser,
  childId: string
) {
  return (
    childId === parentUser.childId ||
    childId === parentUser.child.id ||
    childId === String(parentUser.legacyChildId ?? "") ||
    childId === String(parentUser.child.legacyId ?? "")
  );
}

export async function optionalAuthenticateParentDaily(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const hasBearer = authHeader?.startsWith("Bearer ");
  const payload = await verifyParentToken(request);

  if (hasBearer && !payload) {
    return { error: jsonError("Unauthorized", 401) };
  }
  if (!payload) return null;

  const parentUser = await db.parentUser.findUnique({
    where: { id: payload.sub, isActive: true },
    include: { child: true },
  }).catch(() => "db-error" as const);

  if (parentUser === "db-error") {
    return { error: jsonError("Internal server error", 500) };
  }

  if (!parentUser) {
    return { error: jsonError("Unauthorized", 401) };
  }

  return { parentUser: parentUser as ParentDailyUser };
}

export async function resolveLegacyParentDailyChild(childId: string) {
  const legacyChildId = parseLegacyInt(childId);
  const childWhere = [];

  if (UUID_RE.test(childId)) {
    childWhere.push({ id: childId });
  }
  if (legacyChildId !== null) {
    childWhere.push({ legacyId: legacyChildId });
  }

  if (childWhere.length === 0) return null;

  return db.child.findFirst({
    where: { OR: childWhere },
    select: {
      id: true,
      legacyId: true,
      firstName: true,
      middleName: true,
      lastName: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function loadParentDailyReports(childId: string) {
  return db.dailyReport.findMany({
    where: { childId, status: "SUBMITTED" },
    include: {
      breakfastFood: true,
      lunchFood: true,
      fevers: { orderBy: { time: "desc" } },
      milks: { orderBy: { time: "asc" } },
    },
    orderBy: { reportDate: "desc" },
  });
}

export async function resolveTakenMedicineNames(
  reports: DailyReportForParent[]
) {
  const legacyIds = [
    ...new Set(
      reports.flatMap((report) =>
        parseTakenMedicineIds(asRecord(report.legacyData)?.taken_meds)
      )
    ),
  ];

  if (legacyIds.length === 0) return new Map<number, string>();

  const entries = await db.medicalFormEntry.findMany({
    where: {
      OR: legacyIds.flatMap((id) => [
        { legacyData: { path: ["medfid"], equals: id } },
        { legacyData: { path: ["medfid"], equals: String(id) } },
      ]),
    },
    select: { legacyData: true, value: true },
  });

  const names = new Map<number, string>();
  for (const entry of entries) {
    const legacy = asRecord(entry.legacyData);
    const id = Number(readString(legacy, ["medfid"]));
    if (!Number.isFinite(id)) continue;

    const name =
      readString(legacy, ["medname"]) ?? parseMedicalEntryName(entry.value);
    if (name) names.set(id, name);
  }

  return names;
}

export function mapLegacyDailyReport(
  report: DailyReportForParent
): Record<string, unknown> {
  const legacy = asRecord(report.legacyData);
  const feverFlat: Record<string, string> = {};

  for (let index = 0; index < 4; index++) {
    const fever = report.fevers[index];
    feverFlat[String(index * 2)] = fever ? String(fever.temperature) : "";
    feverFlat[String(index * 2 + 1)] = fever ? formatTime(fever.time) : "";
  }

  const milk = report.milks[0];

  return {
    report_id: readRaw(legacy, "report_id", report.id),
    reportdate: readString(legacy, ["reportdate"]) ?? formatDate(report.reportDate),
    status: readString(legacy, ["status"]) ?? report.status,
    bftime: readString(legacy, ["bftime"]) ?? formatTime(report.breakfastTime),
    breakf: mapLegacyMealPortion(legacy, "breakf", report.breakfastPortion),
    lntime: readString(legacy, ["lntime"]) ?? formatTime(report.lunchTime),
    lunchf: mapLegacyMealPortion(legacy, "lunchf", report.lunchPortion),
    dessert: readString(legacy, ["dessert"]) ?? report.dessert ?? "",
    has_dess: readString(legacy, ["has_dess"]) ?? (report.dessert ? "1" : "0"),
    dess_portion: readRaw(
      legacy,
      "dess_portion",
      mapPortionSize(report.dessertPortion)
    ),
    desstime: readString(legacy, ["desstime"]) ?? formatTime(report.dessertTime),
    is_sleep: readLegacyBoolean(legacy, "is_sleep", report.isSleep),
    sleep_from: readString(legacy, ["sleep_from"]) ?? formatTime(report.sleepFrom),
    sleep_to: readString(legacy, ["sleep_to"]) ?? formatTime(report.sleepTo),
    diahria: readLegacyBoolean(legacy, "diahria", report.diarrhea),
    ur_pot: readString(legacy, ["ur_pot"]) ?? String(report.urinePotty),
    stool_pot: readString(legacy, ["stool_pot"]) ?? String(report.stoolPotty),
    ur_di: readString(legacy, ["ur_di"]) ?? String(report.urineDiaper),
    stool_di: readString(legacy, ["stool_di"]) ?? String(report.stoolDiaper),
    remarks: readString(legacy, ["remarks"]) ?? report.remarks ?? "",
    pantchecked: readString(legacy, ["pantchecked"]) ?? "",
    shirtchecked: readString(legacy, ["shirtchecked"]) ?? "",
    tshirthecked: readString(legacy, ["tshirthecked"]) ?? "",
    boxerchecked: readString(legacy, ["boxerchecked"]) ?? "",
    sockschecked: readString(legacy, ["sockschecked"]) ?? "",
    ...feverFlat,
    mcc: milk ? milk.amountCc : 0,
    mtime: milk ? formatTime(milk.time) : "00:00",
    bname: report.breakfastFood?.name ?? "",
    lname: report.lunchFood?.name ?? "",
  };
}

export function mapLegacyDetailedDailyReport(
  report: DailyReportForParent,
  medicineNames: Map<number, string>
): Record<string, unknown> {
  const legacy = asRecord(report.legacyData);

  return {
    report_id: readRaw(legacy, "report_id", report.id),
    reportdate: readString(legacy, ["reportdate"]) ?? formatDate(report.reportDate),
    status: readString(legacy, ["status"]) ?? report.status,
    bftime: readString(legacy, ["bftime"]) ?? formatTime(report.breakfastTime),
    breakf: mapLegacyMealPortion(legacy, "breakf", report.breakfastPortion),
    lntime: readString(legacy, ["lntime"]) ?? formatTime(report.lunchTime),
    lunchf: mapLegacyMealPortion(legacy, "lunchf", report.lunchPortion),
    dessert: readString(legacy, ["dessert"]) ?? report.dessert ?? "",
    has_dess: readString(legacy, ["has_dess"]) ?? (report.dessert ? "1" : "0"),
    dess_portion: mapLegacyDessertPortion(legacy, report.dessertPortion),
    desstime: readString(legacy, ["desstime"]) ?? formatTime(report.dessertTime),
    is_sleep: readLegacyBoolean(legacy, "is_sleep", report.isSleep),
    sleep_from: readString(legacy, ["sleep_from"]) ?? formatTime(report.sleepFrom),
    sleep_to: readString(legacy, ["sleep_to"]) ?? formatTime(report.sleepTo),
    diarrhea: readLegacyBoolean(legacy, "diahria", report.diarrhea),
    ur_pot: readString(legacy, ["ur_pot"]) ?? String(report.urinePotty),
    stool_pot: readString(legacy, ["stool_pot"]) ?? String(report.stoolPotty),
    ur_di: readString(legacy, ["ur_di"]) ?? String(report.urineDiaper),
    stool_di: readString(legacy, ["stool_di"]) ?? String(report.stoolDiaper),
    remarks: readString(legacy, ["remarks"]) ?? report.remarks ?? "",
    pantchecked: readString(legacy, ["pantchecked"]) ?? "",
    shirtchecked: readString(legacy, ["shirtchecked"]) ?? "",
    tshirthecked: readString(legacy, ["tshirthecked"]) ?? "",
    boxerchecked: readString(legacy, ["boxerchecked"]) ?? "",
    sockschecked: readString(legacy, ["sockschecked"]) ?? "",
    mood: readString(legacy, ["mood"]) ?? report.mood ?? "",
    mood2: readString(legacy, ["mood2"]) ?? "",
    constipation: readString(legacy, ["constipation"]) ?? "",
    sleep_from1: readString(legacy, ["sleep_from1"]) ?? "",
    sleep_to1: readString(legacy, ["sleep_to1"]) ?? "",
    sleep_from2: readString(legacy, ["sleep_from2"]) ?? "",
    sleep_to2: readString(legacy, ["sleep_to2"]) ?? "",
    cough: readLegacyBoolean(legacy, "cough", report.cough),
    rnose: readLegacyBoolean(legacy, "rnose", report.runnyNose),
    vomit: readLegacyBoolean(legacy, "vomit", report.vomit),
    brushchecked: readString(legacy, ["brushchecked"]) ?? "",
    towelchecked: readString(legacy, ["towelchecked"]) ?? "",
    diaperschecked: readString(legacy, ["diaperschecked"]) ?? "",
    babybottlechecked: readString(legacy, ["babybottlechecked"]) ?? "",
    milkchecked: readString(legacy, ["milkchecked"]) ?? "",
    wipeschecked: readString(legacy, ["wipeschecked"]) ?? "",
    takenmeds_Arr: parseTakenMedicineIds(legacy?.taken_meds)
      .map((id) => medicineNames.get(id))
      .filter((name): name is string => Boolean(name)),
    fever: report.fevers.map((fever) => ({
      fvalue: String(fever.temperature),
      ftime: formatTime(fever.time),
    })),
    milk: report.milks.map((milk) => ({
      mcc: String(milk.amountCc),
      mtime: formatTime(milk.time),
    })),
    bname: report.breakfastFood?.name ?? "",
    lname: report.lunchFood?.name ?? "",
  };
}

async function readRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return asRecord(body);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  const text = await request.text().catch(() => "");
  if (!text.trim()) return null;
  return Object.fromEntries(new URLSearchParams(text).entries());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readRaw(
  data: Record<string, unknown> | null,
  key: string,
  fallback: unknown
) {
  const value = data?.[key];
  return value === undefined || value === null ? fallback : value;
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return null;
}

function readLegacyBoolean(
  legacy: Record<string, unknown> | null,
  key: string,
  fallback: boolean
) {
  const value = legacy?.[key];
  return value === undefined || value === null ? (fallback ? "1" : "0") : String(value);
}

function mapLegacyMealPortion(
  legacy: Record<string, unknown> | null,
  key: string,
  fallback: PortionSize | null
) {
  const value = readString(legacy, [key])?.toLowerCase().trim();
  if (value === "none") return 1;
  if (value === "little") return 2;
  if (value === "half") return 3;
  if (value === "well") return 4;
  return mapPortionSize(fallback);
}

function mapLegacyDessertPortion(
  legacy: Record<string, unknown> | null,
  fallback: PortionSize | null
) {
  const value = readString(legacy, ["dess_portion"])?.trim();
  if (value === "0") return 1;
  if (value === "1") return 2;
  if (value === "2") return 3;
  if (value === "3") return 4;
  return mapPortionSize(fallback);
}

function parseTakenMedicineIds(value: unknown) {
  const parsed = typeof value === "string" ? parseJson(value) : value;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseMedicalEntryName(value: string | null) {
  const match = value?.match(/(?:^|;\s*)name:\s*([^;]+)/);
  return match?.[1]?.trim() || null;
}

function parseLegacyInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
