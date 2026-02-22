import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { getChildren } from "@/lib/actions/children";
import {
  ASSESSMENT_TYPE_NAMES,
  VALID_ASSESSMENT_TYPES,
  getAssessmentConfig,
} from "@/lib/assessment-types";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function NewAssessmentPage({ params }: PageProps) {
  const { type: typeParam } = await params;
  const typeNum = parseInt(typeParam, 10);

  if (!VALID_ASSESSMENT_TYPES.includes(typeNum as (typeof VALID_ASSESSMENT_TYPES)[number])) {
    notFound();
  }

  const typeConfig = getAssessmentConfig(typeNum)!;
  const typeName = ASSESSMENT_TYPE_NAMES[typeNum];

  const childrenResult = await getChildren({ status: "ACTIVE", pageSize: 500 });
  const children = (childrenResult.children ?? []).map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    className: c.class?.name ?? "",
  }));

  return (
    <>
      <PageHeader
        title="New Assessment"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Assessments" },
          { label: typeName, href: `/assessments/${typeParam}` },
          { label: "New Assessment" },
        ]}
      />
      <AssessmentForm
        assessmentType={typeNum}
        typeConfig={typeConfig}
        childrenList={children}
      />
    </>
  );
}
