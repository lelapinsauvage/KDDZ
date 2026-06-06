import { NextRequest } from "next/server";
import type { MealType, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatChildName,
  formatDate,
  jsonError,
  jsonSuccess,
  makeHeader,
} from "@/lib/parent-auth";

type ParentFoodChild = {
  id: string;
  legacyId: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  branchId: string;
};

type ParentFoodUser = {
  childId: string;
  child: ParentFoodChild;
};

type FoodCalendarRow = {
  id: string;
  legacyId: number | null;
  legacyBranchId: number | null;
  date: Date;
  mealType: MealType;
  legacyData: Prisma.JsonValue | null;
  food: { name: string };
};

type FoodCalendarItem = {
  legacyId: number | null;
  date: string;
  dessert: string;
  bname: string;
  lname: string;
};

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const parentUser = auth.parentUser as ParentFoodUser;
  const child = parentUser.child;

  if (request.method === "POST") {
    const postedChildId = await readPostedChildId(request);
    if (!postedChildId) {
      return jsonSuccess([makeHeader("", false, 0, { branch_id: 0 })]);
    }
    if (!matchesChildId(child, postedChildId)) {
      return jsonError("Access denied", 403);
    }
  }

  try {
    const [branch, foodCalendars] = await Promise.all([
      db.branch.findUnique({
        where: { id: child.branchId },
        select: { legacyId: true },
      }),
      db.foodCalendar.findMany({
        where: { branchId: child.branchId },
        include: { food: true },
        orderBy: [{ legacyId: "asc" }, { date: "asc" }, { mealType: "asc" }],
      }),
    ]);

    const items = mapFoodCalendarItems(foodCalendars);
    const header = makeHeader(formatChildName(child), true, items.length, {
      branch_id: branch?.legacyId ?? child.branchId,
    });

    return jsonSuccess([header, ...items.map(stripGroupingFields)]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

function mapFoodCalendarItems(rows: FoodCalendarRow[]) {
  const groups = new Map<string, FoodCalendarItem>();

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

function stripGroupingFields(item: FoodCalendarItem) {
  return {
    dessert: item.dessert,
    date: item.date,
    bname: item.bname,
    lname: item.lname,
  };
}

async function readPostedChildId(request: NextRequest) {
  const body = await readRequestBody(request);
  return readString(asRecord(body), ["usites", "pid", "child_id", "childId"]);
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
    const form = await request.formData();
    return Object.fromEntries(
      [...form.entries()].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ])
    );
  }

  return null;
}

function matchesChildId(child: ParentFoodChild, postedChildId: string) {
  return postedChildId === child.id || postedChildId === String(child.legacyId ?? "");
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
