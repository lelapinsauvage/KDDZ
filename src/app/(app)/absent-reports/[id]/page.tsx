import { notFound } from "next/navigation";
import { getAbsenceReport } from "@/lib/actions/absent-reports";
import { AbsenceReportDetailClient } from "./detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AbsenceReportDetailPage({ params }: Props) {
  const { id } = await params;

  const result = await getAbsenceReport(id);
  if ("error" in result || !result.report) {
    notFound();
  }

  const r = result.report;

  const report = {
    id: r.id,
    childName: `${r.child.firstName} ${r.child.lastName}`,
    className: r.child.class?.name ?? null,
    branchName: r.child.branch?.name ?? null,
    date: r.date.toISOString().slice(0, 10),
    reason: r.reason ?? null,
    absentFrom: r.absentFrom?.toISOString().slice(0, 10) ?? null,
    absentTo: r.absentTo?.toISOString().slice(0, 10) ?? null,
    hospitalized: r.hospitalized,
    hospitalName: r.hospitalName ?? null,
    doctorName: r.doctorName ?? null,
    status: r.status as "PENDING" | "APPROVED" | "REJECTED",
    createdBy: r.createdBy?.name ?? r.createdBy?.email ?? null,
    attachments: (r.attachments ?? []).map((a) => ({
      id: a.id,
      name: a.filename,
      url: a.fileUrl,
    })),
  };

  return <AbsenceReportDetailClient report={report} />;
}
