import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import NurseryClient from "./nursery-client";

export default async function NurseryInfoPage() {
  const session = await auth();
  const userBranchId = session?.user?.branchId ?? null;

  // If user has no branch, try to get first branch
  let branchId = userBranchId;
  if (!branchId) {
    const branchesResult = await getBranches();
    const branches = Array.isArray(branchesResult.data) ? branchesResult.data : [];
    if (branches.length > 0) {
      branchId = branches[0].id;
    }
  }

  // Fetch settings for the branch
  let settings: Record<string, string> = {};
  if (branchId) {
    const result = await getSettings(branchId);
    if (result.success && result.data) {
      settings = result.data;
    }
  }

  return (
    <NurseryClient
      branchId={branchId ?? ""}
      initialSettings={settings}
    />
  );
}
