import { PageHeader } from "@/components/layout/page-header";
import { AttendanceHeatmap } from "@/components/attendance/attendance-heatmap";
import { getMonthlyAttendanceGrid } from "@/lib/actions/attendance";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getChildren } from "@/lib/actions/children";
import { getFoods } from "@/lib/actions/food";

interface Props {
  searchParams: Promise<{
    month?: string;
    year?: string;
    branchId?: string;
    classId?: string;
  }>;
}

export default async function AttendanceHeatmapPage({ searchParams }: Props) {
  const params = await searchParams;

  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const branchId = params.branchId || undefined;
  const classId = params.classId || undefined;

  const [grid, branchesResult, classesResult, childrenResult, breakfastFoods, lunchFoods, dessertFoods] =
    await Promise.all([
      getMonthlyAttendanceGrid(month, year, branchId, classId),
      getBranches(),
      getClasses(branchId ? { branchId } : {}),
      getChildren({ status: "ACTIVE", pageSize: 500, branchId, classId }),
      getFoods({ category: "BREAKFAST", isActive: true }),
      getFoods({ category: "LUNCH", isActive: true }),
      getFoods({ category: "DESSERT", isActive: true }),
    ]);

  const branches = (
    branchesResult.success && branchesResult.data
      ? (branchesResult.data as { id: string; name: string }[])
      : []
  ).map((b) => ({ id: b.id, name: b.name }));

  const classes = (
    classesResult.success && classesResult.data
      ? (classesResult.data as { id: string; name: string }[])
      : []
  ).map((c) => ({ id: c.id, name: c.name }));

  const childrenList = (childrenResult.children ?? []).map((c) => ({
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
        title="Attendance Heatmap"
        description="Monthly attendance overview — click purple dots to fill missing reports"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance Heatmap" },
        ]}
      />
      <div className="p-4 sm:p-6">
        <AttendanceHeatmap
          grid={grid}
          branches={branches}
          classes={classes}
          childrenList={childrenList}
          foods={foods}
          initialMonth={month}
          initialYear={year}
          initialBranchId={branchId}
          initialClassId={classId}
        />
      </div>
    </>
  );
}
