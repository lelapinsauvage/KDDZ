import { db } from "@/lib/db";
import {
  buildLegacyFoodNameMap,
  legacyDailyFoodId,
  legacyDailySourceDatabase,
  type LegacyFoodNameMap,
} from "@/lib/legacy-daily-report-fields";

export async function loadLegacyDailyReportFoodNames(
  legacyDataValues: unknown[],
): Promise<LegacyFoodNameMap> {
  const legacyFoodIds = new Set<number>();
  const legacySourceDatabases = new Set<string>();

  for (const legacyData of legacyDataValues) {
    for (const key of ["breakfast_id", "lunch_id"] as const) {
      const legacyFoodId = legacyDailyFoodId(legacyData, key);
      if (legacyFoodId) legacyFoodIds.add(legacyFoodId);
    }

    const sourceDatabase = legacyDailySourceDatabase(legacyData);
    if (sourceDatabase) legacySourceDatabases.add(sourceDatabase);
  }

  if (!legacyFoodIds.size) {
    return new Map();
  }

  const legacyFoods = await db.food.findMany({
    where: {
      legacyId: { in: [...legacyFoodIds] },
      ...(legacySourceDatabases.size
        ? { sourceDatabase: { in: [...legacySourceDatabases] } }
        : {}),
    },
    select: { legacyId: true, sourceDatabase: true, name: true },
  });

  return buildLegacyFoodNameMap(legacyFoods);
}
