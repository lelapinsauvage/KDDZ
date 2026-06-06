import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyAccidentReportFormRedirect({
  searchParams,
}: PageProps) {
  const { fid, id } = await searchParams;

  if (fid?.trim()) {
    const formId = await resolveLegacyMedicalFormId("ACCIDENTS", fid);
    if (!formId) {
      notFound();
    }
    redirect(`/medical/accidents/${encodeURIComponent(formId)}`);
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      notFound();
    }
    redirect(`/medical/accidents/new?childId=${encodeURIComponent(childId)}`);
  }

  redirect("/medical/accidents");
}
