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
        vaccinationId={null}
        childId=""
        vaccineName=""
        doseNumber=""
        dateGiven={new Date().toISOString().split("T")[0]}
        nextDueDate=""
        administeredBy=""
        notes=""
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

  // Parse dose number and administered by from vaccineName and notes
  let vaccineName = vaccination.vaccineName;
  let doseNumber = "";
  let administeredBy = "";
  let userNotes = vaccination.notes ?? "";

  // Extract dose from vaccine name: "DTaP (2nd Dose)" -> vaccineName="DTaP", doseNumber="2nd Dose"
  const doseMatch = vaccineName.match(/^(.+?)\s*\((\d+(?:st|nd|rd|th)\s+(?:Dose|Booster))\)$/);
  if (doseMatch) {
    vaccineName = doseMatch[1].trim();
    doseNumber = doseMatch[2];
  }

  // Extract administered by from notes: "Administered by: Dr. X.\n..." or "Administered by: Dr. X."
  const adminMatch = userNotes.match(/^Administered by:\s*(.+?)\.?\n?/);
  if (adminMatch) {
    administeredBy = adminMatch[1].trim();
    userNotes = userNotes.replace(/^Administered by:\s*.+?\.?\n?/, "").trim();
  }

  return (
    <VaccinationDetailClient
      isNew={false}
      vaccinationId={vaccination.id}
      childId={vaccination.childId}
      vaccineName={vaccineName}
      doseNumber={doseNumber}
      dateGiven={vaccination.dateGiven ? vaccination.dateGiven.toISOString().split("T")[0] : ""}
      nextDueDate={vaccination.nextDueDate ? vaccination.nextDueDate.toISOString().split("T")[0] : ""}
      administeredBy={administeredBy}
      notes={userNotes}
      children={childOptions}
    />
  );
}
