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
  dailyReportId?: string | null;
  absenceReportId?: string | null;
}

interface CreateAbsenceData {
  childId: string;
  date: string;
  reason?: string;
}

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type ChildAttendanceCellCode = "P" | "A" | "N" | "W" | "H" | "" | "-";

export interface ChildAttendanceMatrixCell {
  day: number;
  date: string | null;
  code: ChildAttendanceCellCode;
  label: string;
  href: string | null;
}

export interface ChildAttendanceMatrixMonth {
  monthKey: string;
  monthLabel: string;
  presentCount: number;
  absentCount: number;
  noReportCount: number;
  cells: ChildAttendanceMatrixCell[];
}

export interface ChildAttendanceMatrix {
  startDate: string;
  endDate: string;
  months: ChildAttendanceMatrixMonth[];
  totals: {
    present: number;
    absent: number;
    noReport: number;
    weekends: number;
    holidays: number;
  };
}

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function normalizeUtcDay(date: Date) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addUtcMonths(date: Date, months: number) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

function fallbackSchoolYear(today: Date) {
  const year = today.getUTCMonth() >= 9
    ? today.getUTCFullYear()
    : today.getUTCFullYear() - 1;
  return {
    startDate: utcDate(year, 9, 1),
    endDate: utcDate(year + 1, 8, 30),
  };
}

function formatReportTime(date: Date | null) {
  if (!date) return null;
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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
        id: true,
        reportDate: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
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
      select: { id: true, date: true },
    });

    const absentDates = new Map(
      absences.map((a) => [a.date.toISOString().split("T")[0], a.id])
    );

    // Map daily reports to attendance records
    const records: AttendanceRecord[] = reports.map((report) => {
      const dateStr = report.reportDate.toISOString().split("T")[0];
      const isAbsent = absentDates.has(dateStr);

      return {
        date: dateStr,
        checkIn: formatReportTime(report.checkInTime),
        checkOut: formatReportTime(report.checkOutTime),
        status: isAbsent ? "ABSENT" : report.status === "SUBMITTED" ? "PRESENT" : "DRAFT",
        dailyReportId: report.id,
        absenceReportId: absentDates.get(dateStr) ?? null,
      };
    });

    // Add absent days that have no daily report
    for (const dateStr of absentDates) {
      const [date, absenceReportId] = dateStr;
      const hasReport = records.some((r) => r.date === date);
      if (!hasReport) {
        records.push({
          date,
          checkIn: null,
          checkOut: null,
          status: "ABSENT",
          dailyReportId: null,
          absenceReportId,
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

// ── getChildAttendanceMatrix ─────────────────────
// Legacy child_attend_det.php renders one row per month with day columns 1-31.

export async function getChildAttendanceMatrix(
  childId: string
): Promise<ChildAttendanceMatrix> {
  const empty: ChildAttendanceMatrix = {
    startDate: "",
    endDate: "",
    months: [],
    totals: { present: 0, absent: 0, noReport: 0, weekends: 0, holidays: 0 },
  };

  try {
    const { organizationId: orgId } = await requireOrg();

    const child = await db.child.findFirst({
      where: { id: childId, branch: { organizationId: orgId } },
      select: {
        id: true,
        branchId: true,
        enrollmentDate: true,
        schoolYear: {
          select: { startDate: true, endDate: true },
        },
      },
    });

    if (!child) return empty;

    const today = normalizeUtcDay(new Date());
    const fallback = fallbackSchoolYear(today);
    const startDate = normalizeUtcDay(child.schoolYear?.startDate ?? fallback.startDate);
    const configuredEndDate = normalizeUtcDay(child.schoolYear?.endDate ?? fallback.endDate);
    const endDate = today < configuredEndDate ? today : configuredEndDate;
    const joiningDate = child.enrollmentDate
      ? normalizeUtcDay(child.enrollmentDate)
      : startDate;

    const [dailyReports, absenceReports, holidays] = await Promise.all([
      db.dailyReport.findMany({
        where: {
          childId,
          reportDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          reportDate: true,
          status: true,
        },
      }),
      db.absenceReport.findMany({
        where: {
          childId,
          date: { gte: startDate, lte: endDate },
          status: { not: "REJECTED" },
        },
        select: {
          id: true,
          date: true,
        },
      }),
      db.holiday.findMany({
        where: {
          isActive: true,
          OR: [
            { branchId: null },
            { branchId: child.branchId },
          ],
          date: { lte: endDate },
        },
        select: {
          date: true,
          endDate: true,
          repeated: true,
        },
      }),
    ]);

    const reportsByDate = new Map(
      dailyReports.map((report) => [dateKey(report.reportDate), report])
    );
    const absencesByDate = new Map(
      absenceReports.map((absence) => [dateKey(absence.date), absence])
    );

    const oneTimeHolidayDates = new Set<string>();
    const repeatedHolidayKeys = new Set<string>();
    for (const holiday of holidays) {
      if (holiday.repeated) {
        repeatedHolidayKeys.add(dateKey(holiday.date).slice(5));
        continue;
      }

      const holidayStart = normalizeUtcDay(holiday.date);
      const holidayEnd = normalizeUtcDay(holiday.endDate ?? holiday.date);
      for (
        let cursor = holidayStart;
        cursor <= holidayEnd;
        cursor = utcDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1)
      ) {
        oneTimeHolidayDates.add(dateKey(cursor));
      }
    }

    const months: ChildAttendanceMatrixMonth[] = [];
    const totals = { present: 0, absent: 0, noReport: 0, weekends: 0, holidays: 0 };

    for (
      let cursor = utcDate(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
      cursor <= endDate;
      cursor = addUtcMonths(cursor, 1)
    ) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const daysInMonth = daysInUtcMonth(year, month);
      const cells: ChildAttendanceMatrixCell[] = [];
      let presentCount = 0;
      let absentCount = 0;
      let noReportCount = 0;

      for (let day = 1; day <= 31; day += 1) {
        if (day > daysInMonth) {
          cells.push({ day, date: null, code: "-", label: "No day", href: null });
          continue;
        }

        const current = utcDate(year, month, day);
        const key = dateKey(current);
        const report = reportsByDate.get(key);
        const absence = absencesByDate.get(key);
        const isSunday = current.getUTCDay() === 0;
        const isHoliday =
          oneTimeHolidayDates.has(key) || repeatedHolidayKeys.has(key.slice(5));
        let code: ChildAttendanceCellCode = "N";
        let label = "No report";
        let href: string | null = `/daily-reports/new?childId=${childId}&date=${key}`;

        if (current >= today || current < joiningDate) {
          code = "";
          label = "Out of range";
          href = null;
        }

        if (report?.status === "SUBMITTED") {
          code = "P";
          label = "Present";
          href = `/daily-reports/${report.id}`;
        }

        if (absence) {
          code = "A";
          label = "Absent";
          href = `/absent-reports/${absence.id}`;
        }

        if (isSunday) {
          code = "W";
          label = "Weekend";
          href = null;
        }

        if (isHoliday) {
          code = "H";
          label = "Holiday";
          href = null;
        }

        if (code === "P") {
          presentCount += 1;
          totals.present += 1;
        } else if (code === "A") {
          absentCount += 1;
          totals.absent += 1;
        } else if (code === "N") {
          noReportCount += 1;
          totals.noReport += 1;
        } else if (code === "W") {
          totals.weekends += 1;
        } else if (code === "H") {
          totals.holidays += 1;
        }

        cells.push({ day, date: key, code, label, href });
      }

      months.push({
        monthKey: monthKey(cursor),
        monthLabel: cursor.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).replace(" ", "-"),
        presentCount,
        absentCount,
        noReportCount,
        cells,
      });
    }

    return {
      startDate: dateKey(startDate),
      endDate: dateKey(endDate),
      months,
      totals,
    };
  } catch (error) {
    console.error("getChildAttendanceMatrix error:", error);
    return empty;
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
        attachments: {
          orderBy: { createdAt: "asc" },
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

// ── getMonthlyAttendanceGrid ─────────────────────

export interface HeatmapChild {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
}

export type CellStatus = "PRESENT" | "ABSENT" | "NO_REPORT" | "WEEKEND" | "HOLIDAY";

export interface HeatmapRow {
  child: HeatmapChild;
  /** Map of day number (1-31) → status */
  days: Record<number, CellStatus>;
}

export interface MonthlyAttendanceGrid {
  rows: HeatmapRow[];
  daysInMonth: number;
  month: number;
  year: number;
}

export async function getMonthlyAttendanceGrid(
  month: number,
  year: number,
  branchId?: string,
  classId?: string
): Promise<MonthlyAttendanceGrid> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch active children with optional branch/class filters
    const childWhere: {
      branch: { organizationId: string };
      isActive: boolean;
      isDraft: boolean;
      branchId?: string;
      classId?: string;
    } = {
      branch: { organizationId: orgId },
      isActive: true,
      isDraft: false,
    };
    if (branchId) childWhere.branchId = branchId;
    if (classId) childWhere.classId = classId;

    const children = await db.child.findMany({
      where: childWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    if (children.length === 0) {
      return { rows: [], daysInMonth, month, year };
    }

    const childIds = children.map((c) => c.id);

    // Fetch daily reports, absence reports, and holidays in parallel
    const [dailyReports, absenceReports, holidays] = await Promise.all([
      db.dailyReport.findMany({
        where: {
          childId: { in: childIds },
          reportDate: { gte: startDate, lt: endDate },
        },
        select: { childId: true, reportDate: true },
      }),
      db.absenceReport.findMany({
        where: {
          childId: { in: childIds },
          date: { gte: startDate, lt: endDate },
        },
        select: { childId: true, date: true },
      }),
      db.holiday.findMany({
        where: {
          isActive: true,
          OR: [
            { date: { gte: startDate, lt: endDate } },
            { endDate: { gte: startDate } },
          ],
          AND: [
            {
              OR: [
                { branchId: null },
                { branch: { organizationId: orgId } },
              ],
            },
            ...(branchId
              ? [{ OR: [{ branchId: null }, { branchId }] }]
              : []),
          ],
        },
        select: { date: true, endDate: true },
      }),
    ]);

    // Build set of holiday day numbers
    const holidayDays = new Set<number>();
    for (const h of holidays) {
      const hStart = h.date;
      const hEnd = h.endDate ?? h.date;
      for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, month - 1, d);
        if (current >= hStart && current <= hEnd) {
          holidayDays.add(d);
        }
      }
    }

    // Build set of weekend day numbers (Saturday=6, Sunday=0)
    const weekendDays = new Set<number>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow === 0 || dow === 6) weekendDays.add(d);
    }

    // Build lookup sets: childId → Set of day numbers
    const reportDays = new Map<string, Set<number>>();
    for (const r of dailyReports) {
      const day = r.reportDate.getDate();
      if (!reportDays.has(r.childId)) reportDays.set(r.childId, new Set());
      reportDays.get(r.childId)!.add(day);
    }

    const absenceDays = new Map<string, Set<number>>();
    for (const a of absenceReports) {
      const day = a.date.getDate();
      if (!absenceDays.has(a.childId)) absenceDays.set(a.childId, new Set());
      absenceDays.get(a.childId)!.add(day);
    }

    const rows: HeatmapRow[] = children.map((child) => {
      const childReports = reportDays.get(child.id);
      const childAbsences = absenceDays.get(child.id);
      const days: Record<number, CellStatus> = {};

      for (let d = 1; d <= daysInMonth; d++) {
        // Weekends and holidays override — daycare is closed
        if (weekendDays.has(d)) {
          days[d] = "WEEKEND";
        } else if (holidayDays.has(d)) {
          days[d] = "HOLIDAY";
        } else {
          const hasAbsence = childAbsences?.has(d) ?? false;
          const hasReport = childReports?.has(d) ?? false;
          if (hasAbsence) {
            days[d] = "ABSENT";
          } else if (hasReport) {
            days[d] = "PRESENT";
          } else {
            days[d] = "NO_REPORT";
          }
        }
      }

      return {
        child: {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          className: child.class?.name ?? null,
        },
        days,
      };
    });

    return { rows, daysInMonth, month, year };
  } catch (error) {
    console.error("getMonthlyAttendanceGrid error:", error);
    return { rows: [], daysInMonth: new Date(year, month, 0).getDate(), month, year };
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
