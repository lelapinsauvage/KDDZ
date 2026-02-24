import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import { getDocuments } from "@/lib/actions/branch-compliance";
import { ComplianceDocumentsClient } from "@/components/branches/compliance-documents-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchDocumentsPage({ params }: Props) {
  const { id } = await params;

  const [branchResult, docsResult] = await Promise.all([
    getBranch(id),
    getDocuments(id),
  ]);

  if (!branchResult.success || !branchResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = branchResult.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents = ((docsResult.data ?? []) as any[]).map((d) => ({
    id: d.id,
    documentType: d.documentType,
    label: d.label,
    filename: d.filename,
    fileUrl: d.fileUrl,
    issueDate: d.issueDate ? new Date(d.issueDate).toISOString() : null,
    expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString() : null,
    status: d.status,
    notes: d.notes,
  }));

  return (
    <ComplianceDocumentsClient
      branchId={id}
      documents={documents}
      themeColor={branch.themeColor}
    />
  );
}
