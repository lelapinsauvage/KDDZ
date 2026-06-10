import { getHolidays } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { getLegacyHolidayActionPermissions } from "@/lib/legacy-holiday-action-permissions";
import { requireOrgSafe } from "@/lib/require-org";
import { HolidaysClient } from "./holidays-client";

type HolidayCalendarView = "month" | "week" | "day";

interface HolidayCalendarPageProps {
  searchParams: Promise<{ month?: string; year?: string; view?: string; date?: string }>;
}

function parseMonth(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
}

function parseYear(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1970 && parsed <= 2100
    ? parsed
    : null;
}

function parseView(value?: string): HolidayCalendarView {
  return value === "week" || value === "day" ? value : "month";
}

function parseFocusedDate(value: string | undefined, year: number, month: number) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [dateYear, dateMonth, dateDay] = value.split("-").map(Number);
    const date = new Date(dateYear, dateMonth - 1, dateDay);
    if (
      date.getFullYear() === dateYear &&
      date.getMonth() === dateMonth - 1 &&
      date.getDate() === dateDay
    ) {
      return value;
    }
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function normalizeNotificationDaysBefore(value: unknown, fallback: number) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7),
      ),
    ).sort((a, b) => a - b);
  }
  return fallback > 0 ? [fallback] : [];
}

export default async function HolidayCalendarPage({ searchParams }: HolidayCalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const initialYear = parseYear(params.year) ?? now.getFullYear();
  const initialMonth = parseMonth(params.month) ?? now.getMonth() + 1;
  const initialViewMode = parseView(params.view);
  const initialFocusedDate = parseFocusedDate(params.date, initialYear, initialMonth);

  const orgResult = await requireOrgSafe();
  const holidayPermissions = orgResult.ok
    ? await getLegacyHolidayActionPermissions(orgResult.ctx)
    : { canAddEditHolidays: false };

  const [holidaysResult, branchesResult] = await Promise.all([
    getHolidays(),
    getBranches(),
  ]);

  const branches = ((branchesResult.data ?? []) as Array<{ id: string; name: string }>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHolidays = (holidaysResult.success ? holidaysResult.data : []) as Array<any>;

  const serializedHolidays = rawHolidays.map((h) => ({
    id: h.id as string,
    name: h.name as string,
    description: (h.description ?? "") as string,
    date: (h.date as Date).toISOString().split("T")[0],
    endDate: h.endDate ? (h.endDate as Date).toISOString().split("T")[0] : "",
    repeated: (h.repeated ?? false) as boolean,
    type: (h.type ?? "HOLIDAY") as string,
    isActive: (h.isActive ?? true) as boolean,
    notificationTitle: (h.notificationTitle ?? "") as string,
    notificationMessage: (h.notificationMessage ?? "") as string,
    daysBefore: (h.daysBefore ?? 0) as number,
    notificationDaysBefore: normalizeNotificationDaysBefore(
      h.notificationDaysBefore,
      (h.daysBefore ?? 0) as number,
    ),
    informTeachers: (h.informTeachers ?? false) as boolean,
    sendVia: (h.sendVia ?? "BOTH") as string,
    branch: h.branch ? (h.branch.name as string) : "All Branches",
    branchId: (h.branchId ?? null) as string | null,
  }));

  return (
    <HolidaysClient
      holidays={serializedHolidays}
      branches={branches}
      canAddEditHolidays={holidayPermissions.canAddEditHolidays}
      initialYear={initialYear}
      initialMonth={initialMonth}
      initialViewMode={initialViewMode}
      initialFocusedDate={initialFocusedDate}
    />
  );
}
