import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { VisitDetailClient } from "./visit-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitDetailPage({ params }: PageProps) {
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
      <VisitDetailClient
        isNew
        formId={null}
        initialData={{
          childId: "",
          visitDate: new Date().toISOString().split("T")[0],
          doctor: "",
          reason: "",
          diagnosis: "",
          treatment: "",
          followUpDate: "",
          notes: "",
        }}
        status="DRAFT"
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

  return (
    <VisitDetailClient
      isNew={false}
      formId={form.id}
      initialData={{
        childId: form.childId,
        visitDate: (data.visitDate as string) ?? form.createdAt.toISOString().split("T")[0],
        doctor: (data.doctor as string) ?? "",
        reason: (data.reason as string) ?? "",
        diagnosis: (data.diagnosis as string) ?? "",
        treatment: (data.treatment as string) ?? "",
        followUpDate: (data.followUpDate as string) ?? "",
        notes: (data.notes as string) ?? "",
      }}
      status={form.status as "DRAFT" | "SUBMITTED" | "REVIEWED"}
      children={childOptions}
    />
  );
}
