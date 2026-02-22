import { PageHeader } from "@/components/layout/page-header";
import { DailyReportForm } from "@/components/daily-reports/daily-report-form";
import { getChildren } from "@/lib/actions/children";
import { getFoods } from "@/lib/actions/food";

export default async function NewDailyReportPage() {
  const [childrenResult, breakfastFoods, lunchFoods, dessertFoods] =
    await Promise.all([
      getChildren({ status: "ACTIVE", pageSize: 500 }),
      getFoods({ category: "BREAKFAST", isActive: true }),
      getFoods({ category: "LUNCH", isActive: true }),
      getFoods({ category: "DESSERT", isActive: true }),
    ]);

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    className: c.class?.name ?? "",
  }));

  const foods = {
    breakfast: breakfastFoods.foods.map((f) => ({ id: f.id, name: f.name })),
    lunch: lunchFoods.foods.map((f) => ({ id: f.id, name: f.name })),
    dessert: dessertFoods.foods.map((f) => ({ id: f.id, name: f.name })),
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
      <DailyReportForm childrenList={children} foods={foods} />
    </>
  );
}
