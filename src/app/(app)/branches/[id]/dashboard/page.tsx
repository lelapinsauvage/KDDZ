import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import {
  getActionCenterMetrics,
  getDailyComplianceStats,
  getDashboardDemographics,
} from "@/lib/actions/dashboard";
import { getSchoolYears } from "@/lib/actions/school-years";
import type {
  DashboardMetricFilters,
  DashboardDrilldownRequestFilters,
} from "@/lib/actions/dashboard";
import { BranchDashboardClient } from "@/components/branches/branch-dashboard-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    year?: string | string[];
  }>;
}

type DashboardSchoolYear = {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateParam(value: string | string[] | undefined): Date | null {
  const text = firstParam(value);
  const match = text?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(date);
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  );
}

function resolveDashboardSelection(
  params: Awaited<Props["searchParams"]>,
  schoolYears: DashboardSchoolYear[]
) {
  const today = startOfDay(new Date());
  const rawFrom = parseDateParam(params.from) ?? today;
  const rawTo = parseDateParam(params.to) ?? rawFrom;
  const startDate = rawFrom <= rawTo ? rawFrom : rawTo;
  const endDate = rawFrom <= rawTo ? rawTo : rawFrom;
  const yearParam = firstParam(params.year);
  const queryYearId = isUuid(yearParam) ? yearParam : null;
  const fallbackYear = schoolYears.find((year) => year.isActive) ?? schoolYears[0] ?? null;
  const selectedYear =
    (queryYearId ? schoolYears.find((year) => year.id === queryYearId) : null) ??
    fallbackYear;

  return {
    startDate,
    endDate,
    fromKey: formatDateKey(startDate),
    toKey: formatDateKey(endDate),
    schoolYearId: selectedYear?.id ?? null,
  };
}

export default async function BranchDashboardPage({ params, searchParams }: Props) {
  const { id } = await params;
  const search = await searchParams;
  const yearsResult = await getSchoolYears();
  const schoolYears = (yearsResult.data ?? []) as DashboardSchoolYear[];
  const selection = resolveDashboardSelection(search, schoolYears);
  const dashboardFilters: DashboardMetricFilters = {
    startDate: selection.startDate,
    endDate: selection.endDate,
    schoolYearId: selection.schoolYearId,
  };
  const drilldownFilters: DashboardDrilldownRequestFilters = {
    from: selection.fromKey,
    to: selection.toKey,
    schoolYearId: selection.schoolYearId,
    branchId: id,
  };

  const [result, demographics, dailyStats, actionMetrics] = await Promise.all([
    getBranch(id),
    getDashboardDemographics(id, { schoolYearId: selection.schoolYearId }),
    getDailyComplianceStats(id, dashboardFilters),
    getActionCenterMetrics(id, dashboardFilters),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = result.data as any;

  return (
    <BranchDashboardClient
      branchId={id}
      selectedRange={{ from: selection.fromKey, to: selection.toKey }}
      selectedYearId={selection.schoolYearId}
      drilldownFilters={drilldownFilters}
      stats={{
        childrenCount: branch._count?.children ?? 0,
        classCount: branch._count?.classes ?? 0,
        teacherCount: branch._count?.teachers ?? 0,
        nurseCount: branch._count?.nurses ?? 0,
        doctorCount: branch._count?.doctors ?? 0,
        managerCount: branch._count?.managers ?? 0,
        documentCount: branch._count?.documents ?? 0,
        compliancePercentage: branch.compliance?.completionPercentage ?? 0,
        themeColor: branch.themeColor ?? "#1caf9a",
      }}
      demographics={demographics}
      dailyStats={dailyStats}
      actionMetrics={actionMetrics}
    />
  );
}
