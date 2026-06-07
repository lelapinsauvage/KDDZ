"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import type { FoodCategory, MealType, Prisma } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetFoodsParams {
  category?: FoodCategory;
  isActive?: boolean;
  search?: string;
  includeDeleted?: boolean;
}

interface CreateFoodData {
  name: string;
  category: FoodCategory;
  isActive?: boolean;
}

interface UpdateFoodData {
  name?: string;
  category?: FoodCategory;
  isActive?: boolean;
}

interface GetFoodCalendarParams {
  branchId: string;
  weekStart: string; // ISO date of Monday
}

interface GetFoodCalendarMonthParams {
  branchId: string;
  year: number;
  month: number; // 1-12
}

interface SetFoodCalendarEntryData {
  branchId: string;
  date: string; // ISO date
  mealType: MealType;
  foodId: string;
}

interface SetFoodCalendarDayData {
  branchId: string;
  date: string; // ISO date
  applyToAllBranches?: boolean;
  meals: Array<{
    mealType: MealType;
    foodId: string | null;
  }>;
}

interface FoodCalendarResult {
  [date: string]: {
    BREAKFAST?: FoodCalendarEntry;
    LUNCH?: FoodCalendarEntry;
    DESSERT?: FoodCalendarEntry;
    SNACK?: FoodCalendarEntry;
  };
}

interface FoodCalendarEntry {
  id: string;
  foodId: string;
  food: {
    id: string;
    name: string;
    category: FoodCategory;
    isActive: boolean;
  };
}

const VALID_MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DESSERT", "SNACK"];

// ─────────────────────────────────────────────
// getFoods — List food items
// ─────────────────────────────────────────────

export async function getFoods(params: GetFoodsParams = {}) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const { category, isActive, search, includeDeleted } = params;

    const where: Prisma.FoodWhereInput = {
      organizationId: orgId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const foods = await db.food.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return { foods };
  } catch (error) {
    console.error("getFoods error:", error);
    return { foods: [] };
  }
}

// ─────────────────────────────────────────────
// createFood
// ─────────────────────────────────────────────

export async function createFood(input: CreateFoodData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    if (!input.name || !input.category) {
      return { error: "name and category are required" };
    }

    const food = await db.food.create({
      data: {
        name: input.name,
        category: input.category,
        isActive: input.isActive ?? true,
        organizationId: ctx.organizationId,
      },
    });

    revalidatePath("/food");
    return { success: true, foodId: food.id };
  } catch (error) {
    console.error("createFood error:", error);
    return { error: "Failed to create food item" };
  }
}

// ─────────────────────────────────────────────
// updateFood
// ─────────────────────────────────────────────

export async function updateFood(id: string, input: UpdateFoodData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    const existing = await db.food.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return { error: "Food item not found" };
    }
    if (existing.organizationId !== ctx.organizationId) {
      return { error: "Food item not found" };
    }

    const updateData: Prisma.FoodUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    const food = await db.food.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/food");
    return { success: true, foodId: food.id };
  } catch (error) {
    console.error("updateFood error:", error);
    return { error: "Failed to update food item" };
  }
}

// ─────────────────────────────────────────────
// deleteFood
// ─────────────────────────────────────────────

export async function deleteFood(id: string) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    const existing = await db.food.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Food item not found" };
    }
    if (existing.organizationId !== ctx.organizationId) {
      return { error: "Food item not found" };
    }

    await db.food.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/food");
    return { success: true };
  } catch (error) {
    console.error("deleteFood error:", error);
    return { error: "Failed to delete food item" };
  }
}

// ─────────────────────────────────────────────
// getFoodCalendar — Get food calendar for a week (Mon-Fri)
// ─────────────────────────────────────────────

export async function getFoodCalendar(params: GetFoodCalendarParams) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const { branchId, weekStart } = params;

    if (!branchId || !weekStart) {
      return { error: "branchId and weekStart are required" };
    }

    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { error: "Branch not found" };
    }

    const monday = new Date(weekStart);
    // Generate Mon-Fri dates
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }

    const friday = dates[4];

    const entries = await db.foodCalendar.findMany({
      where: {
        branchId,
        date: {
          gte: monday,
          lte: friday,
        },
      },
      include: {
        food: true,
      },
    });

    // Structure the result as { [date]: { BREAKFAST?, LUNCH?, DESSERT?, SNACK? } }
    const calendar: FoodCalendarResult = {};

    for (const d of dates) {
      const dateKey = d.toISOString().split("T")[0];
      calendar[dateKey] = {};
    }

    for (const entry of entries) {
      const dateKey = entry.date.toISOString().split("T")[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = {};
      }
      calendar[dateKey][entry.mealType as MealType] = {
        id: entry.id,
        foodId: entry.foodId,
        food: {
          id: entry.food.id,
          name: entry.food.name,
          category: entry.food.category,
          isActive: entry.food.isActive,
        },
      };
    }

    return { calendar };
  } catch (error) {
    console.error("getFoodCalendar error:", error);
    return { error: "Failed to load food calendar" };
  }
}

// ─────────────────────────────────────────────
// getFoodCalendarMonth — Get food calendar for full month
// ─────────────────────────────────────────────

export async function getFoodCalendarMonth(params: GetFoodCalendarMonthParams) {
  try {
    const { organizationId: orgId } = await requireOrg();

    const { branchId, year, month } = params;

    if (!branchId || !year || !month) {
      return { error: "branchId, year, and month are required" };
    }

    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { error: "Branch not found" };
    }

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const entries = await db.foodCalendar.findMany({
      where: {
        branchId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        food: true,
      },
    });

    const calendar: FoodCalendarResult = {};

    for (const entry of entries) {
      const dateKey = entry.date.toISOString().split("T")[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = {};
      }
      calendar[dateKey][entry.mealType as MealType] = {
        id: entry.id,
        foodId: entry.foodId,
        food: {
          id: entry.food.id,
          name: entry.food.name,
          category: entry.food.category,
          isActive: entry.food.isActive,
        },
      };
    }

    return { calendar };
  } catch (error) {
    console.error("getFoodCalendarMonth error:", error);
    return { error: "Failed to load food calendar" };
  }
}

// ─────────────────────────────────────────────
// setFoodCalendarEntry — Upsert on unique constraint
// ─────────────────────────────────────────────

export async function setFoodCalendarEntry(input: SetFoodCalendarEntryData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    if (!input.branchId || !input.date || !input.mealType || !input.foodId) {
      return { error: "branchId, date, mealType, and foodId are required" };
    }

    if (!(await verifyBranchAccess(input.branchId, ctx.organizationId))) {
      return { error: "Branch not found" };
    }

    const food = await db.food.findUnique({ where: { id: input.foodId } });
    if (!food || food.organizationId !== ctx.organizationId) {
      return { error: "Food item not found" };
    }

    const dateObj = new Date(input.date);

    const entry = await db.foodCalendar.upsert({
      where: {
        branchId_date_mealType: {
          branchId: input.branchId,
          date: dateObj,
          mealType: input.mealType,
        },
      },
      update: {
        foodId: input.foodId,
      },
      create: {
        branchId: input.branchId,
        date: dateObj,
        mealType: input.mealType,
        foodId: input.foodId,
      },
    });

    revalidatePath("/food");
    return { success: true, entryId: entry.id };
  } catch (error) {
    console.error("setFoodCalendarEntry error:", error);
    return { error: "Failed to set food calendar entry" };
  }
}

// ─────────────────────────────────────────────
// setFoodCalendarDay — Save one calendar day, optionally for every branch
// ─────────────────────────────────────────────

export async function setFoodCalendarDay(input: SetFoodCalendarDayData) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    if (!input.branchId || !input.date || !Array.isArray(input.meals) || input.meals.length === 0) {
      return { error: "branchId, date, and meals are required" };
    }

    if (!(await verifyBranchAccess(input.branchId, ctx.organizationId))) {
      return { error: "Branch not found" };
    }

    const dateObj = new Date(input.date);
    if (Number.isNaN(dateObj.getTime())) {
      return { error: "Invalid date" };
    }

    const meals = input.meals.map((meal) => ({
      mealType: meal.mealType,
      foodId: typeof meal.foodId === "string" ? meal.foodId.trim() || null : null,
    }));

    if (meals.some((meal) => !VALID_MEAL_TYPES.includes(meal.mealType))) {
      return { error: "Invalid meal type" };
    }

    const foodIds = Array.from(
      new Set(meals.map((meal) => meal.foodId).filter(Boolean) as string[])
    );

    if (foodIds.length > 0) {
      const foods = await db.food.findMany({
        where: {
          id: { in: foodIds },
          organizationId: ctx.organizationId,
        },
        select: { id: true },
      });
      if (foods.length !== foodIds.length) {
        return { error: "Food item not found" };
      }
    }

    const targetBranchIds = input.applyToAllBranches
      ? (
          await db.branch.findMany({
            where: { organizationId: ctx.organizationId },
            select: { id: true },
          })
        ).map((branch) => branch.id)
      : [input.branchId];

    await db.$transaction(async (tx) => {
      for (const meal of meals) {
        if (!meal.foodId) {
          await tx.foodCalendar.deleteMany({
            where: {
              branchId: { in: targetBranchIds },
              date: dateObj,
              mealType: meal.mealType,
            },
          });
          continue;
        }

        for (const branchId of targetBranchIds) {
          await tx.foodCalendar.upsert({
            where: {
              branchId_date_mealType: {
                branchId,
                date: dateObj,
                mealType: meal.mealType,
              },
            },
            update: {
              foodId: meal.foodId,
            },
            create: {
              branchId,
              date: dateObj,
              mealType: meal.mealType,
              foodId: meal.foodId,
            },
          });
        }
      }
    });

    revalidatePath("/food");
    revalidatePath("/food/calendar");
    revalidatePath("/food/calendar/print");
    return { success: true, branchCount: targetBranchIds.length };
  } catch (error) {
    console.error("setFoodCalendarDay error:", error);
    return { error: "Failed to set food calendar day" };
  }
}

// ─────────────────────────────────────────────
// deleteFoodCalendarEntry
// ─────────────────────────────────────────────

export async function deleteFoodCalendarEntry(id: string) {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { error: result.error };
    const { ctx } = result;

    const existing = await db.foodCalendar.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) {
      return { error: "Food calendar entry not found" };
    }
    if (existing.branch.organizationId !== ctx.organizationId) {
      return { error: "Food calendar entry not found" };
    }

    await db.foodCalendar.delete({ where: { id } });

    revalidatePath("/food");
    return { success: true };
  } catch (error) {
    console.error("deleteFoodCalendarEntry error:", error);
    return { error: "Failed to delete food calendar entry" };
  }
}
