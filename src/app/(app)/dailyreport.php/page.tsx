import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyDailyReportId } from "@/lib/legacy-report";

interface PageProps {
  searchParams: Promise<{ date?: string; fid?: string; id?: string; isdraft?: string }>;
}

export default async function LegacyDailyReportRedirect({ searchParams }: PageProps) {
  const { date, fid, id } = await searchParams;

  if (fid?.trim()) {
    const reportId = await resolveLegacyDailyReportId(fid);
    if (!reportId) notFound();

    redirect(`/daily-reports/${encodeURIComponent(reportId)}/edit`);
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) notFound();

    const params = new URLSearchParams({ childId });
    if (date?.trim()) params.set("date", date.trim());

    redirect(`/daily-reports/new?${params.toString()}`);
  }

  redirect("/daily-reports");
}
