import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyVaccinationMedicalFormRedirect({
  searchParams,
}: PageProps) {
  const { fid, id } = await searchParams;

  if (fid?.trim()) {
    const formId = await resolveLegacyMedicalFormId("VACCINATIONS", fid);
    if (!formId) notFound();

    redirect(`/medical/vaccinations/${encodeURIComponent(formId)}`);
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) notFound();

    redirect(`/medical/vaccinations/new?childId=${encodeURIComponent(childId)}`);
  }

  redirect("/medical/vaccinations");
}
