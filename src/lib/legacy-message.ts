import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export async function resolveLegacyMessageThreadMessageId(
  identifier?: string | null
) {
  if (!identifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyThreadIds = legacyNumericCandidates(identifier);

  const matches: Prisma.MessageWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
    matches.push({ threadId: normalizedIdentifier });
  }
  if (legacyThreadIds.length) {
    matches.push({ legacyThreadId: { in: legacyThreadIds } });
  }

  if (!matches.length) return null;

  const message = await db.message.findFirst({
    where: {
      organizationId,
      OR: matches,
    },
    orderBy: [{ createdAt: "asc" }, { legacyId: "asc" }],
    select: { id: true },
  });

  return message?.id ?? null;
}
