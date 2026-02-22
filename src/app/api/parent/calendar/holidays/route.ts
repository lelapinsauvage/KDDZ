import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  formatDate,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;

  try {
    const holidays = await db.holiday.findMany({
      orderBy: { date: "asc" },
    });

    const header = makeHeader("", true, holidays.length);

    const items = holidays.map((h) => ({
      description: h.name,
      date: formatDate(h.date),
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
