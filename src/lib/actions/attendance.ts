"use server";

import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";
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
    const { organizationId: orgId } = await requireOrg();

    // Verify child belongs to org
    if (!(await verifyChildAccess(childId, orgId))) {
      return [];
    }

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
    const { organizationId: orgId } = await requireOrg();

    // Verify child belongs to org
    if (!(await verifyChildAccess(childId, orgId))) {
      return [];
    }

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
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { userId, organizationId: orgId } = result.ctx;

  try {
    // Validate required fields
    if (!data.childId) {
      return { success: false, error: "Child ID is required" };
    }
    if (!data.date) {
      return { success: false, error: "Date is required" };
    }

    // Verify child exists and belongs to org
    const child = await db.child.findFirst({
      where: { id: data.childId, branch: { organizationId: orgId } },
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
        createdById: userId,
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

// ── markBulkAttendance ───────────────────────────

export async function markBulkAttendance(data: {
  date: string;
  absentChildIds: string[];
}): Promise<{ success: boolean; created: number; error?: string }> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, created: 0, error: result.error };
  const { userId, organizationId: orgId } = result.ctx;

  try {
    // Verify all children belong to org
    if (data.absentChildIds.length > 0) {
      const uniqueIds = [...new Set(data.absentChildIds)];
      const validCount = await db.child.count({
        where: { id: { in: uniqueIds }, branch: { organizationId: orgId } },
      });
      if (validCount !== uniqueIds.length) {
        return { success: false, created: 0, error: "Some children do not belong to your organization" };
      }
    }

    const dateObj = new Date(data.date);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find existing absence reports for today to avoid duplicates
    const existing = await db.absenceReport.findMany({
      where: {
        date: { gte: dateObj, lt: nextDay },
        childId: { in: data.absentChildIds },
      },
      select: { childId: true },
    });

    const existingSet = new Set(existing.map((e) => e.childId));
    const toCreate = data.absentChildIds.filter((id) => !existingSet.has(id));

    if (toCreate.length > 0) {
      await db.$transaction(
        toCreate.map((childId) =>
          db.absenceReport.create({
            data: {
              childId,
              date: dateObj,
              reason: "Marked absent during attendance",
              status: "PENDING",
              createdById: userId,
            },
          })
        )
      );
    }

    revalidatePath("/today");
    revalidatePath("/absent-reports");

    return { success: true, created: toCreate.length };
  } catch (error) {
    console.error("markBulkAttendance error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to mark attendance";
    return { success: false, created: 0, error: message };
  }
}
