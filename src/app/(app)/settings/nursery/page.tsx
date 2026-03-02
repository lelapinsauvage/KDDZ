import { auth } from "@/lib/auth";
import { getSettings, getRegions } from "@/lib/actions/settings";
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

  // Fetch settings and geographic data in parallel
  const [settingsResult, regionsResult] = await Promise.all([
    branchId ? getSettings(branchId) : Promise.resolve({ success: false } as const),
    getRegions(),
  ]);

  const settings: Record<string, string> =
    settingsResult.success && settingsResult.data
      ? settingsResult.data as Record<string, string>
      : {};

  const provinces = Array.isArray(regionsResult.data) ? regionsResult.data : [];

  return (
    <NurseryClient
      branchId={branchId ?? ""}
      initialSettings={settings}
      provinces={provinces}
    />
  );
}
