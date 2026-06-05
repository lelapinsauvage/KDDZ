import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { ConditionDetailClient } from "./condition-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConditionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const children = await db.child.findMany({
    where: { isActive: true, branch: { organizationId: orgId } },
    select: { id: true, firstName: true, lastName: true, branchId: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    branchId: c.branchId,
  }));

  if (isNew) {
    return (
      <ConditionDetailClient
        isNew
        formId={null}
        formData={{
          childId: "",
          conditionType: "",
          description: "",
          severity: "",
          diagnosisDate: new Date().toISOString().split("T")[0],
          treatmentPlan: "",
          doctorNotes: "",
        }}
        childrenList={childOptions}
        initialAttachments={[]}
      />
    );
  }

  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (form.data ?? {}) as Record<string, any>;

  const formData = {
    childId: form.childId,
    conditionType: (data.conditionType as string) ?? "",
    description: (data.description as string) ?? "",
    severity: (data.severity as string) ?? "",
    diagnosisDate: (data.diagnosisDate as string) ?? form.createdAt.toISOString().split("T")[0],
    treatmentPlan: (data.treatmentPlan as string) ?? "",
    doctorNotes: (data.doctorNotes as string) ?? "",
  };

  return (
    <ConditionDetailClient
      isNew={false}
      formId={form.id}
      formData={formData}
      childrenList={childOptions}
      initialAttachments={form.attachments.map((attachment) => ({
        id: attachment.id,
        title: attachment.title ?? "",
        filename: attachment.filename,
        fileUrl: attachment.fileUrl,
      }))}
    />
  );
}
