import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getDailyReports } from "@/lib/actions/daily-reports";
import MonthlyBranchClient from "./monthly-branch-client";

interface PageProps {
  searchParams: Promise<{ branch?: string }>;
}

interface BranchRow {
  id: string;
  name: string;
  _count: {
    classes: number;
    children: number;
    teachers: number;
  };
}

interface ClassRow {
  id: string;
  name: string;
  ageGroup: string | null;
  branchId: string;
  _count: { children: number };
}

export default async function MonthlyBranchReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [branchesResult, classesResult] = await Promise.all([
    getBranches(),
    getClasses(),
  ]);

  const branches: BranchRow[] = Array.isArray(branchesResult.data) ? branchesResult.data : [];
  const allClasses: ClassRow[] = Array.isArray(classesResult.data) ? classesResult.data : [];

  // For each branch, compute stats and per-class breakdown
  const branchDataMap: Record<string, {
    stats: {
      id: string;
      name: string;
      children: number;
      classes: number;
      teachers: number;
      attendanceRate: string;
    };
    classes: {
      id: string;
      className: string;
      ageGroup: string;
      children: number;
      avgAttendance: string;
      reportsSubmitted: number;
      reportsPending: number;
    }[];
  }> = {};

  // Fetch child counts and report counts per branch in parallel
  const branchPromises = branches.map(async (branch) => {
    const branchClasses = allClasses.filter((c) => c.branchId === branch.id);

    // Get daily reports counts for this branch
    const [submittedResult, draftResult] = await Promise.all([
      getDailyReports({ branchId: branch.id, status: "SUBMITTED", pageSize: 1 }),
      getDailyReports({ branchId: branch.id, status: "DRAFT", pageSize: 1 }),
    ]);

    const totalSubmitted = submittedResult.total ?? 0;
    const totalDraft = draftResult.total ?? 0;
    const totalReports = totalSubmitted + totalDraft;
    const attendanceRate = totalReports > 0
      ? `${Math.round((totalSubmitted / totalReports) * 100)}%`
      : "N/A";

    // Build per-class breakdown
    const classBreakdowns = await Promise.all(
      branchClasses.map(async (cls) => {
        const [clsSubmitted, clsDraft] = await Promise.all([
          getDailyReports({ classId: cls.id, status: "SUBMITTED", pageSize: 1 }),
          getDailyReports({ classId: cls.id, status: "DRAFT", pageSize: 1 }),
        ]);

        const submitted = clsSubmitted.total ?? 0;
        const draft = clsDraft.total ?? 0;
        const clsTotal = submitted + draft;
        const clsAttendance = clsTotal > 0
          ? `${Math.round((submitted / clsTotal) * 100)}%`
          : "N/A";

        return {
          id: cls.id,
          className: cls.name,
          ageGroup: cls.ageGroup ?? "N/A",
          children: cls._count.children,
          avgAttendance: clsAttendance,
          reportsSubmitted: submitted,
          reportsPending: draft,
        };
      })
    );

    branchDataMap[branch.id] = {
      stats: {
        id: branch.id,
        name: branch.name,
        children: branch._count.children,
        classes: branch._count.classes,
        teachers: branch._count.teachers,
        attendanceRate,
      },
      classes: classBreakdowns,
    };
  });

  await Promise.all(branchPromises);

  const branchOptions = branches.map((b) => ({ id: b.id, name: b.name }));
  const requestedBranchId = params.branch?.trim();
  const initialBranchId =
    requestedBranchId && branchOptions.some((b) => b.id === requestedBranchId)
      ? requestedBranchId
      : branchOptions[0]?.id ?? "";

  return (
    <MonthlyBranchClient
      branchDataMap={branchDataMap}
      branchOptions={branchOptions}
      initialBranchId={initialBranchId}
    />
  );
}
