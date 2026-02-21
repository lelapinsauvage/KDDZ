"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface CreateAbsenceData {
  childId: string;
  date: string;
  reason?: string;
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ── getChildAttendance ────────────────────────────

export async function getChildAttendance(
  childId: string,
  month?: string
): Promise<AttendanceRecord[]> {
  try {
    // Build date range filter for the month
    const where: { childId: string; reportDate?: { gte: Date; lt: Date } } = {
      childId,
    };

    if (month) {
      // month expected as "YYYY-MM" (e.g. "2025-02")
      const [year, mon] = month.split("-").map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1); // first day of next month
      where.reportDate = { gte: startDate, lt: endDate };
    }

    const reports = await db.dailyReport.findMany({
      where,
      orderBy: { reportDate: "desc" },
      select: {
        reportDate: true,
        status: true,
      },
    });

    // Also get absence reports for the same child/period to mark absent days
    const absenceWhere: {
      childId: string;
      date?: { gte: Date; lt: Date };
    } = { childId };

    if (where.reportDate) {
      absenceWhere.date = where.reportDate;
    }

    const absences = await db.absenceReport.findMany({
      where: absenceWhere,
      select: { date: true },
    });

    const absentDates = new Set(
      absences.map((a) => a.date.toISOString().split("T")[0])
    );

    // Map daily reports to attendance records
    const records: AttendanceRecord[] = reports.map((report) => {
      const dateStr = report.reportDate.toISOString().split("T")[0];
      const isAbsent = absentDates.has(dateStr);

      return {
        date: dateStr,
        checkIn: null, // DailyReport does not have checkIn/checkOut fields
        checkOut: null,
        status: isAbsent ? "ABSENT" : report.status === "SUBMITTED" ? "PRESENT" : "DRAFT",
      };
    });

    // Add absent days that have no daily report
    for (const dateStr of absentDates) {
      const hasReport = records.some((r) => r.date === dateStr);
      if (!hasReport) {
        records.push({
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: "ABSENT",
        });
      }
    }

    // Sort by date descending
    records.sort((a, b) => b.date.localeCompare(a.date));

    return records;
  } catch (error) {
    console.error("getChildAttendance error:", error);
    return [];
  }
}

// ── getChildAbsences ──────────────────────────────

export async function getChildAbsences(childId: string) {
  try {
    const absences = await db.absenceReport.findMany({
      where: { childId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return absences;
  } catch (error) {
    console.error("getChildAbsences error:", error);
    return [];
  }
}

// ── createAbsenceReport ───────────────────────────

export async function createAbsenceReport(
  data: CreateAbsenceData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Validate required fields
    if (!data.childId) {
      return { success: false, error: "Child ID is required" };
    }
    if (!data.date) {
      return { success: false, error: "Date is required" };
    }

    // Verify child exists
    const child = await db.child.findUnique({
      where: { id: data.childId },
    });
    if (!child) {
      return { success: false, error: "Child not found" };
    }

    const absence = await db.absenceReport.create({
      data: {
        childId: data.childId,
        date: new Date(data.date),
        reason: data.reason || null,
        status: "PENDING",
        createdById: session.user.id,
      },
    });

    revalidatePath(`/children/${data.childId}/absence`);
    revalidatePath(`/children/${data.childId}/attendance`);
    revalidatePath("/absent-reports");

    return { success: true, id: absence.id };
  } catch (error) {
    console.error("createAbsenceReport error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create absence report";
    return { success: false, error: message };
  }
}
