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

  // Get the most recent daily report for this child
  const { reports } = await getDailyReports({ childId: id, pageSize: 1 });
  const latestReport = reports[0] ?? null;

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  let report = null;

  if (latestReport) {
    // Compute sleep duration
    let sleepDuration = "N/A";
    if (latestReport.isSleep && latestReport.sleepFrom && latestReport.sleepTo) {
      const fromMs = latestReport.sleepFrom.getTime();
      const toMs = latestReport.sleepTo.getTime();
      const diffHours = Math.abs(toMs - fromMs) / (1000 * 60 * 60);
      sleepDuration = `${diffHours.toFixed(1)} hrs`;
    }

    // We need to fetch the full report with fevers/milks and food names
    // The getDailyReports doesn't include fevers/milks, so use getDailyReport
    const { getDailyReport } = await import("@/lib/actions/daily-reports");
    const fullReportResult = await getDailyReport(latestReport.id);
    const fullReport = "report" in fullReportResult ? fullReportResult.report : null;

    report = {
      date: latestReport.reportDate.toISOString().slice(0, 10),
      status: latestReport.status,
      createdBy: null as string | null,
      breakfast: {
        food: fullReport?.breakfastFood?.name ?? null,
        portion: latestReport.breakfastPortion ?? null,
        time: formatTime(latestReport.breakfastTime),
      },
      lunch: {
        food: fullReport?.lunchFood?.name ?? null,
        portion: latestReport.lunchPortion ?? null,
        time: formatTime(latestReport.lunchTime),
      },
      dessert: {
        food: latestReport.dessert ?? null,
        portion: latestReport.dessertPortion ?? null,
        time: formatTime(latestReport.dessertTime),
      },
      sleep: {
        from: formatTime(latestReport.sleepFrom),
        to: formatTime(latestReport.sleepTo),
        duration: sleepDuration,
      },
      health: {
        mood: latestReport.mood ?? null,
        cough: latestReport.cough,
        runnyNose: latestReport.runnyNose,
        vomit: latestReport.vomit,
        diarrhea: latestReport.diarrhea,
        urinePotty: latestReport.urinePotty,
        stoolPotty: latestReport.stoolPotty,
        urineDiaper: latestReport.urineDiaper,
        stoolDiaper: latestReport.stoolDiaper,
      },
      fevers: (fullReport?.fevers ?? []).map((f) => ({
        temperature: String(f.temperature),
        time: formatTime(f.time),
      })).filter((f): f is { temperature: string; time: string } => f.time !== null),
      milks: (fullReport?.milks ?? []).map((m) => ({
        amountCc: String(m.amountCc),
        time: formatTime(m.time),
      })).filter((m): m is { amountCc: string; time: string } => m.time !== null),
      remarks: latestReport.remarks ?? null,
    };
  }

  return (
    <ReportClient
      child={childData}
      report={report}
    />
  );
}
