import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { ConditionDetailClient } from "./condition-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConditionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  const children = await db.child.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  if (isNew) {
    return (
      <ConditionDetailClient
        isNew
        formData={{
          childName: "",
          condition: "",
          description: "",
          severity: "",
          diagnosedDate: "",
          treatmentPlan: "",
          currentStatus: "",
          doctorNotes: "",
        }}
        children={childOptions}
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
    childName: `${form.child.firstName} ${form.child.lastName}`,
    condition: (data.condition as string) ?? "",
    description: (data.description as string) ?? "",
    severity: (data.severity as string) ?? "",
    diagnosedDate: (data.diagnosedDate as string) ?? "",
    treatmentPlan: (data.treatmentPlan as string) ?? "",
    currentStatus: (data.currentStatus as string) ?? "",
    doctorNotes: (data.doctorNotes as string) ?? "",
  };

  return (
    <ConditionDetailClient
      isNew={false}
      formData={formData}
      children={childOptions}
    />
  );
}
