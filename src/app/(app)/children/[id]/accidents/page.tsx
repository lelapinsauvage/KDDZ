import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getMedicalForms, getOrgStaffList } from "@/lib/actions/medical";
import { AccidentsClient } from "./accidents-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildAccidentsPage({ params }: Props) {
  const { id } = await params;

  const [child, { forms }, staffList] = await Promise.all([
    getChild(id),
    getMedicalForms({ childId: id, formType: "ACCIDENTS" }),
    getOrgStaffList(),
  ]);

  if (!child) {
    notFound();
  }

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // Extract accident data from form.data JSON
  const accidents = forms.map((form) => {
    const data = (form.data ?? {}) as Record<string, unknown>;

    return {
      id: form.id,
      date: (data.date as string) ?? form.createdAt.toISOString().slice(0, 10),
      time: (data.time as string) ?? "",
      cause: (data.cause as string) ?? "",
      location: (data.location as string) ?? "",
      specifyArea: (data.specifyArea as string) ?? "",
      cameraNumber: (data.cameraNumber as string) ?? "",
      firstAid: (data.firstAid as string) ?? "",
      emergencyHospital: (data.emergencyHospital as string) ?? "",
      treatment: (data.treatment as string) ?? "",
      createdBy: form.createdBy?.name ?? form.createdBy?.email ?? null,
    };
  });

  return (
    <AccidentsClient
      child={childData}
      accidents={accidents}
      staffList={staffList}
    />
  );
}
