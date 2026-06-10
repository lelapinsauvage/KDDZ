import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import {
  findAbsenceReportForChildDate,
  resolveLegacyAbsenceReportId,
} from "@/lib/legacy-report";
import AbsentReportsPage from "../absent-reports/page";

interface PageProps {
  searchParams: Promise<{ date?: string; fid?: string; id?: string; isdraft?: string }>;
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayDateOnly() {
  return new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
}

export default async function LegacyAbsenceReportRedirect({ searchParams }: PageProps) {
  const { date, fid, id } = await searchParams;

  if (fid?.trim()) {
    const reportId = await resolveLegacyAbsenceReportId(fid);
    if (!reportId) notFound();

    redirect(`/absent-reports/${encodeURIComponent(reportId)}/edit`);
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) notFound();

    const existingReportId = await findAbsenceReportForChildDate(childId, todayDateOnly());
    if (existingReportId) {
      redirect(`/absent-reports/${encodeURIComponent(existingReportId)}/edit`);
    }

    const params = new URLSearchParams({ childId });
    const requestedDate = date?.trim();
    if (requestedDate && parseDateOnly(requestedDate)) params.set("date", requestedDate);

    redirect(`/absent-reports/new?${params.toString()}`);
  }

  return <AbsentReportsPage searchParams={Promise.resolve({})} />;
}
