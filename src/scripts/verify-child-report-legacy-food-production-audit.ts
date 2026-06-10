import "dotenv/config";
import assert from "node:assert/strict";

import { db } from "@/lib/db";
import {
  legacyDailyNumber,
  legacyDailyRecord,
  legacyDailySourceDatabase,
} from "@/lib/legacy-daily-report-fields";

type LegacyFoodKey = "breakfast_id" | "lunch_id" | "lunch_id2";

type LegacyFoodReference = {
  reportId: string;
  reportDate: string;
  childName: string;
  key: LegacyFoodKey;
  legacyId: number;
  sourceDatabase: string | null;
};

const legacyFoodKeys: LegacyFoodKey[] = [
  "breakfast_id",
  "lunch_id",
  "lunch_id2",
];

function foodLookupKeys(food: {
  legacyId: number | null;
  sourceDatabase: string | null;
}) {
  if (!food.legacyId) return [];

  const keys = [String(food.legacyId)];
  if (food.sourceDatabase) {
    keys.push(`${food.sourceDatabase}:${food.legacyId}`);
  }

  return keys;
}

function referenceLookupKeys(reference: LegacyFoodReference) {
  const keys = [String(reference.legacyId)];
  if (reference.sourceDatabase) {
    keys.unshift(`${reference.sourceDatabase}:${reference.legacyId}`);
  }

  return keys;
}

async function main() {
  const reports = await db.dailyReport.findMany({
    select: {
      id: true,
      reportDate: true,
      legacyData: true,
      child: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const references: LegacyFoodReference[] = [];

  for (const report of reports) {
    const legacy = legacyDailyRecord(report.legacyData);
    const sourceDatabase = legacyDailySourceDatabase(legacy);

    for (const key of legacyFoodKeys) {
      const legacyId = legacyDailyNumber(legacy[key]);
      if (!legacyId) continue;

      references.push({
        reportId: report.id,
        reportDate: report.reportDate.toISOString().slice(0, 10),
        childName: `${report.child.firstName} ${report.child.lastName}`,
        key,
        legacyId,
        sourceDatabase,
      });
    }
  }

  const legacyIds = [...new Set(references.map((reference) => reference.legacyId))];
  const foods = legacyIds.length
    ? await db.food.findMany({
        where: {
          legacyId: {
            in: legacyIds,
          },
        },
        select: {
          legacyId: true,
          sourceDatabase: true,
        },
      })
    : [];

  const migratedFoodKeys = new Set(foods.flatMap(foodLookupKeys));
  const missing = references.filter(
    (reference) =>
      !referenceLookupKeys(reference).some((key) => migratedFoodKeys.has(key)),
  );

  assert.deepEqual(
    missing,
    [],
    `Found ${missing.length} legacy daily-report food references without migrated Food rows: ${JSON.stringify(
      missing.slice(0, 10),
      null,
      2,
    )}`,
  );

  console.log(
    JSON.stringify(
      {
        reportCount: reports.length,
        legacyFoodReferenceCount: references.length,
        distinctLegacyFoodIds: legacyIds.length,
        migratedFoodRowsForReferencedIds: foods.length,
        missingLegacyFoodReferenceCount: missing.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
