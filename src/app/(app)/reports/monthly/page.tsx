import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import MonthlyClient, {
  type MonthlyAttendanceCell,
  type MonthlyAttendanceRow,
  type MonthlyClassOption,
  type MonthlyBranchOption,
} from "./monthly-client";

interface PageProps {
  searchParams: Promise<{
    branch?: string | string[];
    class?: string | string[];
    classId?: string | string[];
    from?: string | string[];
    month?: string | string[];
    p?: string | string[];
    q?: string | string[];
  }>;
}

const dayColumns = Array.from({ length: 31 }, (_, index) => index + 1);

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function monthKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeMonthKey(value?: string | string[]) {
  const raw = firstParam(value)?.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return monthKeyFromDate(parsed);
}

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayKey(year: number, monthIndex: number, day: number) {
  return dateKey(utcDate(year, monthIndex, day));
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return utcDate(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function jsonString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const next = (value as Record<string, unknown>)[key];
  return typeof next === "string" ? next : null;
}

function addHolidayDate(target: Map<string, Set<string>>, branchId: string, key: string) {
  const current = target.get(branchId) ?? new Set<string>();
  current.add(key);
  target.set(branchId, current);
}

function sortByLegacyOrder<T extends { legacyId: number | null; name?: string | null }>(
  items: T[],
) {
  return [...items].sort((a, b) => {
    if (a.legacyId != null && b.legacyId != null && a.legacyId !== b.legacyId) {
      return a.legacyId - b.legacyId;
    }
    if (a.legacyId != null && b.legacyId == null) return -1;
    if (a.legacyId == null && b.legacyId != null) return 1;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

async function loadMonthlyAttendance({
  branchId,
  classId,
  monthKey,
}: {
  branchId: string | null;
  classId: string | null;
  monthKey: string;
}) {
  const { organizationId } = await requireOrg();
  const [year, month] = monthKey.split("-").map(Number);
  const monthIndex = month - 1;
  const startDate = utcDate(year, monthIndex, 1);
  const nextMonth = utcDate(year, monthIndex + 1, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = dateKey(new Date());

  const childWhere = {
    branch: { organizationId },
    isActive: true,
    isDraft: false,
    createdAt: { lt: nextMonth },
    ...(branchId ? { branchId } : {}),
    ...(classId ? { classId } : {}),
  };

  const [children, dailyReports, absenceReports, holidays, branches, classes] =
    await Promise.all([
      db.child.findMany({
        where: childWhere,
        select: {
          id: true,
          legacyId: true,
          childNumber: true,
          firstName: true,
          lastName: true,
          enrollmentDate: true,
          createdAt: true,
          branchId: true,
          classId: true,
          class: { select: { id: true, name: true, legacyId: true, branchId: true } },
          branch: { select: { id: true, name: true, prefix: true, legacyId: true } },
        },
      }),
      db.dailyReport.findMany({
        where: {
          status: "SUBMITTED",
          reportDate: { gte: startDate, lt: nextMonth },
          child: {
            branch: { organizationId },
            ...(branchId ? { branchId } : {}),
            ...(classId ? { classId } : {}),
          },
        },
        select: {
          id: true,
          childId: true,
          reportDate: true,
          legacyData: true,
        },
      }),
      db.absenceReport.findMany({
        where: {
          date: { gte: startDate, lt: nextMonth },
          status: { not: "REJECTED" },
          child: {
            branch: { organizationId },
            ...(branchId ? { branchId } : {}),
            ...(classId ? { classId } : {}),
          },
        },
        select: { id: true, childId: true, date: true },
      }),
      db.holiday.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ branchId: null }, { branch: { organizationId } }] },
            {
              OR: [
                { repeated: true },
                {
                  AND: [
                    { date: { lt: nextMonth } },
                    { OR: [{ endDate: null }, { endDate: { gte: startDate } }] },
                  ],
                },
              ],
            },
          ],
        },
        select: { date: true, endDate: true, repeated: true, branchId: true },
      }),
      db.branch.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, legacyId: true },
      }),
      db.class.findMany({
        where: {
          isActive: true,
          branch: { organizationId },
          ...(branchId ? { branchId } : {}),
        },
        select: { id: true, name: true, branchId: true, legacyId: true },
      }),
    ]);

  const reportByChildDate = new Map<string, (typeof dailyReports)[number]>();
  for (const report of dailyReports) {
    reportByChildDate.set(`${report.childId}:${dateKey(report.reportDate)}`, report);
  }

  const absenceByChildDate = new Map<string, (typeof absenceReports)[number]>();
  for (const absence of absenceReports) {
    absenceByChildDate.set(`${absence.childId}:${dateKey(absence.date)}`, absence);
  }

  const oneTimeGlobalHolidays = new Set<string>();
  const repeatedGlobalHolidays = new Set<string>();
  const oneTimeBranchHolidays = new Map<string, Set<string>>();
  const repeatedBranchHolidays = new Map<string, Set<string>>();

  for (const holiday of holidays) {
    const branchKey = holiday.branchId ?? "";
    if (holiday.repeated) {
      const key = dateKey(holiday.date).slice(5);
      if (holiday.branchId) {
        addHolidayDate(repeatedBranchHolidays, branchKey, key);
      } else {
        repeatedGlobalHolidays.add(key);
      }
      continue;
    }

    const holidayStart = holiday.date < startDate ? startDate : holiday.date;
    const holidayEnd = (holiday.endDate ?? holiday.date) >= nextMonth
      ? utcDate(year, monthIndex, daysInMonth)
      : (holiday.endDate ?? holiday.date);
    for (
      let cursor = utcDate(
        holidayStart.getUTCFullYear(),
        holidayStart.getUTCMonth(),
        holidayStart.getUTCDate(),
      );
      cursor <= holidayEnd;
      cursor = utcDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1)
    ) {
      const key = dateKey(cursor);
      if (holiday.branchId) {
        addHolidayDate(oneTimeBranchHolidays, branchKey, key);
      } else {
        oneTimeGlobalHolidays.add(key);
      }
    }
  }

  const rows: MonthlyAttendanceRow[] = sortByLegacyOrder(
    children.map((child) => ({
      ...child,
      name: child.childNumber ?? child.legacyId?.toString() ?? "",
    })),
  ).map((child) => {
    let presentCount = 0;
    let absentCount = 0;
    const joiningDate = dateKey(child.enrollmentDate ?? child.createdAt);
    const cells: MonthlyAttendanceCell[] = [];

    for (const day of dayColumns) {
      if (day > daysInMonth) {
        cells.push({ day, date: null, code: "-", label: "No day", href: null });
        continue;
      }

      const currentDate = dayKey(year, monthIndex, day);
      const mmdd = currentDate.slice(5);
      const report = reportByChildDate.get(`${child.id}:${currentDate}`);
      const absence = absenceByChildDate.get(`${child.id}:${currentDate}`);
      const reportLegacyStatus = jsonString(report?.legacyData, "status")?.toLowerCase();
      const isSunday = utcDate(year, monthIndex, day).getUTCDay() === 0;
      const isHoliday =
        oneTimeGlobalHolidays.has(currentDate) ||
        repeatedGlobalHolidays.has(mmdd) ||
        (child.branchId ? oneTimeBranchHolidays.get(child.branchId)?.has(currentDate) : false) ||
        (child.branchId ? repeatedBranchHolidays.get(child.branchId)?.has(mmdd) : false);

      let code: MonthlyAttendanceCell["code"] = "N";
      let label = "No Report";
      let href: string | null = `/daily-reports/new?childId=${encodeURIComponent(child.id)}&date=${currentDate}`;

      if (currentDate >= today || currentDate < joiningDate) {
        code = "";
        label = "Out of range";
        href = null;
      }

      if (report) {
        code = reportLegacyStatus === "absent" ? "A" : "P";
        label = code === "A" ? "Absent" : "Present";
        href = `/daily-reports/${encodeURIComponent(report.id)}`;
      }

      if (absence) {
        code = "A";
        label = "Absent";
        href = `/absent-reports/${encodeURIComponent(absence.id)}`;
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

      if (code === "P") presentCount += 1;
      if (code === "A") absentCount += 1;
      cells.push({ day, date: currentDate, code, label, href });
    }

    return {
      childId: child.id,
      legacyChildId: child.legacyId,
      childNumber: child.childNumber ?? child.legacyId?.toString() ?? "—",
      firstName: child.firstName,
      lastName: child.lastName,
      branchId: child.branchId,
      branchName: child.branch?.prefix ?? child.branch?.name ?? "—",
      classId: child.classId,
      className: child.class?.name ?? "—",
      presentCount,
      absentCount,
      cells,
    };
  });

  const totalPresent = rows.reduce((sum, row) => sum + row.presentCount, 0);
  const totalAbsent = rows.reduce((sum, row) => sum + row.absentCount, 0);
  const totalNoReport = rows.reduce(
    (sum, row) => sum + row.cells.filter((cell) => cell.code === "N").length,
    0,
  );

  const branchOptions: MonthlyBranchOption[] = sortByLegacyOrder(
    branches.map((branch) => ({ ...branch, name: branch.name })),
  ).map((branch) => ({ id: branch.id, name: branch.name }));

  const classOptions: MonthlyClassOption[] = sortByLegacyOrder(
    classes.map((classItem) => ({ ...classItem, name: classItem.name })),
  ).map((classItem) => ({
    id: classItem.id,
    name: classItem.name,
    branchId: classItem.branchId,
  }));

  return {
    rows,
    branchOptions,
    classOptions,
    totals: {
      present: totalPresent,
      absent: totalAbsent,
      noReport: totalNoReport,
    },
    daysInMonth,
    monthLabel: monthLabel(monthKey),
  };
}

export default async function MonthlyReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const monthKey =
    normalizeMonthKey(params.month) ??
    normalizeMonthKey(params.from) ??
    normalizeMonthKey(params.p) ??
    monthKeyFromDate(new Date());
  const branchId = firstParam(params.branch)?.trim() || null;
  const classId = firstParam(params.classId)?.trim() || firstParam(params.class)?.trim() || null;
  const initialQuery = firstParam(params.q)?.trim() ?? "";

  const { rows, branchOptions, classOptions, totals, daysInMonth, monthLabel: label } =
    await loadMonthlyAttendance({ branchId, classId, monthKey });

  return (
    <MonthlyClient
      rows={rows}
      branchOptions={branchOptions}
      classOptions={classOptions}
      totals={totals}
      daysInMonth={daysInMonth}
      monthKey={monthKey}
      monthLabel={label}
      initialBranchId={branchId}
      initialClassId={classId}
      initialQuery={initialQuery}
    />
  );
}
