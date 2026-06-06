import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReportForm } from "@/components/absent-reports/absence-report-form";
import { getChildren } from "@/lib/actions/children";
import { getEmployees } from "@/lib/actions/employees";

interface Props {
  searchParams: Promise<{ childId?: string; date?: string }>;
}

export default async function NewAbsenceReportPage({ searchParams }: Props) {
  const { childId, date } = await searchParams;
  const [childrenResult, teachersResult] = await Promise.all([
    getChildren({ status: "ACTIVE", pageSize: 500 }),
    getEmployees("teacher", { isActive: true, pageSize: 500 }),
  ]);

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    childNumber: c.childNumber ?? c.legacyId?.toString() ?? "—",
    branchId: c.branchId,
    classId: c.classId ?? null,
    className: c.class?.name ?? "",
    photo: c.photo ?? null,
  }));

  const teachers = ((teachersResult.data as { employees?: Array<{
    id: string;
    legacyId: number | null;
    firstName: string;
    lastName: string;
    branchId: string;
  }> } | undefined)?.employees ?? []).map((teacher) => ({
    id: teacher.id,
    legacyId: teacher.legacyId,
    name: `${teacher.firstName} ${teacher.lastName}`,
    branchId: teacher.branchId,
  }));

  const defaultValues = {
    ...(childId ? { childId } : {}),
    ...(date ? { date, absentFrom: date } : {}),
  };

  return (
    <>
      <PageHeader
        title="New Absence Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Absence Reports", href: "/absent-reports" },
          { label: "New Report" },
        ]}
      />
      <AbsenceReportForm
        childrenList={children}
        teacherList={teachers}
        defaultValues={defaultValues}
      />
    </>
  );
}
