import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReportForm } from "@/components/absent-reports/absence-report-form";
import { getChildren } from "@/lib/actions/children";

export default async function NewAbsenceReportPage() {
  const childrenResult = await getChildren({ status: "ACTIVE", pageSize: 500 });

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    className: c.class?.name ?? "",
  }));

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
      <AbsenceReportForm children={children} />
    </>
  );
}
