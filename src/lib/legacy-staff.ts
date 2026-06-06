import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

export type LegacyStaffRole = "teacher" | "nurse" | "doctor" | "manager";

function identifierParts(identifier?: string | null) {
  if (!identifier?.trim()) return null;
  return {
    normalizedIdentifier: decodeMaybeURIComponent(identifier.trim()),
    legacyIds: legacyNumericCandidates(identifier),
  };
}

export async function resolveLegacyStaffId(
  role: LegacyStaffRole,
  identifier?: string | null
) {
  const parts = identifierParts(identifier);
  if (!parts) return null;

  const { organizationId } = await requireOrg();
  const { normalizedIdentifier, legacyIds } = parts;

  switch (role) {
    case "teacher": {
      const matches: Prisma.TeacherWhereInput[] = [];
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
      const teacher = await db.teacher.findFirst({
        where: { OR: matches, branch: { organizationId } },
        select: { id: true },
      });
      return teacher?.id ?? null;
    }
    case "nurse": {
      const matches: Prisma.NurseWhereInput[] = [];
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
      const nurse = await db.nurse.findFirst({
        where: { OR: matches, branch: { organizationId } },
        select: { id: true },
      });
      return nurse?.id ?? null;
    }
    case "doctor": {
      const matches: Prisma.DoctorWhereInput[] = [];
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
      const doctor = await db.doctor.findFirst({
        where: { OR: matches, branch: { organizationId } },
        select: { id: true },
      });
      return doctor?.id ?? null;
    }
    case "manager": {
      const matches: Prisma.ManagerWhereInput[] = [];
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
      const manager = await db.manager.findFirst({
        where: { OR: matches, branch: { organizationId } },
        select: { id: true },
      });
      return manager?.id ?? null;
    }
  }
}
