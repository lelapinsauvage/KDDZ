import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { db } from "@/lib/db";
import { DoctorDetailClient } from "./doctor-detail-client";

function serializeDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeDates(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? serializeDates(item as Record<string, unknown>)
          : item instanceof Date
            ? item.toISOString()
            : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default async function DoctorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getEmployee("doctor", id);

  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctor = serializeDates(result.data as Record<string, unknown>) as any;

  // Fetch recent medical forms (visits) for the doctor's branch
  const recentForms = await db.medicalForm.findMany({
    where: {
      child: {
        branchId: doctor.branch.id,
      },
      formType: "VISITS",
    },
    include: {
      child: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentVisits = recentForms.map((form) => ({
    id: form.id,
    date: form.createdAt.toISOString(),
    childName: `${form.child.firstName} ${form.child.lastName}`,
    formType: form.formType,
    status: form.status,
  }));

  return <DoctorDetailClient doctor={doctor} recentVisits={recentVisits} />;
}
