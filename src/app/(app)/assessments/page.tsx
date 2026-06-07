import { getAssessmentReview, getAssessments } from "@/lib/actions/assessments";
import { getClasses } from "@/lib/actions/classes";
import { getBranches } from "@/lib/actions/branches";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import AssessmentsListingClient from "./assessments-listing-client";

export default async function AssessmentsPage() {
  const [{ assessments }, reviewResult, classesResult, branchesResult] = await Promise.all([
    getAssessments({ pageSize: "all" }),
    getAssessmentReview(),
    getClasses(),
    getBranches(),
  ]);

  const classesData = Array.isArray(classesResult.data) ? classesResult.data : [];
  const classes = classesData.map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  const branchesData = Array.isArray(branchesResult.data) ? branchesResult.data : [];
  const branches = branchesData.map((b: { id: string; name: string }) => ({
    id: b.id,
    name: b.name,
  }));

  const serializedAssessments = assessments.map((a) => ({
    id: a.id,
    childId: a.childId,
    firstName: a.child.firstName,
    lastName: a.child.lastName,
    photo: a.child.photo ?? null,
    assessmentType: a.assessmentType,
    assessmentTypeName: ASSESSMENT_TYPE_NAMES[a.assessmentType] ?? `Type ${a.assessmentType}`,
    branchId: a.child.branchId,
    branchName: a.child.branch.name,
    classId: a.child.classId ?? "",
    className: a.child.class?.name ?? "Unassigned",
    status: a.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
    date: a.createdAt.toISOString().split("T")[0],
  }));

  const serializedReviewRows = reviewResult.rows.map((row) => ({
    ...row,
    childName: `${row.firstName} ${row.lastName}`,
    classId: row.classId ?? "",
    className: row.className ?? "Unassigned",
    reportDate: row.reportDate?.toISOString().split("T")[0] ?? null,
  }));

  return (
    <AssessmentsListingClient
      assessments={serializedAssessments}
      reviewRows={serializedReviewRows}
      reviewSummary={reviewResult.summary}
      classes={classes}
      branches={branches}
    />
  );
}
