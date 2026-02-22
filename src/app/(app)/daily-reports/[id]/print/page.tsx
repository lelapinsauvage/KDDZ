import { notFound } from "next/navigation";
import { getDailyReport } from "@/lib/actions/daily-reports";
import { DailyReportPrintClient } from "./print-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DailyReportPrintPage({ params }: Props) {
  const { id } = await params;

  const result = await getDailyReport(id);
  if ("error" in result || !result.report) {
    notFound();
  }

  const r = result.report;

  const report = {
    id: r.id,
    date: r.reportDate.toISOString().slice(0, 10),
    status: r.status,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    className: r.child.class?.name ?? null,
    branchName: r.child.branch?.name ?? null,
    breakfastFood: r.breakfastFood?.name ?? null,
    breakfastPortion: r.breakfastPortion ?? null,
    lunchFood: r.lunchFood?.name ?? null,
    lunchPortion: r.lunchPortion ?? null,
    dessert: r.dessert ?? null,
    dessertPortion: r.dessertPortion ?? null,
    isSleep: r.isSleep,
    sleepFrom: r.sleepFrom ? r.sleepFrom.toISOString() : null,
    sleepTo: r.sleepTo ? r.sleepTo.toISOString() : null,
    mood: r.mood ?? null,
    diarrhea: r.diarrhea,
    cough: r.cough,
    runnyNose: r.runnyNose,
    vomit: r.vomit,
    urinePotty: r.urinePotty,
    stoolPotty: r.stoolPotty,
    urineDiaper: r.urineDiaper,
    stoolDiaper: r.stoolDiaper,
    remarks: r.remarks ?? null,
    fevers: r.fevers.map((f) => ({
      temperature: Number(f.temperature),
      time: f.time.toISOString(),
    })),
    milks: r.milks.map((m) => ({
      amountCc: m.amountCc,
      time: m.time.toISOString(),
    })),
  };

  return <DailyReportPrintClient report={report} />;
}
