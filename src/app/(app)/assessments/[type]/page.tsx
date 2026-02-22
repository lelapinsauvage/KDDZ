import { notFound } from "next/navigation";
import { getAssessments } from "@/lib/actions/assessments";
import { getClasses } from "@/lib/actions/classes";
import { ASSESSMENT_TYPE_NAMES, VALID_ASSESSMENT_TYPES } from "@/lib/assessment-types";
import AssessmentsClient from "./assessments-client";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function AssessmentListingPage({ params }: PageProps) {
  const { type: typeParam } = await params;
  const typeNum = parseInt(typeParam, 10);

  if (!VALID_ASSESSMENT_TYPES.includes(typeNum as (typeof VALID_ASSESSMENT_TYPES)[number])) {
    notFound();
  }

  const [{ assessments }, classesResult] = await Promise.all([
    getAssessments({ assessmentType: typeNum, pageSize: 500 }),
    getClasses(),
  ]);

  const classesData = Array.isArray(classesResult.data) ? classesResult.data : [];
  const classes = classesData.map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  const serializedAssessments = assessments.map((a) => ({
    id: a.id,
    childId: a.childId,
    childName: `${a.child.firstName} ${a.child.lastName}`,
    classId: a.child.classId ?? "",
    className: a.child.class?.name ?? "Unassigned",
    status: a.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
    date: a.createdAt.toISOString().split("T")[0],
    assessor: a.createdBy?.name ?? "Unknown",
  }));

  const typeName = ASSESSMENT_TYPE_NAMES[typeNum] ?? "Assessment";

  return (
    <AssessmentsClient
      typeParam={typeParam}
      typeName={typeName}
      assessments={serializedAssessments}
      classes={classes}
    />
  );
}
