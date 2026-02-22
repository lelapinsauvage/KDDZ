import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { GeneralDetailClient } from "./general-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
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
        formId={null}
        initialData={{
          childId: "",
          doctor: "",
          bloodType: "",
          allergies: "",
          chronicConditions: "",
          medications: "",
          specialNeeds: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          hasInsurance: false,
          insuranceType: "",
          insuranceExpiry: "",
          generalHealthNotes: "",
          doctorNotes: "",
        }}
        initialStatus="DRAFT"
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

  const initialData = {
    childId: form.childId,
    doctor: (data.doctor as string) ?? "",
    bloodType: (data.bloodType as string) ?? "",
    allergies: (data.allergies as string) ?? "",
    chronicConditions: (data.chronicConditions as string) ?? "",
    medications: (data.medications as string) ?? "",
    specialNeeds: (data.specialNeeds as string) ?? "",
    emergencyContactName: (data.emergencyContactName as string) ?? "",
    emergencyContactPhone: (data.emergencyContactPhone as string) ?? "",
    hasInsurance: (data.hasInsurance as boolean) ?? false,
    insuranceType: (data.insuranceType as string) ?? "",
    insuranceExpiry: (data.insuranceExpiry as string) ?? "",
    generalHealthNotes: (data.generalHealthNotes as string) ?? "",
    doctorNotes: (data.doctorNotes as string) ?? "",
  };

  return (
    <GeneralDetailClient
      isNew={false}
      formId={form.id}
      initialData={initialData}
      initialStatus={form.status as "DRAFT" | "SUBMITTED" | "REVIEWED"}
      children={childOptions}
    />
  );
}
