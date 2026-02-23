"use server";

import { db } from "@/lib/db";

export interface TimelineEvent {
  id: string;
  type:
    | "daily_report"
    | "absence"
    | "medical"
    | "vaccination"
    | "payment"
    | "accident"
    | "call";
  date: string;
  title: string;
  summary: string;
  href: string;
  metadata?: Record<string, string>;
}

export async function getChildTimeline(
  childId: string,
  limit = 30
): Promise<TimelineEvent[]> {
  const [reports, absences, medicalForms, vaccinations, payments, callLogs] =
    await Promise.all([
      db.dailyReport.findMany({
        where: { childId },
        select: {
          id: true,
          reportDate: true,
          status: true,
          mood: true,
          breakfastPortion: true,
          lunchPortion: true,
          isSleep: true,
        },
        orderBy: { reportDate: "desc" },
        take: 10,
      }),

      db.absenceReport.findMany({
        where: { childId },
        select: { id: true, date: true, reason: true, status: true },
        orderBy: { date: "desc" },
        take: 10,
      }),

      db.medicalForm.findMany({
        where: { childId, formType: { not: "ACCIDENTS" } },
        select: { id: true, formType: true, status: true, data: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      db.vaccination.findMany({
        where: { childId },
        select: { id: true, vaccineName: true, dateGiven: true, nextDueDate: true },
        orderBy: { dateGiven: "desc" },
        take: 10,
      }),

      db.payment.findMany({
        where: { childId },
        select: { id: true, amount: true, status: true, date: true, category: true },
        orderBy: { date: "desc" },
        take: 10,
      }),

      db.callLog.findMany({
        where: { childId },
        select: { id: true, date: true, direction: true, subject: true, contact: true },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

  // Also fetch accident forms separately
  const accidentForms = await db.medicalForm.findMany({
    where: { childId, formType: "ACCIDENTS" },
    select: { id: true, status: true, data: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const events: TimelineEvent[] = [];

  // Daily reports
  for (const r of reports) {
    const parts: string[] = [];
    if (r.mood) parts.push(`Mood: ${r.mood}`);
    if (r.breakfastPortion) parts.push(`Breakfast: ${r.breakfastPortion}`);
    if (r.lunchPortion) parts.push(`Lunch: ${r.lunchPortion}`);
    if (r.isSleep) parts.push("Slept");
    events.push({
      id: r.id,
      type: "daily_report",
      date: r.reportDate.toISOString().slice(0, 10),
      title: `Daily Report — ${r.status}`,
      summary: parts.join(", ") || "Report submitted",
      href: `/daily-reports/${r.id}`,
      metadata: { status: r.status },
    });
  }

  // Absences
  for (const a of absences) {
    events.push({
      id: a.id,
      type: "absence",
      date: a.date.toISOString().slice(0, 10),
      title: `Absence — ${a.status}`,
      summary: a.reason || "No reason provided",
      href: `/absent-reports`,
      metadata: { status: a.status },
    });
  }

  // Medical forms (non-accident)
  for (const m of medicalForms) {
    const data = m.data as Record<string, string> | null;
    const title = data?.title || data?.diagnosis || m.formType;
    events.push({
      id: m.id,
      type: "medical",
      date: m.createdAt.toISOString().slice(0, 10),
      title: `${m.formType} — ${m.status}`,
      summary: typeof title === "string" ? title : m.formType,
      href: `/medical/${m.formType.toLowerCase()}`,
      metadata: { formType: m.formType, status: m.status },
    });
  }

  // Vaccinations
  for (const v of vaccinations) {
    events.push({
      id: v.id,
      type: "vaccination",
      date: v.dateGiven?.toISOString().slice(0, 10) ?? v.nextDueDate?.toISOString().slice(0, 10) ?? "",
      title: v.vaccineName,
      summary: v.dateGiven
        ? `Given on ${v.dateGiven.toISOString().slice(0, 10)}`
        : `Due ${v.nextDueDate?.toISOString().slice(0, 10) ?? "N/A"}`,
      href: `/medical/vaccinations`,
    });
  }

  // Payments
  for (const p of payments) {
    events.push({
      id: p.id,
      type: "payment",
      date: p.date.toISOString().slice(0, 10),
      title: `Payment — ${p.status}`,
      summary: `$${p.amount.toNumber().toFixed(2)}${p.category ? ` (${p.category})` : ""}`,
      href: `/children/${childId}/accounting`,
      metadata: { status: p.status },
    });
  }

  // Accidents
  for (const a of accidentForms) {
    const data = a.data as Record<string, string> | null;
    events.push({
      id: a.id,
      type: "accident",
      date: a.createdAt.toISOString().slice(0, 10),
      title: `Accident Report — ${a.status}`,
      summary: data?.description || data?.title || "Accident reported",
      href: `/children/${childId}/accidents`,
      metadata: { status: a.status },
    });
  }

  // Call logs
  for (const c of callLogs) {
    events.push({
      id: c.id,
      type: "call",
      date: c.date.toISOString().slice(0, 10),
      title: `${c.direction} Call${c.contact ? ` — ${c.contact}` : ""}`,
      summary: c.subject || "Phone call",
      href: `/children/${childId}/calls`,
    });
  }

  // Sort by date descending and limit
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events.slice(0, limit);
}
