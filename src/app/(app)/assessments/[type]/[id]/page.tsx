import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { getAssessment } from "@/lib/actions/assessments";
import { getChildren } from "@/lib/actions/children";
import {
  ASSESSMENT_TYPE_NAMES,
  VALID_ASSESSMENT_TYPES,
  getAssessmentConfig,
} from "@/lib/assessment-types";

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function EditAssessmentPage({ params }: PageProps) {
  const { type: typeParam, id } = await params;
  const typeNum = parseInt(typeParam, 10);

  if (!VALID_ASSESSMENT_TYPES.includes(typeNum as (typeof VALID_ASSESSMENT_TYPES)[number])) {
    notFound();
  }

  const typeConfig = getAssessmentConfig(typeNum)!;
  const typeName = ASSESSMENT_TYPE_NAMES[typeNum];

  const [result, childrenResult] = await Promise.all([
    getAssessment(id),
    getChildren({ status: "ACTIVE", pageSize: 500 }),
  ]);

  if (result.error || !result.assessment) {
    notFound();
  }

  const assessment = result.assessment;
  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    className: c.class?.name ?? "",
  }));

  const childName = `${assessment.child.firstName} ${assessment.child.lastName}`;

  return (
    <>
      <PageHeader
        title={`Assessment — ${childName}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Assessments" },
          { label: typeName, href: `/assessments/${typeParam}` },
          { label: childName },
        ]}
      />
      <AssessmentForm
        assessmentType={typeNum}
        typeConfig={typeConfig}
        childrenList={children}
        defaultValues={{
          id: assessment.id,
          childId: assessment.childId,
          status: assessment.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
          data: (assessment.data as Record<string, unknown>) ?? {},
        }}
      />
    </>
  );
}
