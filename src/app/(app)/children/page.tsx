import { getChildren } from "@/lib/actions/children";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { ChildrenPageClient } from "@/components/children/children-page-client";
import { FadeIn } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    branch?: string;
    class?: string;
    gender?: string;
    status?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function ChildrenListingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Number(params.pageSize) || 20;

  const [childrenResult, branchesResult, classesResult] = await Promise.all([
    getChildren({
      search: params.search || undefined,
      branchId: params.branch && params.branch !== "ALL" ? params.branch : undefined,
      classId: params.class && params.class !== "ALL" ? params.class : undefined,
      gender: params.gender && params.gender !== "ALL" ? (params.gender as "MALE" | "FEMALE") : undefined,
      status: params.status && params.status !== "ALL" ? (params.status as "ACTIVE" | "DRAFT" | "INACTIVE") : undefined,
      page,
      pageSize,
      sortBy: params.sort || undefined,
      sortOrder: params.order as "asc" | "desc" | undefined,
    }),
    getBranches(),
    getClasses(),
  ]);

  const children = childrenResult.children ?? [];
  const total = childrenResult.total ?? 0;
  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []
  ) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []
  ) as Array<{ id: string; name: string; branchId: string }>;

  return (
    <FadeIn>
      <ChildrenPageClient
        childrenList={children}
        total={total}
        branches={branches}
        classes={classes}
        filters={{
          search: params.search ?? "",
          branch: params.branch ?? "ALL",
          class: params.class ?? "ALL",
          gender: params.gender ?? "ALL",
          status: params.status ?? "ALL",
          page,
          pageSize,
          sort: params.sort ?? "",
          order: (params.order as "asc" | "desc") ?? "asc",
        }}
      />
    </FadeIn>
  );
}
