import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";
import type { Prisma } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{ brid?: string }>;
}

async function resolveBranchId(identifier: string) {
  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyIds = legacyNumericCandidates(identifier);

  const matches: Prisma.BranchWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
  }
  if (legacyIds.length) {
    matches.push({ legacyId: { in: legacyIds } });
  }

  if (!matches.length) return null;

  const branch = await db.branch.findFirst({
    where: {
      organizationId,
      OR: matches,
    },
    select: { id: true },
  });

  return branch?.id ?? null;
}

export default async function LegacyBranchCallsRedirect({
  searchParams,
}: PageProps) {
  const { brid } = await searchParams;

  if (!brid?.trim()) {
    redirect("/calls");
  }

  const branchId = await resolveBranchId(brid);
  if (!branchId) {
    notFound();
  }

  redirect(`/calls?branch=${encodeURIComponent(branchId)}`);
}
