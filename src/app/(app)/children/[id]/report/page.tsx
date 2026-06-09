import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import {
  dailyReportClothingFlags,
  dailyReportFoodLabel,
  legacyDailyRecord,
  legacyDailyText,
} from "@/lib/legacy-daily-report-fields";
import { loadLegacyDailyReportFoodNames } from "@/lib/legacy-daily-report-food-lookup";
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

function decimalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export default async function ChildReportPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const { reports: reportsRaw, total } = await getDailyReports({
    childId: id,
    status: "SUBMITTED",
    pageSize: 200,
  });
  const legacyFoodNames = await loadLegacyDailyReportFoodNames(
    reportsRaw.map((report) => report.legacyData),
  );

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    photo: child.photo ?? null,
  };

  const reports = reportsRaw.map((r) => {
    const legacy = legacyDailyRecord(r.legacyData);
    const clothingFlags = dailyReportClothingFlags(legacy);
    const milk = r.milks[0];
    const [fever1, fever2] = r.fevers;

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
      breakfastType: dailyReportFoodLabel({
        relatedName: r.breakfastFood?.name,
        legacyData: legacy,
        legacyIdKey: "breakfast_id",
        legacyFoodNames,
      }),
      breakfastPortion: r.breakfastPortion ?? null,
      breakfastTime: formatTime(r.breakfastTime),
      lunchType: dailyReportFoodLabel({
        relatedName: r.lunchFood?.name,
        legacyData: legacy,
        legacyIdKey: "lunch_id",
        legacyFoodNames,
      }),
      lunchPortion: r.lunchPortion ?? null,
      lunchTime: formatTime(r.lunchTime),
      dessertType: r.dessert ?? legacyDailyText(legacy.dessert),
      dessertPortion: r.dessertPortion ?? null,
      dessertTime: formatTime(r.dessertTime),
      milkCc: milk?.amountCc ?? 0,
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
      fever1Temp: decimalText(fever1?.temperature) ?? null,
      fever1Time: formatTime(fever1?.time ?? null),
      fever2Temp: decimalText(fever2?.temperature) ?? null,
      fever2Time: formatTime(fever2?.time ?? null),
      clothesPants: clothingFlags.clothesPants,
      clothesShirt: clothingFlags.clothesShirt,
      clothesTshirt: clothingFlags.clothesTshirt,
      clothesUnderwear: clothingFlags.clothesUnderwear,
      clothesSocks: clothingFlags.clothesSocks,
      remarks: r.remarks ?? null,
      attachmentCount: r.attachments.length,
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
