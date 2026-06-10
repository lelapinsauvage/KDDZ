import { notFound } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";
import CallsManagementPage from "../calls/page";

interface PageProps {
  searchParams: Promise<{
    brid?: string;
    search?: string;
    class?: string;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function LegacyBranchCallsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { brid, ...modernParams } = params;

  if (!brid?.trim()) {
    return <CallsManagementPage searchParams={Promise.resolve(modernParams)} />;
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    notFound();
  }

  return (
    <CallsManagementPage
      searchParams={Promise.resolve({ ...modernParams, branch: branchId })}
    />
  );
}
