import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { getEmployees } from "@/lib/actions/employees";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { AccidentDetailClient, type AccidentFormValues } from "./accident-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childId?: string }>;
}

function legacyString(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value ? "Yes" : "No";
  }
  return "";
}

function legacyNumber(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default async function AccidentReportDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { childId: requestedChildId }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const [children, teachersResult] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, branch: { organizationId: orgId } },
      select: {
        id: true,
        legacyId: true,
        childNumber: true,
        firstName: true,
        lastName: true,
        photo: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true, legacyId: true } },
        class: { select: { id: true, name: true, legacyId: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    getEmployees("teacher", { isActive: true, pageSize: "all" }),
  ]);

  const childOptions = children.map((c) => ({
    id: c.id,
    legacyId: c.legacyId,
    name: `${c.firstName} ${c.lastName}`,
    childNumber: c.childNumber ?? c.legacyId?.toString() ?? "—",
    photo: c.photo ?? null,
    branchId: c.branchId,
    branchName: c.branch?.name ?? "—",
    branchLegacyId: c.branch?.legacyId ?? null,
    classId: c.classId ?? null,
    className: c.class?.name ?? "",
    classLegacyId: c.class?.legacyId ?? null,
  }));

  const teacherOptions = ((teachersResult.data as { employees?: Array<{
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

  if (isNew) {
    const formData: AccidentFormValues = {
      childId: requestedChildId ?? "",
      cause: "",
      accidentDate: todayString(),
      accidentTime: "",
      place: "",
      area: "",
      cameraNumber: "",
      firstAid: "",
      emergencyHospital: "",
      treatment: "",
      teacherId: "",
      status: "DRAFT",
    };

    return (
      <AccidentDetailClient
        isNew
        formId={null}
        formData={formData}
        initialData={{}}
        childrenList={childOptions}
        teacherList={teacherOptions}
        initialAttachments={[]}
      />
    );
  }

  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  const data = (form.data ?? {}) as Record<string, unknown>;

  if (!childOptions.some((child) => child.id === form.childId)) {
    childOptions.unshift({
      id: form.childId,
      legacyId: form.child.legacyId ?? null,
      name: `${form.child.firstName} ${form.child.lastName}`,
      childNumber: form.child.childNumber ?? form.child.legacyId?.toString() ?? "—",
      photo: form.child.photo ?? null,
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "—",
      branchLegacyId: form.child.branch?.legacyId ?? null,
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      classLegacyId: form.child.class?.legacyId ?? null,
    });
  }

  const legacyTeacherId = legacyNumber(data, "teacher_id");
  const teacherId =
    legacyString(data, "modernTeacherId", "teacherId") ||
    teacherOptions.find((teacher) => teacher.legacyId === legacyTeacherId)?.id ||
    "";
  const hospital = legacyString(data, "em_hospital", "emergencyHospital");

  const formData: AccidentFormValues = {
    childId: form.childId,
    cause: legacyString(data, "cause", "accidentCause"),
    accidentDate: legacyString(data, "accident_date", "date") || form.createdAt.toISOString().split("T")[0],
    accidentTime: legacyString(data, "accident_time", "time"),
    place: legacyString(data, "place", "location"),
    area: legacyString(data, "area", "specifyArea"),
    cameraNumber: legacyString(data, "camnum", "cameraNumber"),
    firstAid: legacyString(data, "firstaid", "firstAid", "firstAidGiven"),
    emergencyHospital: hospital === "true" ? "Yes" : hospital === "false" ? "No" : hospital,
    treatment: legacyString(data, "treatment"),
    teacherId,
    status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
  };

  return (
    <AccidentDetailClient
      isNew={false}
      formId={form.id}
      formData={formData}
      initialData={data}
      childrenList={childOptions}
      teacherList={teacherOptions}
      initialAttachments={form.attachments.map((attachment) => ({
        id: attachment.id,
        title: attachment.title ?? "",
        filename: attachment.filename,
        fileUrl: attachment.fileUrl,
      }))}
    />
  );
}
