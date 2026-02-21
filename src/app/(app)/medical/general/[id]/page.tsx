import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { GeneralDetailClient } from "./general-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Map MedicalFormStatus to display label
function statusLabel(s: string): string {
  switch (s) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "REVIEWED":
      return "Reviewed";
    default:
      return s;
  }
}

export default async function GeneralMedicalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

  // Fetch children list for the dropdown
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
      <GeneralDetailClient
        isNew
        formData={{
          childName: "",
          date: new Date().toISOString().split("T")[0],
          doctor: "",
          height: "",
          weight: "",
          headCircumference: "",
          generalHealthNotes: "",
          doctorNotes: "",
          status: "Draft",
        }}
        children={childOptions}
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
    childName: `${form.child.firstName} ${form.child.lastName}`,
    date: data.date ?? form.createdAt.toISOString().split("T")[0],
    doctor: (data.doctor as string) ?? "",
    height: (data.height as string) ?? "",
    weight: (data.weight as string) ?? "",
    headCircumference: (data.headCircumference as string) ?? "",
    generalHealthNotes: (data.generalHealthNotes as string) ?? "",
    doctorNotes: (data.doctorNotes as string) ?? "",
    status: statusLabel(form.status),
  };

  return (
    <GeneralDetailClient
      isNew={false}
      formData={formData}
      children={childOptions}
    />
  );
}
