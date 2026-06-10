import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFoods } from "@/lib/actions/food";
import { getCurrentDailyReportDirectSubmitPermission } from "@/lib/legacy-daily-report-approval";
import { PageHeader } from "@/components/layout/page-header";
import { BatchReportClient } from "./batch-report-client";

export default async function BatchDailyReportPage() {
  const session = await auth();
  const branchId = session?.user?.branchId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    children,
    todayReports,
    breakfastFoods,
    lunchFoods,
    dessertFoods,
    todayCalendar,
    classes,
    canSubmitDirectly,
  ] =
    await Promise.all([
      db.child.findMany({
        where: {
          isActive: true,
          isDraft: false,
          ...(branchId ? { branchId } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classId: true,
          class: { select: { id: true, name: true } },
        },
        orderBy: [{ class: { name: "asc" } }, { firstName: "asc" }],
      }),
      db.dailyReport.findMany({
        where: {
          reportDate: { gte: today, lt: tomorrow },
          ...(branchId ? { child: { branchId } } : {}),
        },
        select: { childId: true, id: true, status: true },
      }),
      getFoods({ category: "BREAKFAST", isActive: true }),
      getFoods({ category: "LUNCH", isActive: true }),
      getFoods({ category: "DESSERT", isActive: true }),
      db.foodCalendar.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          ...(branchId ? { branchId } : {}),
        },
        include: { food: { select: { id: true, name: true } } },
      }),
      db.class.findMany({
        where: branchId ? { branchId } : {},
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getCurrentDailyReportDirectSubmitPermission(),
    ]);

  const reportMap = new Map(
    todayReports.map((r) => [r.childId, { id: r.id, status: r.status }])
  );

  const childrenData = children.map((c) => {
    const report = reportMap.get(c.id);
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      classId: c.classId,
      className: c.class?.name ?? "",
      hasReport: !!report,
      reportStatus: report?.status as "SUBMITTED" | "DRAFT" | null ?? null,
      reportId: report?.id ?? null,
    };
  });

  const foods = {
    breakfast: breakfastFoods.foods.map((f) => ({ id: f.id, name: f.name })),
    lunch: lunchFoods.foods.map((f) => ({ id: f.id, name: f.name })),
    dessert: dessertFoods.foods.map((f) => ({ id: f.id, name: f.name })),
  };

  // Pre-select today's menu items
  const todayMenu = {
    breakfastFoodId: todayCalendar.find((c) => c.mealType === "BREAKFAST")?.food.id ?? "",
    lunchFoodId: todayCalendar.find((c) => c.mealType === "LUNCH")?.food.id ?? "",
  };

  return (
    <>
      <PageHeader
        title="Batch Daily Reports"
        breadcrumbs={[
          { label: "Daily Reports", href: "/daily-reports" },
          { label: "Batch Mode" },
        ]}
      />
      <BatchReportClient
        childrenList={childrenData}
        classes={classes}
        foods={foods}
        todayMenu={todayMenu}
        canSubmitDirectly={canSubmitDirectly}
      />
    </>
  );
}
