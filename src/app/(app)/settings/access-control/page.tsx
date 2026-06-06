import { redirect } from "next/navigation";
import { requireRole } from "@/lib/require-role";
import { getLegacyAccessControlMatrix } from "@/lib/actions/legacy-access-control";
import { AccessControlClient } from "./access-control-client";

export default async function AccessControlPage() {
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
  }

  const matrixResult = await getLegacyAccessControlMatrix();

  return (
    <AccessControlClient
      initialGroups={matrixResult.data ?? []}
      initialError={matrixResult.success ? null : (matrixResult.error ?? null)}
    />
  );
}
