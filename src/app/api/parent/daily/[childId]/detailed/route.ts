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
        milks: { orderBy: { time: "asc" } },
      },
      orderBy: { reportDate: "desc" },
    });

    const header = makeHeader(formatChildName(child), true, reports.length);

    const items = reports.map((r) => ({
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
      diarrhea: r.diarrhea ? "1" : "0",
      ur_pot: String(r.urinePotty),
      stool_pot: String(r.stoolPotty),
      ur_di: String(r.urineDiaper),
      stool_di: String(r.stoolDiaper),
      remarks: r.remarks ?? "",
      mood: r.mood ?? "",
      mood2: "",
      constipation: "",
      sleep_from1: "",
      sleep_to1: "",
      sleep_from2: "",
      sleep_to2: "",
      cough: r.cough ? "1" : "0",
      rnose: r.runnyNose ? "1" : "0",
      vomit: r.vomit ? "1" : "0",
      pantchecked: "",
      shirtchecked: "",
      tshirthecked: "",
      boxerchecked: "",
      sockschecked: "",
      brushchecked: "",
      towelchecked: "",
      diaperschecked: "",
      babybottlechecked: "",
      milkchecked: "",
      wipeschecked: "",
      takenmeds_Arr: [] as string[],
      fever: r.fevers.map((f) => ({
        fvalue: f.temperature.toString(),
        ftime: formatTime(f.time),
      })),
      milk: r.milks.map((m) => ({
        mcc: String(m.amountCc),
        mtime: formatTime(m.time),
      })),
      bname: r.breakfastFood?.name ?? "",
      lname: r.lunchFood?.name ?? "",
    }));

    return jsonSuccess([header, ...items]);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
