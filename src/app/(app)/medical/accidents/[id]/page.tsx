import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { AccidentDetailClient } from "./accident-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default async function AccidentReportDetailPage({ params }: PageProps) {
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
      <AccidentDetailClient
        isNew
        formData={{
          childName: "",
          date: new Date().toISOString().split("T")[0],
          time: "",
          location: "",
          description: "",
          injuryType: "",
          severity: "",
          firstAidGiven: "",
          parentNotified: false,
          doctorNotes: "",
          status: "Draft",
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
    date: (data.date as string) ?? form.createdAt.toISOString().split("T")[0],
    time: (data.time as string) ?? "",
    location: (data.location as string) ?? "",
    description: (data.description as string) ?? "",
    injuryType: (data.injuryType as string) ?? "",
    severity: (data.severity as string) ?? "",
    firstAidGiven: (data.firstAidGiven as string) ?? "",
    parentNotified: (data.parentNotified as boolean) ?? false,
    doctorNotes: (data.doctorNotes as string) ?? "",
    status: statusLabel(form.status),
  };

  return (
    <AccidentDetailClient
      isNew={false}
      formData={formData}
      children={childOptions}
    />
  );
}
