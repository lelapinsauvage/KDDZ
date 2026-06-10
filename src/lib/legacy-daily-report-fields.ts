import type { Prisma } from "@/generated/prisma/client";
import type { DailyReportFormValues } from "@/lib/validations/daily-report";

type LegacyRecord = Record<string, unknown>;

export type LegacyFoodNameMap = Map<string, string>;

export type LegacyFoodNameSource = {
  legacyId: number | null;
  sourceDatabase: string | null;
  name: string;
};

export type DailyReportClothingFlags = {
  clothesPants: boolean;
  clothesShirt: boolean;
  clothesSweater: boolean;
  clothesTshirt: boolean;
  clothesUnderwear: boolean;
  clothesSocks: boolean;
};

export type DailyReportNeedFlags = {
  constipation: boolean;
  needsWipes: boolean;
  needsBrush: boolean;
  needsTowel: boolean;
  needsDiapers: boolean;
  needsBabyBottle: boolean;
  needsMilk: boolean;
};

const clothingLegacyKeys = {
  clothesPants: ["clothesPants", "pantchecked"],
  clothesShirt: ["clothesShirt", "clothesSweater", "shirtchecked"],
  clothesSweater: ["clothesSweater", "clothesShirt", "shirtchecked"],
  clothesTshirt: ["clothesTshirt", "tshirthecked"],
  clothesUnderwear: ["clothesUnderwear", "boxerchecked"],
  clothesSocks: ["clothesSocks", "sockschecked"],
} satisfies Record<keyof DailyReportClothingFlags, string[]>;

const needLegacyKeys = {
  constipation: ["constipation"],
  needsWipes: ["needsWipes", "wipeschecked"],
  needsBrush: ["needsBrush", "brushchecked"],
  needsTowel: ["needsTowel", "towelchecked"],
  needsDiapers: ["needsDiapers", "diaperschecked"],
  needsBabyBottle: ["needsBabyBottle", "babybottlechecked"],
  needsMilk: ["needsMilk", "milkchecked"],
} satisfies Record<keyof DailyReportNeedFlags, string[]>;

export function legacyDailyRecord(value: unknown): LegacyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as LegacyRecord)
    : {};
}

export function legacyDailyText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function legacyDailyBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "on", "checked"].includes(normalized);
  }
  return false;
}

export function legacyDailyNumber(value: unknown): number | null {
  const text = legacyDailyText(value);
  if (!text || text === "0") return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function legacyDailySourceDatabase(legacyData: unknown): string | null {
  return legacyDailyText(legacyDailyRecord(legacyData).sourceDatabase);
}

export function legacyDailyFoodId(
  legacyData: unknown,
  key: "breakfast_id" | "lunch_id",
): number | null {
  return legacyDailyNumber(legacyDailyRecord(legacyData)[key]);
}

export function buildLegacyFoodNameMap(
  foods: LegacyFoodNameSource[],
): LegacyFoodNameMap {
  const names = new Map<string, string>();

  for (const food of foods) {
    if (!food.legacyId) continue;
    if (food.sourceDatabase) {
      names.set(`${food.sourceDatabase}:${food.legacyId}`, food.name);
    }
    if (!names.has(String(food.legacyId))) {
      names.set(String(food.legacyId), food.name);
    }
  }

  return names;
}

export function legacyDailyFoodName(
  legacyData: unknown,
  key: "breakfast_id" | "lunch_id",
  foodNames: LegacyFoodNameMap,
): string | null {
  const id = legacyDailyFoodId(legacyData, key);
  if (!id) return null;

  const sourceDatabase = legacyDailySourceDatabase(legacyData);
  if (sourceDatabase) {
    const sourceMatch = foodNames.get(`${sourceDatabase}:${id}`);
    if (sourceMatch) return sourceMatch;
  }

  return foodNames.get(String(id)) ?? null;
}

export function dailyReportFoodLabel({
  relatedName,
  legacyData,
  legacyIdKey,
  legacyFoodNames,
}: {
  relatedName?: string | null;
  legacyData: unknown;
  legacyIdKey: "breakfast_id" | "lunch_id";
  legacyFoodNames: LegacyFoodNameMap;
}) {
  if (relatedName) return relatedName;

  const legacyName = legacyDailyFoodName(
    legacyData,
    legacyIdKey,
    legacyFoodNames,
  );
  if (legacyName) return legacyName;

  const legacyId = legacyDailyFoodId(legacyData, legacyIdKey);
  return legacyId ? `Food #${legacyId}` : null;
}

export function dailyReportClothingFlags(
  legacyData: unknown,
): DailyReportClothingFlags {
  const legacy = legacyDailyRecord(legacyData);
  const clothesShirt = clothingLegacyKeys.clothesShirt.some((key) =>
    legacyDailyBool(legacy[key]),
  );

  return {
    clothesPants: clothingLegacyKeys.clothesPants.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    clothesShirt,
    clothesSweater: clothesShirt,
    clothesTshirt: clothingLegacyKeys.clothesTshirt.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    clothesUnderwear: clothingLegacyKeys.clothesUnderwear.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    clothesSocks: clothingLegacyKeys.clothesSocks.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
  };
}

export function dailyReportNeedFlags(legacyData: unknown): DailyReportNeedFlags {
  const legacy = legacyDailyRecord(legacyData);

  return {
    constipation: needLegacyKeys.constipation.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsWipes: needLegacyKeys.needsWipes.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsBrush: needLegacyKeys.needsBrush.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsTowel: needLegacyKeys.needsTowel.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsDiapers: needLegacyKeys.needsDiapers.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsBabyBottle: needLegacyKeys.needsBabyBottle.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
    needsMilk: needLegacyKeys.needsMilk.some((key) =>
      legacyDailyBool(legacy[key]),
    ),
  };
}

export function dailyReportLegacyDataPatch(
  data: Pick<
    DailyReportFormValues,
    | "clothesPants"
    | "clothesSweater"
    | "clothesTshirt"
    | "clothesUnderwear"
    | "clothesSocks"
    | "constipation"
    | "needsWipes"
    | "needsBrush"
    | "needsTowel"
    | "needsDiapers"
    | "needsBabyBottle"
    | "needsMilk"
  >,
  current?: unknown,
): Prisma.InputJsonValue {
  const next: Record<string, unknown> = {
    ...legacyDailyRecord(current),
    clothesPants: data.clothesPants,
    clothesShirt: data.clothesSweater,
    clothesSweater: data.clothesSweater,
    clothesTshirt: data.clothesTshirt,
    clothesUnderwear: data.clothesUnderwear,
    clothesSocks: data.clothesSocks,
    constipation: Boolean(data.constipation),
    needsWipes: Boolean(data.needsWipes),
    needsBrush: Boolean(data.needsBrush),
    needsTowel: Boolean(data.needsTowel),
    needsDiapers: Boolean(data.needsDiapers),
    needsBabyBottle: Boolean(data.needsBabyBottle),
    needsMilk: Boolean(data.needsMilk),
  };

  next.pantchecked = data.clothesPants ? "1" : "0";
  next.shirtchecked = data.clothesSweater ? "1" : "0";
  next.tshirthecked = data.clothesTshirt ? "1" : "0";
  next.boxerchecked = data.clothesUnderwear ? "1" : "0";
  next.sockschecked = data.clothesSocks ? "1" : "0";
  next.constipation = data.constipation ? "1" : "0";
  next.wipeschecked = data.needsWipes ? "1" : "0";
  next.brushchecked = data.needsBrush ? "1" : "0";
  next.towelchecked = data.needsTowel ? "1" : "0";
  next.diaperschecked = data.needsDiapers ? "1" : "0";
  next.babybottlechecked = data.needsBabyBottle ? "1" : "0";
  next.milkchecked = data.needsMilk ? "1" : "0";

  return JSON.parse(JSON.stringify(next)) as Prisma.InputJsonValue;
}
