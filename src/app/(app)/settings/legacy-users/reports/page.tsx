import { redirect } from "next/navigation";
import { getLegacyAuthReports } from "@/lib/actions/legacy-auth-reports";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";
import { LegacyAuthReportsClient } from "./legacy-auth-reports-client";

interface PageProps {
  searchParams: Promise<{
    group?: string | string[];
    startDate?: string | string[];
    endDate?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyAuthReportsPage({
  searchParams,
}: PageProps) {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    redirect("/forbidden.php");
  }

  const params = await searchParams;
  const reportResult = await getLegacyAuthReports({
    groupKey: firstParam(params.group),
    startDate: firstParam(params.startDate),
    endDate: firstParam(params.endDate),
  });

  return (
    <LegacyAuthReportsClient
      data={
        reportResult.data ?? {
          groups: [],
          selectedGroupKey: null,
          startDate: "",
          endDate: "",
          totals: { registered: 0, rangeRegistered: 0, loginEvents: 0 },
          providers: [],
          series: [],
          topUsers: [],
        }
      }
      error={reportResult.success ? null : (reportResult.error ?? null)}
    />
  );
}
