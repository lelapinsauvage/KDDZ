import { PageHeader } from "@/components/layout/page-header";
import { DailyReportForm } from "@/components/daily-reports/daily-report-form";

export default function NewDailyReportPage() {
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
      <DailyReportForm />
    </>
  );
}
