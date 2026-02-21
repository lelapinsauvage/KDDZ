import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ChildForm } from "@/components/children/child-form";
import { getChild } from "@/lib/actions/children";
import type { ChildFormValues } from "@/lib/validations/child";

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

export default async function ChildDetailsPage({ params }: ChildDetailsPageProps) {
  const { id } = await params;

  const child = await getChild(id);

  if (!child) {
    notFound();
  }

  // Find mother and father from the parents array
  const mother = child.parents?.find((p) => p.type === "MOTHER");
  const father = child.parents?.find((p) => p.type === "FATHER");

  // Map Prisma result to ChildFormValues shape
  const defaultValues: Partial<ChildFormValues> = {
    firstName: child.firstName ?? "",
    middleName: child.middleName ?? "",
    lastName: child.lastName ?? "",
    dateOfBirth: toDateString(child.dateOfBirth),
    placeOfBirth: child.placeOfBirth ?? "",
    gender: child.gender ?? undefined,
    nationality: child.nationality ?? "",
    bloodType: child.bloodType ?? "",
    allergies: child.allergies ?? "",
    photo: child.photo ?? "",

    // Guardian info
    mother: {
      firstName: mother?.firstName ?? "",
      lastName: mother?.lastName ?? "",
      nationality: mother?.nationality ?? "",
      phone: mother?.phone ?? "",
      mobile: mother?.mobile ?? "",
      email: mother?.email ?? "",
    },
    father: {
      firstName: father?.firstName ?? "",
      lastName: father?.lastName ?? "",
      nationality: father?.nationality ?? "",
      phone: father?.phone ?? "",
      mobile: father?.mobile ?? "",
      email: father?.email ?? "",
      workplace: father?.workplace ?? "",
      workPhone: father?.workPhone ?? "",
    },

    // Enrollment
    branchId: child.branchId ?? "",
    classId: child.classId ?? "",
    schoolYearId: child.schoolYearId ?? "",
    enrollmentDate: toDateString(child.enrollmentDate),
    isActive: child.isActive,
    isDraft: child.isDraft,

    // Care preferences
    busAttendance: child.busAttendance,
    diaperType: child.diaperType ?? "",
    milkType: child.milkType ?? "",
    milkPortions: child.milkPortions ?? 0,
    sleepFrom: toTimeString(child.sleepFrom),
    sleepTo: toTimeString(child.sleepTo),
    remarks: child.remarks ?? "",
    language: child.language ?? "",

    // Relatives
    relatives: (child.relatives ?? []).map((r) => ({
      name: r.name,
      relation: r.relation ?? "",
      phone: r.phone ?? "",
      isAuthorized: r.isAuthorized,
    })),

    // Accounting entries
    accountingEntries: (child.accountingEntries ?? []).map((entry) => ({
      description: entry.description ?? "",
      amount: Number(entry.amount),
      type: entry.type as "FEE" | "DISCOUNT" | "PAYMENT" | "ADJUSTMENT",
    })),
  };

  return (
    <>
      <PageHeader
        title="Child Details"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: "Child Details" },
        ]}
      />
      <div className="p-6">
        <ChildForm childId={id} defaultValues={defaultValues} />
      </div>
    </>
  );
}
