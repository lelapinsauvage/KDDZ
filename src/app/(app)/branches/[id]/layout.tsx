import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import { BranchSubNav } from "@/components/branches/branch-sub-nav";
import { PageHeader } from "@/components/layout/page-header";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export default async function BranchLayout({ params, children }: Props) {
  const { id } = await params;

  const result = await getBranch(id);
  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = result.data as any;

  return (
    <div>
      <PageHeader
        title={branch.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Branches", href: "/branches" },
          { label: branch.name },
        ]}
      />
      <BranchSubNav
        branchId={id}
        branchName={branch.name}
        themeColor={branch.themeColor}
      />
      {children}
    </div>
  );
}
