import { notFound, redirect } from "next/navigation";
import MonthlyClient from "../monthly/monthly-client";
import {
  firstParam,
  loadMonthlyAttendance,
  monthKeyFromDate,
  normalizeMonthKey,
} from "../monthly/monthly-data";

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

export default async function MonthlyBranchReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const branchId = firstParam(params.branch)?.trim();

  if (!branchId) {
    redirect("/reports/monthly");
  }

  const monthKey =
    normalizeMonthKey(params.month) ??
    normalizeMonthKey(params.from) ??
    normalizeMonthKey(params.p) ??
    monthKeyFromDate(new Date());
  const classId = firstParam(params.classId)?.trim() || firstParam(params.class)?.trim() || null;
  const initialQuery = firstParam(params.q)?.trim() ?? "";

  const { rows, branchOptions, classOptions, totals, daysInMonth, monthLabel } =
    await loadMonthlyAttendance({ branchId, classId, monthKey });
  const selectedBranch = branchOptions.find((branch) => branch.id === branchId);

  if (!selectedBranch) {
    notFound();
  }

  const title = `Monthly Attendance Report For ${selectedBranch.name}`;

  return (
    <MonthlyClient
      title={title}
      breadcrumbLabel="Monthly Branch Attendance"
      basePath="/reports/monthly-branch"
      showBranchColumn
      lockBranch
      rows={rows}
      branchOptions={branchOptions}
      classOptions={classOptions}
      totals={totals}
      daysInMonth={daysInMonth}
      monthKey={monthKey}
      monthLabel={monthLabel}
      initialBranchId={branchId}
      initialClassId={classId}
      initialQuery={initialQuery}
    />
  );
}
