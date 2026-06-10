import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DailyReportForm } from "@/components/daily-reports/daily-report-form";
import { getDailyReport } from "@/lib/actions/daily-reports";
import { getChildren } from "@/lib/actions/children";
import { getFoods } from "@/lib/actions/food";
import { getCurrentDailyReportDirectSubmitPermission } from "@/lib/legacy-daily-report-approval";
import {
  dailyReportClothingFlags,
  dailyReportNeedFlags,
  dailyReportSupplementalFields,
} from "@/lib/legacy-daily-report-fields";
import type { DailyReportFormValues } from "@/lib/validations/daily-report";

interface Props {
  params: Promise<{ id: string }>;
}

function toTimeString(date: Date | null): string {
  if (!date) return "";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function EditDailyReportPage({ params }: Props) {
  const { id } = await params;

  const [
    result,
    childrenResult,
    breakfastFoods,
    lunchFoods,
    dessertFoods,
    canSubmitDirectly,
  ] =
    await Promise.all([
      getDailyReport(id),
      getChildren({ status: "ACTIVE", pageSize: "all" }),
      getFoods({ category: "BREAKFAST", isActive: true }),
      getFoods({ category: "LUNCH", isActive: true }),
      getFoods({ category: "DESSERT", isActive: true }),
      getCurrentDailyReportDirectSubmitPermission(),
    ]);

  if ("error" in result || !result.report) {
    notFound();
  }

  const r = result.report;

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    branchId: c.branchId,
    className: c.class?.name ?? "",
  }));

  if (!children.some((child) => child.id === r.childId)) {
    children.unshift({
      id: r.childId,
      name: `${r.child.firstName} ${r.child.lastName}`,
      branchId: r.child.branchId,
      className: r.child.class?.name ?? "",
    });
  }

  const foods = {
    breakfast: breakfastFoods.foods.map((f) => ({
      id: f.id,
      name: f.name,
      legacyId: f.legacyId,
    })),
    lunch: lunchFoods.foods.map((f) => ({
      id: f.id,
      name: f.name,
      legacyId: f.legacyId,
    })),
    dessert: dessertFoods.foods.map((f) => ({
      id: f.id,
      name: f.name,
      legacyId: f.legacyId,
    })),
  };
  const clothingFlags = dailyReportClothingFlags(r.legacyData);
  const needFlags = dailyReportNeedFlags(r.legacyData);
  const supplementalFields = dailyReportSupplementalFields(r.legacyData);
  const earlyDinnerFoodId =
    foods.lunch.find((food) => food.id === supplementalFields.earlyDinnerFoodId)
      ?.id ??
    foods.lunch.find(
      (food) =>
        food.legacyId != null &&
        String(food.legacyId) === supplementalFields.earlyDinnerFoodId,
    )?.id;

  const defaultValues: Partial<DailyReportFormValues> = {
    childId: r.child.id,
    reportDate: r.reportDate.toISOString().slice(0, 10),
    breakfastFoodId: r.breakfastFoodId ?? undefined,
    breakfastPortion: (r.breakfastPortion as DailyReportFormValues["breakfastPortion"]) ?? undefined,
    breakfastTime: r.breakfastTime ? toTimeString(r.breakfastTime) : undefined,
    lunchFoodId: r.lunchFoodId ?? undefined,
    lunchPortion: (r.lunchPortion as DailyReportFormValues["lunchPortion"]) ?? undefined,
    lunchTime: r.lunchTime ? toTimeString(r.lunchTime) : undefined,
    earlyDinnerFoodId,
    earlyDinnerPortion: supplementalFields.earlyDinnerPortion,
    earlyDinnerTime: supplementalFields.earlyDinnerTime || undefined,
    dessert: r.dessert ?? undefined,
    dessertPortion: (r.dessertPortion as DailyReportFormValues["dessertPortion"]) ?? undefined,
    dessertTime: r.dessertTime ? toTimeString(r.dessertTime) : undefined,
    checkInTime: r.checkInTime ? toTimeString(r.checkInTime) : undefined,
    checkOutTime: r.checkOutTime ? toTimeString(r.checkOutTime) : undefined,
    isSleep: r.isSleep,
    sleepFrom: r.sleepFrom ? toTimeString(r.sleepFrom) : undefined,
    sleepTo: r.sleepTo ? toTimeString(r.sleepTo) : undefined,
    secondSleepFrom: supplementalFields.secondSleepFrom || undefined,
    secondSleepTo: supplementalFields.secondSleepTo || undefined,
    thirdSleepFrom: supplementalFields.thirdSleepFrom || undefined,
    thirdSleepTo: supplementalFields.thirdSleepTo || undefined,
    sleepQuality: (r.sleepQuality as DailyReportFormValues["sleepQuality"]) ?? undefined,
    activities: r.activities ?? undefined,
    medicine: r.medicine ?? undefined,
    diarrhea: r.diarrhea,
    constipation: needFlags.constipation,
    cough: r.cough,
    runnyNose: r.runnyNose,
    vomit: r.vomit,
    mood: (r.mood as DailyReportFormValues["mood"]) ?? undefined,
    moodNoon: supplementalFields.moodNoon,
    urinePotty: r.urinePotty,
    stoolPotty: r.stoolPotty,
    urineDiaper: r.urineDiaper,
    stoolDiaper: r.stoolDiaper,
    clothesPants: clothingFlags.clothesPants,
    clothesSweater: clothingFlags.clothesSweater,
    clothesTshirt: clothingFlags.clothesTshirt,
    clothesUnderwear: clothingFlags.clothesUnderwear,
    clothesSocks: clothingFlags.clothesSocks,
    needsWipes: needFlags.needsWipes,
    needsBrush: needFlags.needsBrush,
    needsTowel: needFlags.needsTowel,
    needsDiapers: needFlags.needsDiapers,
    needsBabyBottle: needFlags.needsBabyBottle,
    needsMilk: needFlags.needsMilk,
    remarks: r.remarks ?? undefined,
    feverEntries: r.fevers.map((f) => ({
      temperature: String(Number(f.temperature)),
      time: toTimeString(f.time),
    })),
    milkEntries: r.milks.map((m) => ({
      milkType: m.milkType ?? undefined,
      amountCc: String(m.amountCc),
      scoops: m.scoops != null ? String(m.scoops) : undefined,
      time: toTimeString(m.time),
    })),
  };

  return (
    <>
      <PageHeader
        title="Edit Daily Report"
        breadcrumbs={[
          { label: "Daily Reports", href: "/daily-reports" },
          { label: "Edit Report" },
        ]}
      />
      <DailyReportForm
        childrenList={children}
        foods={foods}
        defaultValues={defaultValues}
        reportId={id}
        workflowStatus={r.status}
        canSubmitDirectly={canSubmitDirectly}
        existingAttachments={(r.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          fileUrl: attachment.fileUrl,
        }))}
      />
    </>
  );
}
