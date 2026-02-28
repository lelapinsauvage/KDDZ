import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { AccidentDetailClient } from "./accident-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccidentReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  // Fetch children list for the dropdown
  const children = await db.child.findMany({
    where: { isActive: true, branch: { organizationId: orgId } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  if (isNew) {
    return (
      <AccidentDetailClient
        isNew
        formId={null}
        childId=""
        formData={{
          childId: "",
          date: new Date().toISOString().split("T")[0],
          time: "",
          location: "",
          accidentCause: "",
          description: "",
          injuryType: "",
          severity: "",
          firstAidGiven: "",
          emergencyHospital: false,
          treatment: "",
          parentNotified: false,
          witnesses: "",
          followUpNotes: "",
          status: "DRAFT",
        }}
        childrenList={childOptions}
      />
    );
  }

  // Load existing form
  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (form.data ?? {}) as Record<string, any>;

  const formData = {
    childId: form.childId,
    date: (data.date as string) ?? form.createdAt.toISOString().split("T")[0],
    time: (data.time as string) ?? "",
    location: (data.location as string) ?? "",
    accidentCause: (data.accidentCause as string) ?? "",
    description: (data.description as string) ?? "",
    injuryType: (data.injuryType as string) ?? "",
    severity: (data.severity as string) ?? "",
    firstAidGiven: (data.firstAidGiven as string) ?? "",
    emergencyHospital: (data.emergencyHospital as boolean) ?? false,
    treatment: (data.treatment as string) ?? "",
    parentNotified: (data.parentNotified as boolean) ?? false,
    witnesses: (data.witnesses as string) ?? "",
    followUpNotes: (data.followUpNotes as string) ?? "",
    status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
  };

  const childName = `${form.child.firstName} ${form.child.lastName}`;

  return (
    <AccidentDetailClient
      isNew={false}
      formId={form.id}
      childId={form.childId}
      childName={childName}
      formData={formData}
      childrenList={childOptions}
    />
  );
}
