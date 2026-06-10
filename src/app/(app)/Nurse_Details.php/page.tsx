import { notFound } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";
import NurseDetailsPage from "../employees/nurses/[id]/page";
import NewNursePage from "../employees/nurses/new/page";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyNurseDetailsPage({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    return <NewNursePage />;
  }

  const nurseId = await resolveLegacyStaffId("nurse", id);
  if (!nurseId) {
    notFound();
  }

  return <NurseDetailsPage params={Promise.resolve({ id: nurseId })} />;
}
