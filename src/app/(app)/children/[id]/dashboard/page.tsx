import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getAlarms } from "@/lib/actions/alarms";
import { getChildAttendance, getChildAbsences } from "@/lib/actions/attendance";
import { getMedicalForms } from "@/lib/actions/medical";
import { getVaccinations } from "@/lib/actions/medical";
import { getAccountingSummary } from "@/lib/actions/accounting";
import { getChildTimeline } from "@/lib/actions/timeline";
import { DashboardClient } from "./dashboard-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildDashboardPage({ params }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  // Fetch data in parallel
  const [
    { reports: recentReportsRaw },
    alarmsResult,
    attendanceRecords,
    absences,
    { forms: medicalForms },
    { vaccinations },
    accountingSummary,
    timeline,
  ] = await Promise.all([
    getDailyReports({ childId: id, pageSize: 5 }),
    getAlarms({ isActive: true, pageSize: 10 }),
    getChildAttendance(id),
    getChildAbsences(id),
    getMedicalForms({ childId: id }),
    getVaccinations({ childId: id }),
    getAccountingSummary(id),
    getChildTimeline(id),
  ]);

  // Compute attendance rate
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const attendanceRate = totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : "N/A";

  // Compute outstanding balance
  const balanceStr = accountingSummary.balance > 0
    ? `$${accountingSummary.balance.toFixed(2)}`
    : accountingSummary.balance < 0
      ? `-$${Math.abs(accountingSummary.balance).toFixed(2)}`
      : "$0.00";

  // Get parent contacts
  const parents = (child.parents ?? []).map((p) => ({
    type: p.type,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ") || null,
    phone: p.phone ?? p.mobile ?? null,
    email: p.email ?? null,
  }));

  // Map child to serializable shape
  const childData = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    photo: child.photo ?? null,
    className: child.class?.name ?? null,
    branchName: child.branch?.name ?? null,
    dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().slice(0, 10) : null,
    bloodType: child.bloodType ?? null,
    isActive: child.isActive,
    gender: child.gender ?? null,
    nationality: child.nationality ?? null,
    allergies: child.allergies ?? null,
    busAttendance: child.busAttendance,
    lunchIncluded: child.lunchIncluded,
    parents,
  };

  // Map recent reports
  const recentReports = recentReportsRaw.map((r) => {
    const meals = [
      r.breakfastPortion ? `Breakfast: ${r.breakfastPortion}` : null,
      r.lunchPortion ? `Lunch: ${r.lunchPortion}` : null,
      r.dessertPortion ? `Dessert: ${r.dessertPortion}` : null,
    ]
      .filter(Boolean)
      .join(", ") || "No meal data";

    let sleep = "N/A";
    if (r.isSleep && r.sleepFrom && r.sleepTo) {
      const fromMs = r.sleepFrom.getTime();
      const toMs = r.sleepTo.getTime();
      const diffHours = Math.abs(toMs - fromMs) / (1000 * 60 * 60);
      sleep = `${diffHours.toFixed(1)} hrs`;
    }

    return {
      date: r.reportDate.toISOString().slice(0, 10),
      mood: r.mood ?? null,
      meals,
      sleep,
    };
  });

  // Map alarms — filter to those relevant to this child or general
  const alarmsData = alarmsResult.success && alarmsResult.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (alarmsResult.data as any).alarms ?? []
    : [];

  const upcomingAlarms = alarmsData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => !a.referenceId || a.referenceId === id)
    .slice(0, 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      const colorMap: Record<string, string> = {
        VACCINATION: "text-red-500",
        ASSESSMENT: "text-blue-500",
        BIRTHDAY: "text-pink-500",
        MEDICAL: "text-red-500",
        MEDICINE: "text-orange-500",
        EVENT: "text-purple-500",
        INSURANCE: "text-yellow-500",
        PAYMENT: "text-green-500",
        REQUEST: "text-blue-500",
        CONTRACT: "text-gray-500",
        OTHER: "text-gray-500",
      };
      return {
        type: a.type as string,
        message: a.message as string | null,
        date: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : null,
        color: colorMap[a.type] ?? "text-gray-500",
      };
    });

  // Map vaccinations
  const upcomingVaccinations = vaccinations
    .filter((v) => v.nextDueDate && v.nextDueDate >= new Date())
    .slice(0, 5)
    .map((v) => ({
      name: v.vaccineName,
      dueDate: v.nextDueDate!.toISOString().slice(0, 10),
    }));

  const stats = {
    attendanceRate,
    totalReports: recentReportsRaw.length > 0 ? recentReportsRaw.length : 0,
    totalAbsences: absences.length,
    medicalRecords: medicalForms.length,
    outstandingBalance: balanceStr,
  };

  return (
    <DashboardClient
      child={childData}
      stats={stats}
      recentReports={recentReports}
      upcomingAlarms={upcomingAlarms}
      upcomingVaccinations={upcomingVaccinations}
      timeline={timeline}
    />
  );
}
