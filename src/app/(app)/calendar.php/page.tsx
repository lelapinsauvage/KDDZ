import { notFound, redirect } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyEmployeeCalendarRedirect({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (id?.trim()) {
    const teacherId = await resolveLegacyStaffId("teacher", id);
    if (!teacherId) notFound();

    redirect(`/employees/calendar?employeeId=${encodeURIComponent(teacherId)}`);
  }

  redirect("/employees/calendar");
}
