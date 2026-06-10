import { notFound, redirect } from "next/navigation";
import { resolveLegacyAssessmentId } from "@/lib/legacy-assessment";
import { resolveLegacyChildId } from "@/lib/legacy-child";

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string }>;
}

export default async function LegacyAssessment7Page({ searchParams }: PageProps) {
  const { fid, id } = await searchParams;

  if (fid?.trim()) {
    const assessmentId = await resolveLegacyAssessmentId(7, fid);
    if (assessmentId) redirect(`/assessments/7/${encodeURIComponent(assessmentId)}`);
    notFound();
  }

  if (id?.trim()) {
    const childId = await resolveLegacyChildId(id);
    if (childId) redirect(`/assessments/7/new?childId=${encodeURIComponent(childId)}`);
    notFound();
  }

  redirect("/assessments/7");
}
