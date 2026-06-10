/**
 * Repair migration: legacy t_food provenance -> existing Food rows.
 *
 * This is intentionally narrower than the full food/calendar migration. It
 * exists for databases imported before Food.sourceDatabase/legacyKey/legacyId
 * were populated, where re-importing the full database is not practical.
 */

import type { FoodCategory, Prisma, PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool, getMysqlConfig } from "./lib/mysql-client";
import { cleanString, isDryRun, log, logError, parseDate } from "./lib/utils";

type OldFood = {
  fid: number;
  type: string;
  fname: string;
  active: string;
  datetime: string;
  deleted: number;
  [key: string]: unknown;
};

type FoodMatch = {
  id: string;
  name: string;
  category: FoodCategory;
  sourceDatabase: string | null;
  legacyKey: string | null;
  legacyId: number | null;
};

function mapFoodCategory(type: string): FoodCategory {
  const value = type.toLowerCase().trim();
  if (value.includes("break")) return "BREAKFAST";
  if (value.includes("lunch")) return "LUNCH";
  if (value.includes("dess")) return "DESSERT";
  return "SNACK";
}

function normalizeFoodName(value: string) {
  return (cleanString(value) ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function legacyFoodData(sourceDatabase: string, row: OldFood): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      sourceDatabase,
      sourceTable: "t_food",
      legacyId: row.fid,
      row,
      repairedFrom: "backfill-food-legacy-provenance",
    }),
  ) as Prisma.InputJsonValue;
}

async function backfillFoodLegacyProvenance(
  prisma: PrismaClient,
  organizationId: string,
) {
  log("=== Backfilling Food legacy provenance ===");
  const dryRun = isDryRun();
  const sourceDatabase = getMysqlConfig().database || "unknown";
  const rows = await queryMysql<OldFood>(
    "SELECT * FROM t_food WHERE deleted = 0 ORDER BY fid",
  );
  log(`Found ${rows.length} active legacy t_food rows`);

  const modernFoods = await prisma.food.findMany({
    where: { organizationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      category: true,
      sourceDatabase: true,
      legacyKey: true,
      legacyId: true,
    },
  });

  const availableByNameCategory = new Map<string, FoodMatch[]>();
  for (const food of modernFoods) {
    const key = `${food.category}:${normalizeFoodName(food.name)}`;
    const bucket = availableByNameCategory.get(key) ?? [];
    bucket.push(food);
    availableByNameCategory.set(key, bucket);
  }

  let updated = 0;
  let alreadyLinked = 0;
  let skipped = 0;
  let ambiguous = 0;

  for (const row of rows) {
    const name = cleanString(row.fname);
    if (!name) {
      skipped++;
      continue;
    }

    const category = mapFoodCategory(row.type);
    const legacyKey = `${sourceDatabase}:t_food:${row.fid}`;
    const existingByLegacyKey = modernFoods.find(
      (food) =>
        food.legacyKey === legacyKey ||
        (food.sourceDatabase === sourceDatabase && food.legacyId === row.fid),
    );
    if (existingByLegacyKey) {
      alreadyLinked++;
      continue;
    }

    const matchKey = `${category}:${normalizeFoodName(name)}`;
    const candidates = (availableByNameCategory.get(matchKey) ?? []).filter(
      (food) => !food.legacyKey && food.legacyId == null,
    );

    if (candidates.length !== 1) {
      if (candidates.length > 1) ambiguous++;
      else skipped++;
      continue;
    }

    const matched = candidates[0];
    if (!dryRun) {
      await prisma.food.update({
        where: { id: matched.id },
        data: {
          sourceDatabase,
          legacyKey,
          legacyId: row.fid,
          legacyData: legacyFoodData(sourceDatabase, row),
          isActive: row.active.toLowerCase() === "on",
          createdAt: parseDate(row.datetime) ?? undefined,
        },
      });
    }
    matched.legacyKey = legacyKey;
    matched.legacyId = row.fid;
    updated++;
  }

  log(
    `Food provenance backfill: ${updated} updated, ${alreadyLinked} already linked, ` +
      `${skipped} skipped, ${ambiguous} ambiguous${dryRun ? " [DRY RUN]" : ""}`,
  );
}

if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      const org = await prisma.organization.findFirst();
      if (!org) {
        logError("Food provenance backfill requires an existing organization");
        process.exit(1);
      }
      await backfillFoodLegacyProvenance(prisma, org.id);
    } catch (error) {
      logError("Food provenance backfill failed", error);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
