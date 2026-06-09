import { notFound } from "next/navigation";
import { getDailyReport } from "@/lib/actions/daily-reports";
import { dailyReportFoodLabel } from "@/lib/legacy-daily-report-fields";
import { loadLegacyDailyReportFoodNames } from "@/lib/legacy-daily-report-food-lookup";
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
  const legacyFoodNames = await loadLegacyDailyReportFoodNames([r.legacyData]);

  const report = {
    id: r.id,
    date: r.reportDate.toISOString().slice(0, 10),
    status: r.status,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    className: r.child.class?.name ?? null,
    branchName: r.child.branch?.name ?? null,
    breakfastFood: dailyReportFoodLabel({
      relatedName: r.breakfastFood?.name,
      legacyData: r.legacyData,
      legacyIdKey: "breakfast_id",
      legacyFoodNames,
    }),
    breakfastPortion: r.breakfastPortion ?? null,
    lunchFood: dailyReportFoodLabel({
      relatedName: r.lunchFood?.name,
      legacyData: r.legacyData,
      legacyIdKey: "lunch_id",
      legacyFoodNames,
    }),
    lunchPortion: r.lunchPortion ?? null,
    dessert: r.dessert ?? null,
    dessertPortion: r.dessertPortion ?? null,
    checkInTime: r.checkInTime ? r.checkInTime.toISOString() : null,
    checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : null,
    isSleep: r.isSleep,
    sleepFrom: r.sleepFrom ? r.sleepFrom.toISOString() : null,
    sleepTo: r.sleepTo ? r.sleepTo.toISOString() : null,
    sleepQuality: r.sleepQuality ?? null,
    activities: r.activities ?? null,
    medicine: r.medicine ?? null,
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
      milkType: m.milkType ?? null,
      amountCc: m.amountCc,
      scoops: m.scoops ?? null,
      time: m.time.toISOString(),
    })),
  };

  return <DailyReportPrintClient report={report} />;
}
