import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getVaccinations } from "@/lib/actions/medical";
import { ChildPrintClient } from "./print-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildPrintPage({ params }: Props) {
  const { id } = await params;

  const [child, { vaccinations }] = await Promise.all([
    getChild(id),
    getVaccinations({ childId: id }),
  ]);

  if (!child) {
    notFound();
  }

  const parents = (child.parents ?? []).map((p) => ({
    type: p.type,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ") || null,
    phone: p.phone ?? p.mobile ?? null,
    email: p.email ?? null,
    relation: p.type,
  }));

  const relatives = (child.relatives ?? []).map((r) => ({
    name: r.name || null,
    phone: r.phone ?? null,
    relation: r.relation ?? "Relative",
  }));

  const vaccinationList = vaccinations.map((v) => ({
    name: v.vaccineName,
    dateGiven: v.dateGiven ? v.dateGiven.toISOString().slice(0, 10) : null,
    nextDueDate: v.nextDueDate ? v.nextDueDate.toISOString().slice(0, 10) : null,
  }));

  const childData = {
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().slice(0, 10) : null,
    gender: child.gender ?? null,
    nationality: child.nationality ?? null,
    bloodType: child.bloodType ?? null,
    allergies: child.allergies ?? null,
    className: child.class?.name ?? null,
    branchName: child.branch?.name ?? null,
    isActive: child.isActive,
    busAttendance: child.busAttendance,
    lunchIncluded: child.lunchIncluded,
    parents,
    relatives,
    vaccinations: vaccinationList,
  };

  return <ChildPrintClient child={childData} />;
}
