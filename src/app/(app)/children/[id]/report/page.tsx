import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { ReportClient } from "./report-client";

interface Props {
  params: Promise<{ id: string }>;
}

/** Format a time-only Date to HH:mm string or null */
function formatTime(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function ChildReportPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  // Get all daily reports for this child
  const { reports: reportsRaw, total } = await getDailyReports({ childId: id, pageSize: 200 });

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // Map reports to serializable shape
  const reports = reportsRaw.map((r) => {
    // Compute sleep duration
    let sleepDuration = "N/A";
    if (r.isSleep && r.sleepFrom && r.sleepTo) {
      const fromMs = r.sleepFrom.getTime();
      const toMs = r.sleepTo.getTime();
      const diffHours = Math.abs(toMs - fromMs) / (1000 * 60 * 60);
      sleepDuration = `${diffHours.toFixed(1)} hrs`;
    }

    return {
      id: r.id,
      date: r.reportDate.toISOString().slice(0, 10),
      status: r.status,
      breakfastPortion: r.breakfastPortion ?? null,
      breakfastTime: formatTime(r.breakfastTime),
      lunchPortion: r.lunchPortion ?? null,
      lunchTime: formatTime(r.lunchTime),
      dessertPortion: r.dessertPortion ?? null,
      dessertTime: formatTime(r.dessertTime),
      sleepFrom: formatTime(r.sleepFrom),
      sleepTo: formatTime(r.sleepTo),
      sleepDuration,
      mood: r.mood ?? null,
      cough: r.cough,
      runnyNose: r.runnyNose,
      vomit: r.vomit,
      diarrhea: r.diarrhea,
      urinePotty: r.urinePotty,
      stoolPotty: r.stoolPotty,
      urineDiaper: r.urineDiaper,
      stoolDiaper: r.stoolDiaper,
      remarks: r.remarks ?? null,
    };
  });

  return (
    <ReportClient
      child={childData}
      reports={reports}
      total={total}
    />
  );
}
