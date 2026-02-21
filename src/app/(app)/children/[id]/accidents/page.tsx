import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getMedicalForms } from "@/lib/actions/medical";
import { AccidentsClient } from "./accidents-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildAccidentsPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const { forms } = await getMedicalForms({ childId: id, formType: "ACCIDENTS" });

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // Extract accident data from form.data JSON
  const accidents = forms.map((form) => {
    // form.data is a JSON field that may contain accident details
    const data = (form.data ?? {}) as Record<string, unknown>;

    return {
      id: form.id,
      date: form.createdAt.toISOString().slice(0, 10),
      time: (data.time as string) ?? "",
      location: (data.location as string) ?? "",
      description: (data.description as string) ?? "",
      severity: (data.severity as string) ?? "MINOR",
      firstAid: (data.firstAid as string) ?? "",
      parentNotified: (data.parentNotified as boolean) ?? false,
    };
  });

  return (
    <AccidentsClient
      child={childData}
      accidents={accidents}
    />
  );
}
