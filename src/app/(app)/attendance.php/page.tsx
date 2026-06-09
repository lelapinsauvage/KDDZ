import { notFound, redirect } from "next/navigation";
import { attendancePreselectTarget } from "@/lib/legacy-attendance-preselect-contract";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyAttendanceRedirect({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (id?.trim()) {
    const teacherId = await resolveLegacyStaffId("teacher", id);
    if (!teacherId) notFound();

    redirect(attendancePreselectTarget(teacherId));
  }

  redirect("/employees/attendance");
}
