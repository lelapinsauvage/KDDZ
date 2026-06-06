import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export async function resolveLegacyBranchId(identifier?: string | null) {
  if (!identifier?.trim()) return null;

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
