import { notFound } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";
import DoctorDetailsPage from "../employees/doctors/[id]/page";
import NewDoctorPage from "../employees/doctors/new/page";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyDoctorDetailsPage({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    return <NewDoctorPage />;
  }

  const doctorId = await resolveLegacyStaffId("doctor", id);
  if (!doctorId) {
    notFound();
  }

  return <DoctorDetailsPage params={Promise.resolve({ id: doctorId })} />;
}
