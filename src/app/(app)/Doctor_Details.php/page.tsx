import { notFound, redirect } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyDoctorDetailsRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/employees/doctors");
  }

  const doctorId = await resolveLegacyStaffId("doctor", id);
  if (!doctorId) {
    notFound();
  }

  redirect(`/employees/doctors/${encodeURIComponent(doctorId)}`);
}
