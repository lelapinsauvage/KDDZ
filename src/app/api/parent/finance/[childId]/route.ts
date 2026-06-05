import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  formatDate,
  makeHeader,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  try {
    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) {
      return jsonSuccess([makeHeader("", false, 0)]);
    }

    const payments = await db.payment.findMany({
      where: { childId, deletedAt: null },
      orderBy: { date: "desc" },
    });

    const header = makeHeader(formatChildName(child), true, payments.length);

    const items = payments.map((p) => ({
      type: p.method,
      target: p.category,
      for: p.notes ?? "",
      year: new Date(p.date).getFullYear().toString(),
      from: formatDate(p.dateFrom),
      to: formatDate(p.dateTo),
      currency: p.currency,
      datetime: formatDate(p.date),
      amount: p.amount.toString(),
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
