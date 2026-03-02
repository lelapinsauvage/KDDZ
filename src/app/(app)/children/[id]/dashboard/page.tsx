import { notFound } from "next/navigation";
import { getChild, getChildDashboardStats } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getChildAttendance, getChildAbsences } from "@/lib/actions/attendance";
import { getMedicalForms } from "@/lib/actions/medical";
import { getVaccinations } from "@/lib/actions/medical";
import { getAccountingSummary } from "@/lib/actions/accounting";
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
    { reports: allReportsRaw, total: totalReportsCount },
    attendanceRecords,
    absences,
    { forms: medicalForms },
    { vaccinations: _vaccinations },
    accountingSummary,
    dashboardStats,
  ] = await Promise.all([
    getDailyReports({ childId: id, pageSize: 100 }),
    getChildAttendance(id),
    getChildAbsences(id),
    getMedicalForms({ childId: id, pageSize: 100 }),
    getVaccinations({ childId: id }),
    getAccountingSummary(id),
    getChildDashboardStats(id),
  ]);

  // Compute attendance stats
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter((r) => r.status === "ABSENT").length;
  const draftDays = attendanceRecords.filter((r) => r.status === "DRAFT").length;
  const noReportDays = totalDays - presentDays - absentDays - draftDays;

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

  // Mother/father phone numbers
  const motherParent = (child.parents ?? []).find((p) => p.type === "MOTHER");
  const fatherParent = (child.parents ?? []).find((p) => p.type === "FATHER");

  // Map child to serializable shape with all fields needed
  const childData = {
    id: child.id,
    firstName: child.firstName,
    firstNameAr: child.firstNameAr ?? null,
    lastName: child.lastName,
    lastNameAr: child.lastNameAr ?? null,
    photo: child.photo ?? null,
    childNumber: child.childNumber ?? null,
    className: child.class?.name ?? null,
    branchName: child.branch?.name ?? null,
    dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString().slice(0, 10) : null,
    enrollmentDate: child.enrollmentDate ? child.enrollmentDate.toISOString().slice(0, 10) : null,
    bloodType: child.bloodType ?? null,
    isActive: child.isActive,
    gender: child.gender ?? null,
    nationality: child.nationality ?? null,
    language: child.language ?? null,
    allergies: child.allergies ?? null,
    busAttendance: child.busAttendance,
    lunchIncluded: child.lunchIncluded,
    diaperType: child.diaperType ?? null,
    milkType: child.milkType ?? null,
    milkPortions: child.milkPortions ?? null,
    parents,
    motherPhone: motherParent?.phone ?? motherParent?.mobile ?? null,
    fatherPhone: fatherParent?.phone ?? fatherParent?.mobile ?? null,
    relatives: (child.relatives ?? []).map((r) => ({
      name: [r.name, r.lastName].filter(Boolean).join(" "),
      relation: r.relation ?? null,
      phone: r.phone ?? r.mobile ?? null,
      isAuthorized: r.isAuthorized,
      isEmergencyContact: r.isEmergencyContact,
    })),
  };

  // Map recent reports for table (first 10)
  const recentReports = allReportsRaw.slice(0, 10).map((r) => ({
    id: r.id,
    date: r.reportDate.toISOString().slice(0, 10),
    breakfastPortion: r.breakfastPortion ?? null,
    lunchPortion: r.lunchPortion ?? null,
    dessertPortion: r.dessertPortion ?? null,
    status: r.status,
    mood: r.mood ?? null,
  }));

  // Map absence reports for table
  const absenceList = absences.slice(0, 10).map((a) => ({
    id: a.id,
    date: a.date.toISOString().slice(0, 10),
    reason: a.reason ?? null,
    status: a.status,
  }));

  // Map medical forms for table
  const medicalList = medicalForms.map((m) => ({
    id: m.id,
    formType: m.formType,
    status: m.status,
    date: m.createdAt.toISOString().slice(0, 10),
  }));

  // Map assessments for table
  const assessmentList = dashboardStats.assessments.map((a) => ({
    id: a.id,
    assessmentType: a.assessmentType,
    status: a.status,
    date: a.createdAt.toISOString().slice(0, 10),
  }));

  // Compute medical stat breakdowns (MedicalFormStatus: DRAFT | SUBMITTED | REVIEWED)
  const medicalPublished = medicalForms.filter((m) => m.status === "SUBMITTED" || m.status === "REVIEWED").length;
  const medicalDrafts = medicalForms.filter((m) => m.status === "DRAFT").length;
  const medicalMissing = medicalForms.length - medicalPublished - medicalDrafts;

  // Compute assessment stat breakdowns (AssessmentStatus: DRAFT | SUBMITTED | REVIEWED)
  const allAssessments = dashboardStats.assessments;
  const assessmentsCompleted = allAssessments.filter((a) => a.status === "SUBMITTED" || a.status === "REVIEWED").length;
  const assessmentsDrafts = allAssessments.filter((a) => a.status === "DRAFT").length;
  const assessmentsIncomplete = 0; // All non-completed, non-draft are counted as missing
  const assessmentsMissing = allAssessments.length - assessmentsCompleted - assessmentsDrafts;

  const stats = {
    callsInOut: dashboardStats.incomingCalls + dashboardStats.outgoingCalls,
    accidentReports: dashboardStats.accidentReports,
    totalPayments: `$${dashboardStats.totalPayments.toFixed(2)}`,
    totalAttendance: dashboardStats.totalAttendance,
    totalAbsence: dashboardStats.totalAbsence,
    missingDailyReports: totalDays > 0 ? Math.max(0, totalDays - dashboardStats.totalDailyReports) : 0,
    missingAbsentReports: absentDays > 0 ? Math.max(0, absentDays - dashboardStats.totalAbsenceReports) : 0,
    attendanceRate: totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : "N/A",
    totalReports: totalReportsCount,
    medicalPublished,
    medicalMissing,
    medicalDrafts,
    assessmentsCompleted,
    assessmentsMissing,
    assessmentsIncomplete,
    assessmentsDrafts,
  };

  const attendanceChart = {
    present: presentDays,
    absent: absentDays,
    draft: draftDays,
    noReport: noReportDays,
  };

  return (
    <DashboardClient
      child={childData}
      stats={stats}
      attendanceChart={attendanceChart}
      recentReports={recentReports}
      absenceList={absenceList}
      medicalList={medicalList}
      assessmentList={assessmentList}
    />
  );
}
