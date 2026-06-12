import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export async function resolveLegacyPaymentId(identifier?: string | null) {
  if (!identifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyIds = legacyNumericCandidates(identifier);

  const matches: Prisma.PaymentWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
  }
  if (legacyIds.length) {
    matches.push({ legacyId: { in: legacyIds } });
  }
  if (normalizedIdentifier) {
    matches.push({ legacyKey: normalizedIdentifier });
  }

  if (!matches.length) return null;

  const payment = await db.payment.findFirst({
    where: {
      deletedAt: null,
      OR: matches,
      child: { branch: { organizationId } },
    },
    select: { id: true },
  });

  return payment?.id ?? null;
}
