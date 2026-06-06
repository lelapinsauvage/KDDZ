import type { MedicalFormType, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export async function resolveLegacyMedicalFormId(
  formType: MedicalFormType,
  identifier?: string | null
) {
  if (!identifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyIds = legacyNumericCandidates(identifier);

  const matches: Prisma.MedicalFormWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
  }
  for (const legacyId of legacyIds) {
    matches.push({ data: { path: ["_oldId"], equals: legacyId } });
    matches.push({ data: { path: ["_oldId"], equals: legacyId.toString() } });
    matches.push({ data: { path: ["form_id"], equals: legacyId } });
    matches.push({ data: { path: ["form_id"], equals: legacyId.toString() } });
  }

  if (!matches.length) return null;

  const form = await db.medicalForm.findFirst({
    where: {
      formType,
      OR: matches,
      child: { branch: { organizationId } },
    },
    select: { id: true },
  });

  return form?.id ?? null;
}
