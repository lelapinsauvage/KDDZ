import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReportForm } from "@/components/absent-reports/absence-report-form";
import { getAbsenceReport } from "@/lib/actions/absent-reports";
import { getChildren } from "@/lib/actions/children";
import type { AbsenceReportFormValues } from "@/lib/validations/absence-report";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAbsenceReportPage({ params }: Props) {
  const { id } = await params;

  const [result, childrenResult] = await Promise.all([
    getAbsenceReport(id),
    getChildren({ status: "ACTIVE", pageSize: 500 }),
  ]);

  if ("error" in result || !result.report) {
    notFound();
  }

  const r = result.report;

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    className: c.class?.name ?? "",
  }));

  const defaultValues: Partial<AbsenceReportFormValues> = {
    childId: r.childId,
    date: r.date.toISOString().slice(0, 10),
    reason: r.reason ?? "",
    status: r.status as AbsenceReportFormValues["status"],
  };

  return (
    <>
      <PageHeader
        title="Edit Absence Report"
        breadcrumbs={[
          { label: "Absence Reports", href: "/absent-reports" },
          { label: "Edit Report" },
        ]}
      />
      <AbsenceReportForm
        childrenList={children}
        defaultValues={defaultValues}
        reportId={id}
      />
    </>
  );
}
