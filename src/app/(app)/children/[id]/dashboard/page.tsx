import { notFound } from "next/navigation";
import { getChild, getChildDashboardStats } from "@/lib/actions/children";
import { getDailyReports } from "@/lib/actions/daily-reports";
import { getChildAttendance, getChildAbsences } from "@/lib/actions/attendance";
import { getMedicalForms } from "@/lib/actions/medical";
import { getVaccinations } from "@/lib/actions/medical";
import { getAccountingSummary } from "@/lib/actions/accounting";
import { getChildDailyComplianceStats } from "@/lib/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ year?: string | string[] }>;
}

export default async function ChildDashboardPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const selectedYearId = typeof query?.year === "string" ? query.year : null;

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
    { vaccinations },
    _accountingSummary,
    dashboardStats,
    childDailyStats,
  ] = await Promise.all([
    getDailyReports({ childId: id, pageSize: 100 }),
    getChildAttendance(id),
    getChildAbsences(id),
    getMedicalForms({ childId: id, pageSize: 100 }),
    getVaccinations({ childId: id }),
    getAccountingSummary(id),
    getChildDashboardStats(id),
    getChildDailyComplianceStats(id, { schoolYearId: selectedYearId }),
  ]);

  // Compute attendance stats
  const draftDays = attendanceRecords.filter((r) => r.status === "DRAFT").length;
  const noReportDays = childDailyStats.missingDailyReports;
  const attendanceDenominator =
    childDailyStats.totalAttendance +
    childDailyStats.totalAbsence +
    childDailyStats.missingDailyReports;

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
    milkScoop: child.milkScoop ?? null,
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
    breakfast: r.breakfastFood?.name ?? r.breakfastPortion ?? null,
    lunch: r.lunchFood?.name ?? r.lunchPortion ?? null,
    dessert: r.dessert ?? r.dessertPortion ?? null,
    status: r.status,
    mood: r.mood ?? null,
  }));

  // Map absence reports for table
  const absenceList = absences.slice(0, 10).map((a) => ({
    id: a.id,
    date: a.date.toISOString().slice(0, 10),
    reason: a.reason ?? null,
    absentFrom: a.absentFrom?.toISOString().slice(0, 10) ?? null,
    absentTo: a.absentTo?.toISOString().slice(0, 10) ?? null,
    status: a.status,
  }));

  const medicalFormsForDashboard = medicalForms
    .filter((form) => form.formType !== "ACCIDENTS")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const latestMedicalByType = new Map<string, (typeof medicalFormsForDashboard)[number]>();
  for (const form of medicalFormsForDashboard) {
    if (!latestMedicalByType.has(form.formType)) {
      latestMedicalByType.set(form.formType, form);
    }
  }

  const medicalTypeConfig = [
    { type: "GENERAL", label: "General Form", baseHref: "/medical/general" },
    { type: "CONDITIONS", label: "Suffering Form", baseHref: "/medical/conditions" },
    { type: "VISITS", label: "Medical Visit", baseHref: "/medical/visits" },
  ];

  const medicalList = medicalTypeConfig.map((item) => {
    const form = latestMedicalByType.get(item.type);
    if (!form) {
      return {
        id: item.type,
        formType: item.label,
        status: "PENDING",
        date: null,
        href: `${item.baseHref}/new?childId=${id}`,
      };
    }

    return {
      id: form.id,
      formType: item.label,
      status: form.status,
      date: form.createdAt.toISOString().slice(0, 10),
      href: `${item.baseHref}/${form.id}`,
    };
  });

  const latestVaccination = vaccinations
    .slice()
    .sort((a, b) => {
      const aDate = a.dateGiven ?? a.createdAt;
      const bDate = b.dateGiven ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    })[0];

  medicalList.push(
    latestVaccination
      ? {
          id: latestVaccination.id,
          formType: "Vaccination Report",
          status: "SUBMITTED",
          date: (latestVaccination.dateGiven ?? latestVaccination.createdAt)
            .toISOString()
            .slice(0, 10),
          href: `/medical/vaccinations/${latestVaccination.id}`,
        }
      : {
          id: "VACCINATION",
          formType: "Vaccination Report",
          status: "PENDING",
          date: null,
          href: `/medical/vaccinations/new?childId=${id}`,
        }
  );

  // Map assessments for table
  const assessmentList = dashboardStats.assessments.map((a) => ({
    id: a.id,
    assessmentType: a.assessmentType,
    status: a.status,
    date: a.createdAt.toISOString().slice(0, 10),
  }));

  // Compute medical stat breakdowns (MedicalFormStatus: DRAFT | SUBMITTED | REVIEWED)
  const medicalPublished = medicalList.filter((m) => m.status === "SUBMITTED" || m.status === "REVIEWED").length;
  const medicalDrafts = medicalList.filter((m) => m.status === "DRAFT").length;
  const medicalMissing = medicalList.filter((m) => m.status === "PENDING").length;

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
    totalAttendance: childDailyStats.totalAttendance,
    totalAbsence: childDailyStats.totalAbsence,
    missingDailyReports: childDailyStats.missingDailyReports,
    missingAbsentReports: childDailyStats.missingAbsentReports,
    attendanceRate: attendanceDenominator > 0
      ? `${Math.round((childDailyStats.totalAttendance / attendanceDenominator) * 100)}%`
      : "N/A",
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
    present: childDailyStats.totalAttendance,
    absent: childDailyStats.totalAbsence,
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
      selectedYearId={selectedYearId}
    />
  );
}
