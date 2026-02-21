import { db } from "@/lib/db";
import { getClasses } from "@/lib/actions/classes";
import AssessmentsClient from "./assessments-client";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function AssessmentFormPage({ params }: PageProps) {
  const { type: typeParam } = await params;
  const typeNum = parseInt(typeParam, 10);

  // Fetch assessments from DB filtered by assessmentType
  const assessments = await db.assessment.findMany({
    where: { assessmentType: typeNum },
    include: {
      child: {
        include: {
          class: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all classes for the filter dropdown
  const classesResult = await getClasses();
  const classesData = Array.isArray(classesResult.data) ? classesResult.data : [];
  const classes = classesData.map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  // Serialize assessment data for client component
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

  return (
    <AssessmentsClient
      typeParam={typeParam}
      assessments={serializedAssessments}
      classes={classes}
    />
  );
}
