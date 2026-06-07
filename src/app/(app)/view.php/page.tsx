import { notFound, redirect } from "next/navigation";

import type { MedicalFormType } from "@/generated/prisma/client";
import { resolveLegacyChildId } from "@/lib/legacy-child";
import { resolveLegacyMedicalFormId } from "@/lib/legacy-medical-form";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

const MEDICAL_PDF_TYPES: Record<
  string,
  { formType: MedicalFormType; pdfSlug: string }
> = {
  formone: { formType: "GENERAL", pdfSlug: "general" },
  formtwo: { formType: "CONDITIONS", pdfSlug: "conditions" },
  formthree: { formType: "VISITS", pdfSlug: "visits" },
  formfour: { formType: "VACCINATIONS", pdfSlug: "vaccinations" },
};

interface PageProps {
  searchParams: Promise<{ fid?: string; id?: string; p?: string }>;
}

export default async function LegacyPdfViewRedirect({ searchParams }: PageProps) {
  const { fid, id, p } = await searchParams;
  const target = p?.trim().toLowerCase();

  if (!target) {
    notFound();
  }

  if (target === "child") {
    const childId = await resolveLegacyChildId(id);
    if (!childId) {
      notFound();
    }

    redirect(`/api/pdf/child/${encodeURIComponent(childId)}`);
  }

  if (target === "teacher") {
    const teacherId = await resolveLegacyStaffId("teacher", id);
    if (!teacherId) {
      notFound();
    }

    redirect(`/api/pdf/employee/${encodeURIComponent(teacherId)}?type=teacher`);
  }

  const medicalType = MEDICAL_PDF_TYPES[target];
  if (medicalType) {
    const formId = await resolveLegacyMedicalFormId(medicalType.formType, fid);
    if (!formId) {
      notFound();
    }

    redirect(`/api/pdf/medical/${medicalType.pdfSlug}/${encodeURIComponent(formId)}`);
  }

  notFound();
}
