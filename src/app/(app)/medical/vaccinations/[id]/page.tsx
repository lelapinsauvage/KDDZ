import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { VaccinationDetailClient } from "./vaccination-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VaccinationDetailPage({ params }: PageProps) {
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
      <VaccinationDetailClient
        isNew
        formData={{
          childName: "",
          vaccineName: "",
          dateGiven: new Date().toISOString().split("T")[0],
          nextDueDate: "",
          batchNumber: "",
          administeredBy: "",
          notes: "",
        }}
        children={childOptions}
      />
    );
  }

  // Load existing vaccination record
  const vaccination = await db.vaccination.findUnique({
    where: { id },
    include: { child: true },
  });

  if (!vaccination) {
    notFound();
  }

  const formData = {
    childName: `${vaccination.child.firstName} ${vaccination.child.lastName}`,
    vaccineName: vaccination.vaccineName,
    dateGiven: vaccination.dateGiven
      ? vaccination.dateGiven.toISOString().split("T")[0]
      : "",
    nextDueDate: vaccination.nextDueDate
      ? vaccination.nextDueDate.toISOString().split("T")[0]
      : "",
    batchNumber: "",
    administeredBy: "",
    notes: vaccination.notes ?? "",
  };

  return (
    <VaccinationDetailClient
      isNew={false}
      formData={formData}
      children={childOptions}
    />
  );
}
