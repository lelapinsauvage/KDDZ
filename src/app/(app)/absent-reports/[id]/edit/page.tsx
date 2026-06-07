import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AbsenceReportForm } from "@/components/absent-reports/absence-report-form";
import { getAbsenceReport } from "@/lib/actions/absent-reports";
import { getChildren } from "@/lib/actions/children";
import { getEmployees } from "@/lib/actions/employees";
import type { AbsenceReportFormValues } from "@/lib/validations/absence-report";

interface Props {
  params: Promise<{ id: string }>;
}

function legacyString(legacyData: unknown, key: string) {
  if (!legacyData || typeof legacyData !== "object" || Array.isArray(legacyData)) {
    return null;
  }
  const value = (legacyData as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function legacyNumber(legacyData: unknown, key: string) {
  if (!legacyData || typeof legacyData !== "object" || Array.isArray(legacyData)) {
    return null;
  }
  const value = (legacyData as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function EditAbsenceReportPage({ params }: Props) {
  const { id } = await params;

  const [result, childrenResult, teachersResult] = await Promise.all([
    getAbsenceReport(id),
    getChildren({ status: "ACTIVE", pageSize: "all" }),
    getEmployees("teacher", { isActive: true, pageSize: "all" }),
  ]);

  if ("error" in result || !result.report) {
    notFound();
  }

  const r = result.report;

  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    childNumber: c.childNumber ?? c.legacyId?.toString() ?? "—",
    branchId: c.branchId,
    classId: c.classId ?? null,
    className: c.class?.name ?? "",
    photo: c.photo ?? null,
  }));

  if (!children.some((child) => child.id === r.childId)) {
    children.unshift({
      id: r.childId,
      name: `${r.child.firstName} ${r.child.lastName}`,
      childNumber: r.child.childNumber ?? r.child.legacyId?.toString() ?? "—",
      branchId: r.child.branchId,
      classId: r.child.classId ?? null,
      className: r.child.class?.name ?? "",
      photo: r.child.photo ?? null,
    });
  }

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

  const legacyTeacherId = legacyNumber(r.legacyData, "teacher_id");
  const modernTeacherId = legacyString(r.legacyData, "modernTeacherId");
  const teacherId =
    modernTeacherId ??
    teachers.find((teacher) => teacher.legacyId === legacyTeacherId)?.id ??
    "";
  const legacyHospitalChoice = legacyString(r.legacyData, "attend_hos");

  const defaultValues: Partial<AbsenceReportFormValues> = {
    childId: r.childId,
    classId: r.child.classId ?? "",
    teacherId,
    date: r.date.toISOString().slice(0, 10),
    reason: legacyString(r.legacyData, "ab_reason") ?? r.reason ?? "",
    absentFrom: r.absentFrom?.toISOString().slice(0, 10) ?? "",
    absentTo: r.absentTo?.toISOString().slice(0, 10) ?? "",
    hospitalized: r.hospitalized,
    hospitalizedChoice: legacyHospitalChoice === "Yes" || legacyHospitalChoice === "No"
      ? legacyHospitalChoice
      : r.hospitalized
        ? "Yes"
        : "No",
    hospitalName: r.hospitalName ?? "",
    doctorName: r.doctorName ?? "",
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
        teacherList={teachers}
        defaultValues={defaultValues}
        reportId={id}
        existingAttachments={(r.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          fileUrl: attachment.fileUrl,
        }))}
      />
    </>
  );
}
