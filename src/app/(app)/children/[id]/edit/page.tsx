import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ChildForm } from "@/components/children/child-form";
import { getChild } from "@/lib/actions/children";
import type { ChildFormValues } from "@/lib/validations/child";
import { getLegacyChildActionPermissions } from "@/lib/legacy-child-action-permissions";
import { requireOrg } from "@/lib/require-org";

interface ChildDetailsPageProps {
  params: Promise<{ id: string }>;
}

/** Format a Date or null to an ISO date string (yyyy-MM-dd) or empty string */
function toDateString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Format a time-only Date to HH:mm string or empty string */
function toTimeString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Map a Parent record to the guardian form shape */
function mapParent(parent: {
  firstName?: string | null;
  lastName?: string | null;
  nationality?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  profession?: string | null;
  workplace?: string | null;
  workPhone?: string | null;
  maritalStatus?: string | null;
  divorceSituation?: string | null;
  medicalCase?: string | null;
  canPickUp?: boolean;
  idNumber?: string | null;
} | undefined) {
  return {
    firstName: parent?.firstName ?? "",
    lastName: parent?.lastName ?? "",
    nationality: parent?.nationality ?? "",
    phone: parent?.phone ?? "",
    mobile: parent?.mobile ?? "",
    email: parent?.email ?? "",
    profession: parent?.profession ?? "",
    workplace: parent?.workplace ?? "",
    workPhone: parent?.workPhone ?? "",
    maritalStatus: parent?.maritalStatus ?? "",
    divorceSituation: parent?.divorceSituation ?? "",
    medicalCase: parent?.medicalCase ?? "",
    canPickUp: parent?.canPickUp ?? true,
    idNumber: parent?.idNumber ?? "",
  };
}

export default async function ChildEditPage({ params }: ChildDetailsPageProps) {
  const { id } = await params;
  const ctx = await requireOrg();
  const permissions = await getLegacyChildActionPermissions(ctx);
  if (!permissions.canUpdateChild) {
    redirect("/forbidden.php");
  }

  const child = await getChild(id);

  if (!child) {
    notFound();
  }

  const mother = child.parents?.find((p) => p.type === "MOTHER");
  const father = child.parents?.find((p) => p.type === "FATHER");

  const defaultValues: Partial<ChildFormValues> = {
    firstName: child.firstName ?? "",
    firstNameAr: child.firstNameAr ?? "",
    middleName: child.middleName ?? "",
    lastName: child.lastName ?? "",
    lastNameAr: child.lastNameAr ?? "",
    dateOfBirth: toDateString(child.dateOfBirth),
    placeOfBirth: child.placeOfBirth ?? "",
    gender: child.gender ?? undefined,
    nationality: child.nationality ?? "",
    religion: child.religion ?? "",
    idNumber: child.idNumber ?? "",
    bloodType: child.bloodType ?? "",
    allergies: child.allergies ?? "",
    photo: child.photo ?? "",

    // Guardian info
    mother: mapParent(mother),
    father: mapParent(father),

    // Enrollment
    branchId: child.branchId ?? "",
    classId: child.classId ?? "",
    schoolYearId: child.schoolYearId ?? "",
    enrollmentDate: toDateString(child.enrollmentDate),
    isActive: child.isActive,
    isDraft: child.isDraft,

    // Care preferences
    busAttendance: child.busAttendance ?? "false",
    diaperType: child.diaperType ?? "",
    milkType: child.milkType ?? "",
    milkPortions: child.milkPortions ?? 0,
    milkScoop: child.milkScoop ?? 0,
    milkTime1: toTimeString(child.milkTime1),
    milkTime2: toTimeString(child.milkTime2),
    milkTime3: toTimeString(child.milkTime3),
    lunchIncluded: child.lunchIncluded,
    sleepFrom: toTimeString(child.sleepFrom),
    sleepTo: toTimeString(child.sleepTo),
    remarks: child.remarks ?? "",
    language: child.language ?? "",
    previousGarderie: child.previousGarderie,
    previousGarderieName: child.previousGarderieName ?? "",

    // Addresses
    addresses: (child.addresses ?? []).map((a) => ({
      recordId: a.id,
      addressType: a.addressType ?? "",
      country: a.country ?? "Lebanon",
      street: a.street ?? "",
      building: a.building ?? "",
      floor: a.floor ?? "",
      city: a.city ?? "",
      telephone: a.telephone ?? "",
    })),

    // Siblings
    siblings: (child.siblings ?? []).map((s) => ({
      recordId: s.id,
      relation: s.relation ?? "",
      firstName: s.firstName ?? "",
      dateOfBirth: toDateString(s.dateOfBirth),
      medicalCase: s.medicalCase ?? "",
      canPickUp: s.canPickUp,
    })),

    // Relatives
    relatives: (child.relatives ?? []).map((r) => ({
      recordId: r.id,
      name: r.name,
      lastName: r.lastName ?? "",
      relation: r.relation ?? "",
      phone: r.phone ?? "",
      mobile: r.mobile ?? "",
      isAuthorized: r.isAuthorized,
      isEmergencyContact: r.isEmergencyContact,
    })),

    // Financial
    childNumber: child.childNumber ?? "",
    garderieFees: child.garderieFees ? Number(child.garderieFees) : 0,
    extraFees: child.extraFees ? Number(child.extraFees) : 0,
    busFees: child.busFees ? Number(child.busFees) : 0,
    apronFees: child.apronFees ? Number(child.apronFees) : 0,
    registrationFees: child.registrationFees ? Number(child.registrationFees) : 0,
    activitiesFees: child.activitiesFees ? Number(child.activitiesFees) : 0,
    discount: child.discount ? Number(child.discount) : 0,
    tva: child.tva ? Number(child.tva) : 0,
    financialRemarks: child.financialRemarks ?? "",

    // Accounting entries
    accountingEntries: (child.accountingEntries ?? []).map((entry) => ({
      recordId: entry.id,
      description: entry.description ?? "",
      amount: Number(entry.amount),
      type: entry.type as "FEE" | "DISCOUNT" | "PAYMENT" | "ADJUSTMENT",
    })),

    // Attachments
    attachments: (child.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      title: attachment.title ?? "",
      filename: attachment.filename,
      fileUrl: attachment.fileUrl,
      type: attachment.type ?? "",
    })),
  };

  return (
    <>
      <PageHeader
        title="Edit Profile"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: "Edit Profile" },
        ]}
      />
      <div className="p-4 md:p-6">
        <ChildForm childId={id} defaultValues={defaultValues} />
      </div>
    </>
  );
}
