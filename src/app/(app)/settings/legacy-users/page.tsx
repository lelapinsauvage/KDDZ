import { redirect } from "next/navigation";
import { getLegacyAdminUsers } from "@/lib/actions/legacy-users";
import { requireRole } from "@/lib/require-role";
import { LegacyUsersClient } from "./legacy-users-client";

interface PageProps {
  searchParams: Promise<{
    q?: string | string[];
    uid?: string | string[];
    user?: string | string[];
    new?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyUsersPage({ searchParams }: PageProps) {
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
  }

  const [usersResult, params] = await Promise.all([
    getLegacyAdminUsers(),
    searchParams,
  ]);
  const legacyUserParam = firstParam(params.uid) ?? firstParam(params.user);
  const initialQuery =
    firstParam(params.q) ?? legacyUserParam ?? "";
  const initialEditLegacyId = legacyUserParam
    ? Number.parseInt(legacyUserParam, 10)
    : null;

  return (
    <LegacyUsersClient
      initialData={
        usersResult.data ?? {
          users: [],
          levels: [],
          groups: [],
          branches: [],
          classes: [],
        }
      }
      initialError={usersResult.success ? null : (usersResult.error ?? null)}
      initialQuery={initialQuery}
      initialCreateOpen={firstParam(params.new) === "1"}
      initialEditLegacyId={
        Number.isInteger(initialEditLegacyId) ? initialEditLegacyId : null
      }
    />
  );
}
