"use server";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { verifyChildAccess } from "@/lib/verify-org-access";

export interface MedicalEvent {
  id: string;
  type: "general" | "conditions" | "visits" | "vaccinations" | "accidents";
  date: string;
  status: string;
  title: string;
  summary: string;
}

export interface VaccinationRecord {
  id: string;
  name: string;
  dateGiven: string | null;
  nextDueDate: string | null;
  notes: string | null;
}

export interface MedicalTimelineData {
  events: MedicalEvent[];
  vaccinations: VaccinationRecord[];
  summary: {
    general: number;
    conditions: number;
    visits: number;
    vaccinations: number;
    accidents: number;
  };
}

export async function getChildMedicalTimeline(
  childId: string
): Promise<MedicalTimelineData> {
  const { organizationId: orgId } = await requireOrg();

  if (!(await verifyChildAccess(childId, orgId))) {
    return { events: [], vaccinations: [], summary: { general: 0, conditions: 0, visits: 0, vaccinations: 0, accidents: 0 } };
  }

  const [forms, vaccinations] = await Promise.all([
    db.medicalForm.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
    }),
    db.vaccination.findMany({
      where: { childId },
      orderBy: [{ nextDueDate: "asc" }, { dateGiven: "desc" }],
    }),
  ]);

  // Count by type
  const summary = {
    general: 0,
    conditions: 0,
    visits: 0,
    vaccinations: vaccinations.length,
    accidents: 0,
  };

  const events: MedicalEvent[] = [];

  for (const form of forms) {
    const formType = form.formType.toLowerCase() as
      | "general"
      | "conditions"
      | "visits"
      | "vaccinations"
      | "accidents";

    // Count
    if (formType in summary && formType !== "vaccinations") {
      summary[formType]++;
    }

    const data = form.data as Record<string, string> | null;
    const title =
      data?.title || data?.diagnosis || data?.condition || form.formType;
    const summaryText =
      data?.notes ||
      data?.description ||
      data?.treatment ||
      data?.remarks ||
      form.formType;

    events.push({
      id: form.id,
      type: formType,
      date: form.createdAt.toISOString().slice(0, 10),
      status: form.status,
      title: typeof title === "string" ? title : form.formType,
      summary: typeof summaryText === "string" ? summaryText : "",
    });
  }

  // Add vaccinations as events too
  for (const v of vaccinations) {
    events.push({
      id: v.id,
      type: "vaccinations",
      date:
        v.dateGiven?.toISOString().slice(0, 10) ??
        v.nextDueDate?.toISOString().slice(0, 10) ??
        "",
      status: v.dateGiven ? "GIVEN" : "PENDING",
      title: v.vaccineName,
      summary: v.dateGiven
        ? `Administered on ${v.dateGiven.toISOString().slice(0, 10)}`
        : `Due ${v.nextDueDate?.toISOString().slice(0, 10) ?? "N/A"}`,
    });
  }

  // Sort by date desc
  events.sort((a, b) => b.date.localeCompare(a.date));

  const vaccinationRecords: VaccinationRecord[] = vaccinations.map((v) => ({
    id: v.id,
    name: v.vaccineName,
    dateGiven: v.dateGiven?.toISOString().slice(0, 10) ?? null,
    nextDueDate: v.nextDueDate?.toISOString().slice(0, 10) ?? null,
    notes: v.notes,
  }));

  return { events, vaccinations: vaccinationRecords, summary };
}
