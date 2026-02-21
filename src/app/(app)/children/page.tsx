import { getChildren } from "@/lib/actions/children";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { ChildrenPageClient } from "@/components/children/children-page-client";

export default async function ChildrenListingPage() {
  // Fetch data in parallel on the server
  const [childrenResult, branchesResult, classesResult] = await Promise.all([
    getChildren({ pageSize: 500 }),
    getBranches(),
    getClasses(),
  ]);

  // Extract the data, providing safe defaults
  const children = childrenResult.children ?? [];
  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []
  ) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []
  ) as Array<{ id: string; name: string; branchId: string }>;

  return (
    <ChildrenPageClient
      children={children}
      branches={branches}
      classes={classes}
    />
  );
}
