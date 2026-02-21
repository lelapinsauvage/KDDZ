"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { FoodCategory, MealType, Prisma } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface GetFoodsParams {
  category?: FoodCategory;
  isActive?: boolean;
  search?: string;
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

interface SetFoodCalendarEntryData {
  branchId: string;
  date: string; // ISO date
  mealType: MealType;
  foodId: string;
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

// ─────────────────────────────────────────────
// getFoods — List food items
// ─────────────────────────────────────────────

export async function getFoods(params: GetFoodsParams = {}) {
  try {
    const { category, isActive, search } = params;

    const where: Prisma.FoodWhereInput = {};

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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!input.name || !input.category) {
      return { error: "name and category are required" };
    }

    const food = await db.food.create({
      data: {
        name: input.name,
        category: input.category,
        isActive: input.isActive ?? true,
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.food.findUnique({ where: { id } });
    if (!existing) {
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.food.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Food item not found" };
    }

    await db.food.delete({ where: { id } });

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
    const { branchId, weekStart } = params;

    if (!branchId || !weekStart) {
      return { error: "branchId and weekStart are required" };
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
// setFoodCalendarEntry — Upsert on unique constraint
// ─────────────────────────────────────────────

export async function setFoodCalendarEntry(input: SetFoodCalendarEntryData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!input.branchId || !input.date || !input.mealType || !input.foodId) {
      return { error: "branchId, date, mealType, and foodId are required" };
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
// deleteFoodCalendarEntry
// ─────────────────────────────────────────────

export async function deleteFoodCalendarEntry(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const existing = await db.foodCalendar.findUnique({ where: { id } });
    if (!existing) {
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
