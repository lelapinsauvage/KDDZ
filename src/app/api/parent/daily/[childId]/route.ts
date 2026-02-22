import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  mapPortionSize,
  formatTime,
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

    const reports = await db.dailyReport.findMany({
      where: { childId, status: "SUBMITTED" },
      include: {
        breakfastFood: true,
        lunchFood: true,
        fevers: { orderBy: { time: "desc" } },
        milks: true,
      },
      orderBy: { reportDate: "desc" },
    });

    const header = makeHeader(formatChildName(child), true, reports.length);

    const items = reports.map((r) => {
      // Flatten fevers into numeric indices (0-7): pairs of fvalue, ftime (max 4)
      const feverFlat: Record<string, string> = {};
      for (let i = 0; i < 4; i++) {
        const fever = r.fevers[i];
        feverFlat[String(i * 2)] = fever ? fever.temperature.toString() : "";
        feverFlat[String(i * 2 + 1)] = fever ? formatTime(fever.time) : "";
      }

      const milk = r.milks[0];

      return {
        report_id: r.id,
        reportdate: formatDate(r.reportDate),
        status: r.status,
        bftime: formatTime(r.breakfastTime),
        breakf: mapPortionSize(r.breakfastPortion),
        lntime: formatTime(r.lunchTime),
        lunchf: mapPortionSize(r.lunchPortion),
        dessert: r.dessert ?? "",
        has_dess: r.dessert ? "1" : "0",
        dess_portion: mapPortionSize(r.dessertPortion),
        desstime: formatTime(r.dessertTime),
        is_sleep: r.isSleep ? "1" : "0",
        sleep_from: formatTime(r.sleepFrom),
        sleep_to: formatTime(r.sleepTo),
        diahria: r.diarrhea ? "1" : "0",
        ur_pot: String(r.urinePotty),
        stool_pot: String(r.stoolPotty),
        ur_di: String(r.urineDiaper),
        stool_di: String(r.stoolDiaper),
        remarks: r.remarks ?? "",
        pantchecked: "",
        shirtchecked: "",
        tshirthecked: "",
        boxerchecked: "",
        sockschecked: "",
        ...feverFlat,
        mcc: milk ? milk.amountCc : 0,
        mtime: milk ? formatTime(milk.time) : "00:00",
        bname: r.breakfastFood?.name ?? "",
        lname: r.lunchFood?.name ?? "",
      };
    });

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
