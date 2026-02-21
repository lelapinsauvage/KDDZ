import { getChildren } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getPaymentsSummary } from "@/lib/actions/payments";
import { getMedicalForms } from "@/lib/actions/medical";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import MonthlyClient from "./monthly-client";

export default async function MonthlyReportPage() {
  const [
    activeChildrenResult,
    reportsSubmittedResult,
    reportsDraftResult,
    paymentsSummaryResult,
    medicalResult,
    branchesResult,
    classesResult,
  ] = await Promise.all([
    getChildren({ status: "ACTIVE", pageSize: 1 }),
    getDailyReports({ status: "SUBMITTED", pageSize: 1 }),
    getDailyReports({ status: "DRAFT", pageSize: 1 }),
    getPaymentsSummary(),
    getMedicalForms({ pageSize: 1 }),
    getBranches(),
    getClasses(),
  ]);

  const totalChildren = activeChildrenResult.total ?? 0;
  const totalReportsSubmitted = reportsSubmittedResult.total ?? 0;
  const totalReportsDraft = reportsDraftResult.total ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentData = paymentsSummaryResult.data as any;
  const totalPayments = paymentData?.totalCount ?? 0;

  const totalMedicalForms = medicalResult.total ?? 0;

  const branches = Array.isArray(branchesResult.data)
    ? branchesResult.data.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }))
    : [];

  const classesData = Array.isArray(classesResult.data) ? classesResult.data : [];
  const classes = classesData.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));

  return (
    <MonthlyClient
      totalChildren={totalChildren}
      totalReportsSubmitted={totalReportsSubmitted}
      totalReportsDraft={totalReportsDraft}
      totalPayments={totalPayments}
      totalMedicalForms={totalMedicalForms}
      branches={branches}
      classes={classes}
    />
  );
}
