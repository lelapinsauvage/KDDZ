export type ChildDailyComplianceChild = {
  id: string;
  childNumber: string | null;
  legacyId?: number | null;
  firstName: string;
  lastName: string;
  class: { name: string } | null;
};

export type ChildDailyComplianceReport = {
  reportDate: Date;
  status: "DRAFT" | "SUBMITTED";
  legacyData: unknown;
};

export type ChildDailyComplianceAbsenceReport = {
  date: Date;
  absentFrom: Date | null;
  absentTo: Date | null;
};

export type ChildDailyComplianceHoliday = {
  date: Date;
  endDate: Date | null;
  repeated: boolean;
};

export type ChildDailyComplianceDrilldownRow = {
  id: string;
  number: string;
  name: string;
  date: string;
  href: string;
  actionLabel: "Create";
};

export type ChildDailyComplianceStats = {
  totalAttendance: number;
  totalAbsence: number;
  missingDailyReports: number;
  missingAbsentReports: number;
};

export type ChildDailyComplianceDetails = {
  stats: ChildDailyComplianceStats;
  missingDailyRows: ChildDailyComplianceDrilldownRow[];
  missingAbsentRows: ChildDailyComplianceDrilldownRow[];
};

export function buildChildDailyComplianceDetails({
  child,
  start,
  endExclusive,
  reports,
  absenceReports,
  holidays,
  includeRows = true,
}: {
  child: ChildDailyComplianceChild;
  start: Date;
  endExclusive: Date;
  reports: ChildDailyComplianceReport[];
  absenceReports: ChildDailyComplianceAbsenceReport[];
  holidays: ChildDailyComplianceHoliday[];
  includeRows?: boolean;
}): ChildDailyComplianceDetails {
  const reportDateKeys = new Set<string>();
  const absentDailyKeys = new Set<string>();
  let totalAttendance = 0;
  let totalAbsence = 0;

  for (const report of reports) {
    const key = dateKey(report.reportDate);
    reportDateKeys.add(key);

    if (report.status !== "SUBMITTED") continue;
    if (legacyDailyStatus(report) === "absent") {
      absentDailyKeys.add(key);
      totalAbsence++;
    } else {
      totalAttendance++;
    }
  }

  const holidayDateKeys = new Set<string>();
  const repeatedHolidayKeys = new Set<string>();
  for (const holiday of holidays) {
    if (holiday.repeated) {
      repeatedHolidayKeys.add(monthDayKey(holiday.date));
      continue;
    }

    const holidayEnd = startOfDay(holiday.endDate ?? holiday.date);
    for (let day = startOfDay(holiday.date); day <= holidayEnd; day = addDays(day, 1)) {
      holidayDateKeys.add(dateKey(day));
    }
  }

  const absenceReportCovers = new Set<string>();
  for (const report of absenceReports) {
    const from = startOfDay(report.absentFrom ?? report.date);
    const to = startOfDay(report.absentTo ?? report.absentFrom ?? report.date);
    const coverStart = from < start ? start : from;
    const cappedEnd = to >= endExclusive ? addDays(endExclusive, -1) : to;
    const coverEndExclusive = addDays(cappedEnd, 1);

    for (let day = coverStart; day < coverEndExclusive; day = addDays(day, 1)) {
      absenceReportCovers.add(dateKey(day));
    }
  }

  const missingDailyRows: ChildDailyComplianceDrilldownRow[] = [];
  const missingAbsentRows: ChildDailyComplianceDrilldownRow[] = [];
  let missingDailyReports = 0;
  let missingAbsentReports = 0;

  for (const day of rangeDates(start, endExclusive)) {
    if (day.getDay() === 0) continue;
    if (holidayDateKeys.has(dateKey(day))) continue;
    if (repeatedHolidayKeys.has(monthDayKey(day))) continue;

    const dayKey = dateKey(day);
    if (!reportDateKeys.has(dayKey)) {
      missingDailyReports++;

      if (includeRows) {
        missingDailyRows.push({
          id: `missing-daily:${child.id}:${dayKey}`,
          number: displayChildNumber(child),
          name: displayChildName(child),
          date: dayKey,
          href: hrefWithQuery("/daily-reports/new", { childId: child.id, date: dayKey }),
          actionLabel: "Create",
        });
      }
    }

    if (absentDailyKeys.has(dayKey) && !absenceReportCovers.has(dayKey)) {
      missingAbsentReports++;

      if (includeRows) {
        missingAbsentRows.push({
          id: `missing-absent:${child.id}:${dayKey}`,
          number: displayChildNumber(child),
          name: displayChildName(child),
          date: dayKey,
          href: hrefWithQuery("/absent-reports/new", { childId: child.id, date: dayKey }),
          actionLabel: "Create",
        });
      }
    }
  }

  return {
    stats: {
      totalAttendance,
      totalAbsence,
      missingDailyReports,
      missingAbsentReports,
    },
    missingDailyRows,
    missingAbsentRows,
  };
}

function legacyDailyStatus(report: ChildDailyComplianceReport) {
  if (isRecord(report.legacyData)) {
    const legacyStatus = report.legacyData.status;
    if (legacyStatus !== undefined && legacyStatus !== null) {
      return String(legacyStatus).trim().toLowerCase();
    }
  }

  return report.status === "SUBMITTED" ? "present" : "draft";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function dateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthDayKey(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function rangeDates(start: Date, endExclusive: Date): Date[] {
  const dates: Date[] = [];
  for (let day = new Date(start); day < endExclusive; day = addDays(day, 1)) {
    dates.push(new Date(day));
  }
  return dates;
}

function displayChildNumber(child: { childNumber: string | null; legacyId?: number | null; id: string }) {
  return child.childNumber?.trim() || child.legacyId?.toString() || child.id.slice(0, 8);
}

function displayChildName(child: {
  firstName: string;
  lastName: string;
  class: { name: string } | null;
}) {
  const name = `${child.firstName} ${child.lastName}`.trim();
  return child.class?.name ? `${name} (${child.class.name})` : name;
}

function hrefWithQuery(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${path}?${query.toString()}`;
}
