import { PageHeader } from "@/components/layout/page-header";
import { DailyReportForm } from "@/components/daily-reports/daily-report-form";
import { getChildren } from "@/lib/actions/children";
import { getFoods } from "@/lib/actions/food";
import { getCurrentDailyReportDirectSubmitPermission } from "@/lib/legacy-daily-report-approval";

interface Props {
  searchParams: Promise<{ childId?: string; date?: string }>;
}

function isDateOnly(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function NewDailyReportPage({ searchParams }: Props) {
  const { childId, date } = await searchParams;

  const [
    childrenResult,
    breakfastFoods,
    lunchFoods,
    dessertFoods,
    canSubmitDirectly,
  ] =
    await Promise.all([
      getChildren({ status: "ACTIVE", pageSize: "all" }),
      getFoods({ category: "BREAKFAST", isActive: true }),
      getFoods({ category: "LUNCH", isActive: true }),
      getFoods({ category: "DESSERT", isActive: true }),
      getCurrentDailyReportDirectSubmitPermission(),
    ]);

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    branchId: c.branchId,
    className: c.class?.name ?? "",
  }));

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

  const defaultValues = {
    ...(childId ? { childId } : {}),
    ...(isDateOnly(date) ? { reportDate: date } : {}),
  };

  return (
    <>
      <PageHeader
        title="New Daily Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Daily Reports", href: "/daily-reports" },
          { label: "New Report" },
        ]}
      />
      <DailyReportForm
        childrenList={children}
        foods={foods}
        defaultValues={Object.keys(defaultValues).length ? defaultValues : undefined}
        canSubmitDirectly={canSubmitDirectly}
      />
    </>
  );
}
