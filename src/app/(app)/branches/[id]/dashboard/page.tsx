import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import {
  getActionCenterMetrics,
  getDailyComplianceStats,
  getDashboardDemographics,
} from "@/lib/actions/dashboard";
import { BranchDashboardClient } from "@/components/branches/branch-dashboard-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchDashboardPage({ params }: Props) {
  const { id } = await params;

  const [result, demographics, dailyStats, actionMetrics] = await Promise.all([
    getBranch(id),
    getDashboardDemographics(id),
    getDailyComplianceStats(id),
    getActionCenterMetrics(id),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = result.data as any;

  return (
    <BranchDashboardClient
      branchId={id}
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
