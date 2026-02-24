import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/actions/settings";
import { getBranches } from "@/lib/actions/branches";
import { NotificationSettingsClient } from "./notification-settings-client";

export default async function NotificationSettingsPage() {
  const [session, branchesResult] = await Promise.all([
    auth(),
    getBranches(),
  ]);

  const branches = (
    (branchesResult.data ?? []) as Array<{ id: string; name: string }>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userBranchId = (session?.user as any)?.branchId as string | null;
  let branchId = userBranchId;
  if (!branchId && branches.length > 0) {
    branchId = branches[0].id;
  }

  let settings: Record<string, string> = {};
  if (branchId) {
    const result = await getSettings(branchId);
    if (result.success && result.data) {
      settings = result.data;
    }
  }

  return (
    <NotificationSettingsClient
      branchId={branchId ?? ""}
      branches={branches}
      initialSettings={settings}
    />
  );
}
