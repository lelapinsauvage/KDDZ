import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { getMedicalForm } from "@/lib/actions/medical";
import { SufferingFormClient } from "./suffering-form-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EMPTY_ASSESSMENTS: Record<string, { status: string; remarks: string }> = {
  hearing: { status: "", remarks: "" },
  speaking: { status: "", remarks: "" },
  sight: { status: "", remarks: "" },
  respiration: { status: "", remarks: "" },
  worms: { status: "", remarks: "" },
  heart: { status: "", remarks: "" },
  arteries: { status: "", remarks: "" },
  urine: { status: "", remarks: "" },
  epilepsy: { status: "", remarks: "" },
  migraine: { status: "", remarks: "" },
  eatingDisorder: { status: "", remarks: "" },
  chronicBloodProblems: { status: "", remarks: "" },
  otherHealthProblems: { status: "", remarks: "" },
};

export default async function SufferingFormPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const children = await db.child.findMany({
    where: { isActive: true, branch: { organizationId: orgId } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  if (isNew) {
    return (
      <SufferingFormClient
        isNew
        formId={null}
        childId=""
        childName=""
        formStatus="DRAFT"
        initialData={{ assessments: EMPTY_ASSESSMENTS, conclusion: "" }}
        childrenList={childOptions}
      />
    );
  }

  const result = await getMedicalForm(id);
  if ("error" in result || !result.form) {
    notFound();
  }

  const { form } = result;
  const data = (form.data ?? {}) as Record<string, unknown>;
  const assessments = (data.assessments ?? EMPTY_ASSESSMENTS) as Record<
    string,
    { status: string; remarks: string }
  >;
  const conclusion = (data.conclusion as string) ?? "";

  return (
    <SufferingFormClient
      isNew={false}
      formId={form.id}
      childId={form.childId}
      childName={`${form.child.firstName} ${form.child.lastName}`}
      formStatus={form.status}
      initialData={{
        assessments: { ...EMPTY_ASSESSMENTS, ...assessments },
        conclusion,
      }}
      childrenList={childOptions}
    />
  );
}
