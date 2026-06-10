import { notFound } from "next/navigation";
import { getBranch, getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { getChildren } from "@/lib/actions/children";
import { ChildrenPageClient } from "@/components/children/children-page-client";
import { FadeIn } from "@/components/ui/skeleton";
import { getLegacyChildActionPermissions } from "@/lib/legacy-child-action-permissions";
import { requireOrg } from "@/lib/require-org";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    class?: string;
    gender?: string;
    status?: string;
    childNumber?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function BranchChildrenPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = query.pageSize === "all" ? "all" : Number(query.pageSize) || 10;
  const ctx = await requireOrg();

  const [
    branchResult,
    childrenResult,
    branchesResult,
    classesResult,
    actionPermissions,
  ] =
    await Promise.all([
      getBranch(id),
      getChildren({
        search: query.search || undefined,
        branchId: id,
        classId: query.class && query.class !== "ALL" ? query.class : undefined,
        gender: query.gender && query.gender !== "ALL" ? (query.gender as "MALE" | "FEMALE") : undefined,
        status: query.status && query.status !== "ALL" ? (query.status as "ACTIVE" | "DRAFT" | "INACTIVE") : undefined,
        childNumber: query.childNumber || undefined,
        firstName: query.firstName || undefined,
        lastName: query.lastName || undefined,
        dateOfBirth: query.dateOfBirth || undefined,
        nationality: query.nationality || undefined,
        createdFrom: query.createdFrom || undefined,
        createdTo: query.createdTo || undefined,
        page,
        pageSize,
        sortBy: query.sort || undefined,
        sortOrder: query.order as "asc" | "desc" | undefined,
      }),
      getBranches(),
      getClasses(),
      getLegacyChildActionPermissions(ctx),
    ]);

  if (!branchResult.success || !branchResult.data) {
    notFound();
  }

  const branch = branchResult.data as { id: string; name: string };
  const title = `Active Children For ${branch.name} Branch`;
  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []) as Array<{ id: string; name: string; branchId: string }>;

  return (
    <FadeIn>
      <div className="px-4 pt-4 md:px-6 md:pt-6 print:hidden">
        <h2 className="text-lg font-semibold">Active Children Listing</h2>
      </div>
      <ChildrenPageClient
          childrenList={childrenResult.children ?? []}
          total={childrenResult.total ?? 0}
          branches={branches}
          classes={classes}
          actionPermissions={actionPermissions}
          contextTitle={title}
          title="Active Children Listing"
          printTitle={title}
          lockedBranchId={id}
          lockedBranchName={branch.name}
          addChildHref={`/children/new?branch=${id}`}
          filters={{
            search: query.search ?? "",
            branch: id,
            class: query.class ?? "ALL",
            gender: query.gender ?? "ALL",
            status: query.status ?? "ALL",
            childNumber: query.childNumber ?? "",
            firstName: query.firstName ?? "",
            lastName: query.lastName ?? "",
            dateOfBirth: query.dateOfBirth ?? "",
            nationality: query.nationality ?? "",
            createdFrom: query.createdFrom ?? "",
            createdTo: query.createdTo ?? "",
            page,
            pageSize,
            sort: query.sort ?? "",
            order: (query.order as "asc" | "desc") ?? "asc",
          }}
        />
    </FadeIn>
  );
}
