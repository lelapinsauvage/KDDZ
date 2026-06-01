/**
 * Migration: t_food          → Food
 *            t_food_calendar → FoodCalendar
 *            t_holiday       → Holiday
 *
 * Notes:
 * - Legacy `t_food_calendar` stores breakfast/lunch/early-dinner food IDs plus
 *   a free-text dessert. The modern schema stores one row per meal type.
 * - Legacy `t_food_apply` is per-class/per-child application history and has no
 *   direct modern model yet. It remains a restoration gap until a destination is
 *   approved or schema is extended.
 */

import type { MealType, PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
import {
  cleanString,
  generateUUID,
  getMapping,
  isDryRun,
  log,
  logError,
  logProgress,
  parseDate,
  setMapping,
  toBool,
  toInt,
} from "./lib/utils";

interface OldFood {
  fid: number;
  type: string;
  fname: string;
  active: string;
  datetime: string;
  deleted: number;
}

interface OldFoodCalendar {
  hid: number;
  repeated: number;
  bfid: number;
  lnid: number;
  edid: number;
  dessert: string;
  branch_id: number;
  date: string;
  datetime: string;
  active: number;
}

interface OldHoliday {
  hid: number;
  description: string;
  message: string;
  message_date: string;
  repeated: number;
  date: string;
  datetime: string;
  active: number;
  subject: string;
  body: string;
  notificationType: number;
  activeNotification: number;
  notificationDate: string;
  notificationTime: string;
  daysbefore: string;
}

function mapFoodCategory(type: string): "BREAKFAST" | "LUNCH" | "DESSERT" | "SNACK" {
  const v = type.toLowerCase().trim();
  if (v.includes("break")) return "BREAKFAST";
  if (v.includes("lunch")) return "LUNCH";
  if (v.includes("dess")) return "DESSERT";
  return "SNACK";
}

function parseDaysBefore(value: string): number {
  const cleaned = cleanString(value);
  if (!cleaned || cleaned === "null") return 0;
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return toInt(parsed[0], 0);
  } catch {
    // fall through
  }
  return toInt(cleaned, 0);
}

async function ensureDessertFood(
  prisma: PrismaClient,
  organizationId: string,
  name: string,
  dryRun: boolean
): Promise<string | null> {
  const cleaned = cleanString(name);
  if (!cleaned) return null;

  const existing = await prisma.food.findFirst({
    where: { organizationId, name: cleaned, category: "DESSERT" },
  });
  if (existing) return existing.id;

  const id = generateUUID();
  if (!dryRun) {
    await prisma.food.create({
      data: {
        id,
        organizationId,
        name: cleaned,
        category: "DESSERT",
        isActive: true,
      },
    });
  }
  return id;
}

async function createCalendarEntry(
  prisma: PrismaClient,
  branchId: string,
  date: Date,
  mealType: MealType,
  foodId: string | null,
  createdAt: Date,
  dryRun: boolean
) {
  if (!foodId) return false;

  const existing = await prisma.foodCalendar.findUnique({
    where: {
      branchId_date_mealType: {
        branchId,
        date,
        mealType,
      },
    },
  });
  if (existing) return false;

  if (!dryRun) {
    await prisma.foodCalendar.create({
      data: {
        id: generateUUID(),
        branchId,
        date,
        mealType,
        foodId,
        createdAt,
      },
    });
  }
  return true;
}

export async function migrateFoodCalendar(prisma: PrismaClient, organizationId: string) {
  log("=== Migrating Food, Food Calendar & Holidays ===");
  const dryRun = isDryRun();

  const foods = await queryMysql<OldFood>(
    "SELECT * FROM t_food WHERE deleted = 0 ORDER BY fid"
  );
  log(`Found ${foods.length} food items in old DB`);

  let foodMigrated = 0;
  let foodSkipped = 0;

  for (const row of foods) {
    const category = mapFoodCategory(row.type);
    const name = cleanString(row.fname);
    if (!name) {
      foodSkipped++;
      continue;
    }

    const existing = await prisma.food.findFirst({
      where: { organizationId, name, category },
    });
    if (existing) {
      setMapping("food", row.fid, existing.id);
      foodSkipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.food.create({
        data: {
          id,
          organizationId,
          name,
          category,
          isActive: row.active.toLowerCase() === "on",
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }
    setMapping("food", row.fid, id);
    foodMigrated++;
    logProgress(foodMigrated, foods.length, "Food Items");
  }

  log(`Food Items: ${foodMigrated} migrated, ${foodSkipped} skipped`);

  const calendarRows = await queryMysql<OldFoodCalendar>(
    "SELECT * FROM t_food_calendar WHERE active = 1 ORDER BY hid"
  );
  log(`Found ${calendarRows.length} food calendar rows in old DB`);

  let calendarEntries = 0;
  let calendarSkipped = 0;

  for (const row of calendarRows) {
    const branchId = getMapping("branch", row.branch_id);
    const date = parseDate(row.date);
    if (!branchId || !date) {
      calendarSkipped++;
      continue;
    }

    const createdAt = parseDate(row.datetime) ?? new Date();
    const entries: Array<[MealType, string | null]> = [
      ["BREAKFAST", getMapping("food", row.bfid)],
      ["LUNCH", getMapping("food", row.lnid)],
      ["SNACK", getMapping("food", row.edid)],
      ["DESSERT", await ensureDessertFood(prisma, organizationId, row.dessert, dryRun)],
    ];

    for (const [mealType, foodId] of entries) {
      const created = await createCalendarEntry(
        prisma,
        branchId,
        date,
        mealType,
        foodId,
        createdAt,
        dryRun
      );
      if (created) calendarEntries++;
    }
  }

  log(`Food Calendar Entries: ${calendarEntries} migrated, ${calendarSkipped} skipped`);

  await migrateHolidays(prisma, dryRun);

  log(`=== Food/calendar migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

async function migrateHolidays(prisma: PrismaClient, dryRun: boolean) {
  const rows = await queryMysql<OldHoliday>(
    "SELECT * FROM t_holiday ORDER BY hid"
  );
  log(`Found ${rows.length} holidays in old DB`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const date = parseDate(row.date);
    const name = cleanString(row.description);
    if (!date || !name) {
      skipped++;
      continue;
    }

    const existing = await prisma.holiday.findFirst({
      where: { name, date },
    });
    if (existing) {
      setMapping("holiday", row.hid, existing.id);
      skipped++;
      continue;
    }

    const id = generateUUID();
    if (!dryRun) {
      await prisma.holiday.create({
        data: {
          id,
          name,
          description: cleanString(row.message),
          date,
          repeated: toBool(row.repeated),
          type: row.notificationType === 1 ? "STRIKE" : "HOLIDAY",
          isActive: toBool(row.active),
          notificationTitle: cleanString(row.subject),
          notificationMessage: cleanString(row.body),
          daysBefore: parseDaysBefore(row.daysbefore),
          informTeachers: false,
          sendVia: "BOTH",
          createdAt: parseDate(row.datetime) ?? new Date(),
        },
      });
    }
    setMapping("holiday", row.hid, id);
    migrated++;
  }

  log(`Holidays: ${migrated} migrated, ${skipped} skipped`);
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      const org = await prisma.organization.findFirst();
      if (!org) {
        logError("Food/calendar migration requires an existing organization");
        process.exit(1);
      }
      await migrateFoodCalendar(prisma, org.id);
    } catch (err) {
      logError("Food/calendar migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
