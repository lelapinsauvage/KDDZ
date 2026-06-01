import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReportForm } from "@/components/absent-reports/absence-report-form";
import { getChildren } from "@/lib/actions/children";

interface Props {
  searchParams: Promise<{ childId?: string }>;
}

export default async function NewAbsenceReportPage({ searchParams }: Props) {
  const { childId } = await searchParams;
  const childrenResult = await getChildren({ status: "ACTIVE", pageSize: 500 });

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    branchId: c.branchId,
    className: c.class?.name ?? "",
  }));

  const defaultValues = childId ? { childId } : undefined;

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
      <AbsenceReportForm childrenList={children} defaultValues={defaultValues} />
    </>
  );
}
