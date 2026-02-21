import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getChildAbsences } from "@/lib/actions/attendance";
import { AbsenceClient } from "./absence-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildAbsencePage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  const absencesRaw = await getChildAbsences(id);

  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
  };

  // Serialize dates and map to plain objects
  const absences = absencesRaw.map((a) => ({
    id: a.id,
    date: a.date.toISOString().slice(0, 10),
    reason: a.reason ?? null,
    status: a.status,
    createdBy: a.createdBy?.name ?? a.createdBy?.email ?? null,
  }));

  return (
    <AbsenceClient
      child={childData}
      absences={absences}
    />
  );
}
