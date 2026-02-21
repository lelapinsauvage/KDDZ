import { getDrafts } from "@/lib/actions/children";
import { getBranches } from "@/lib/actions/branches";
import { getClasses } from "@/lib/actions/classes";
import { DraftsPageClient } from "@/components/children/drafts-page-client";

export default async function ChildrenDraftsPage() {
  // Fetch data in parallel on the server
  const [draftsResult, branchesResult, classesResult] = await Promise.all([
    getDrafts({ pageSize: 500 }),
    getBranches(),
    getClasses(),
  ]);

  // Extract the data, providing safe defaults
  const children = draftsResult.children ?? [];
  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []
  ) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []
  ) as Array<{ id: string; name: string; branchId: string }>;

  return (
    <DraftsPageClient
      children={children}
      branches={branches}
      classes={classes}
    />
  );
}
