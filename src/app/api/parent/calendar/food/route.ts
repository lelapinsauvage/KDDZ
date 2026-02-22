import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatChildName,
  formatDate,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  try {
    const child = parentUser.child;

    const foodCalendars = await db.foodCalendar.findMany({
      where: { branchId: child.branchId },
      include: { food: true },
      orderBy: { date: "asc" },
    });

    // Group by date: each date gets breakfast, lunch, dessert
    const dateMap = new Map<
      string,
      { bname: string; lname: string; dessert: string; date: string }
    >();

    for (const fc of foodCalendars) {
      const dateStr = formatDate(fc.date);
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { bname: "", lname: "", dessert: "", date: dateStr });
      }
      const entry = dateMap.get(dateStr)!;
      if (fc.mealType === "BREAKFAST") {
        entry.bname = fc.food.name;
      } else if (fc.mealType === "LUNCH") {
        entry.lname = fc.food.name;
      } else if (fc.mealType === "DESSERT") {
        entry.dessert = fc.food.name;
      }
    }

    const items = [...dateMap.values()];
    const header = makeHeader(
      formatChildName(child),
      true,
      items.length,
      { branch_id: child.branchId }
    );

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
