import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export async function resolveLegacyParentUserId(
  identifier?: string | null,
  legacyChildIdentifier?: string | null
) {
  if (!identifier?.trim() && !legacyChildIdentifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const matches: Prisma.ParentUserWhereInput[] = [];

  if (identifier?.trim()) {
    const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
    const legacyIds = legacyNumericCandidates(identifier);
    if (UUID_PATTERN.test(normalizedIdentifier)) {
      matches.push({ id: normalizedIdentifier });
    }
    if (legacyIds.length) {
      matches.push({ legacyId: { in: legacyIds } });
    }
    if (normalizedIdentifier) {
      matches.push({ legacyKey: normalizedIdentifier });
    }
  }

  const legacyChildIds = legacyNumericCandidates(legacyChildIdentifier);
  if (legacyChildIds.length) {
    matches.push({ legacyChildId: { in: legacyChildIds } });
    matches.push({ child: { legacyId: { in: legacyChildIds } } });
  }

  if (!matches.length) return null;

  const parentUser = await db.parentUser.findFirst({
    where: {
      OR: matches,
      child: { branch: { organizationId } },
    },
    select: { id: true },
  });

  return parentUser?.id ?? null;
}
