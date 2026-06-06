import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  decodeMaybeURIComponent,
  legacyNumericCandidates,
  UUID_PATTERN,
} from "@/lib/legacy-id";
import { requireOrg } from "@/lib/require-org";

function legacyJsonReportMatches<T>(legacyIds: number[]) {
  const matches: T[] = [];

  for (const legacyId of legacyIds) {
    matches.push({ legacyData: { path: ["report_id"], equals: legacyId } } as T);
    matches.push({ legacyData: { path: ["report_id"], equals: legacyId.toString() } } as T);
    matches.push({ legacyData: { path: ["form_id"], equals: legacyId } } as T);
    matches.push({ legacyData: { path: ["form_id"], equals: legacyId.toString() } } as T);
    matches.push({ legacyData: { path: ["_oldId"], equals: legacyId } } as T);
    matches.push({ legacyData: { path: ["_oldId"], equals: legacyId.toString() } } as T);
  }

  return matches;
}

export async function resolveLegacyDailyReportId(identifier?: string | null) {
  if (!identifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyIds = legacyNumericCandidates(identifier);

  const matches: Prisma.DailyReportWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
  }
  matches.push(...legacyJsonReportMatches<Prisma.DailyReportWhereInput>(legacyIds));

  if (!matches.length) return null;

  const report = await db.dailyReport.findFirst({
    where: {
      OR: matches,
      child: { branch: { organizationId } },
    },
    select: { id: true },
  });

  return report?.id ?? null;
}

export async function resolveLegacyAbsenceReportId(identifier?: string | null) {
  if (!identifier?.trim()) return null;

  const { organizationId } = await requireOrg();
  const normalizedIdentifier = decodeMaybeURIComponent(identifier.trim());
  const legacyIds = legacyNumericCandidates(identifier);

  const matches: Prisma.AbsenceReportWhereInput[] = [];
  if (UUID_PATTERN.test(normalizedIdentifier)) {
    matches.push({ id: normalizedIdentifier });
  }
  if (legacyIds.length) {
    matches.push({ legacyId: { in: legacyIds } });
  }
  if (normalizedIdentifier) {
    matches.push({ legacyKey: normalizedIdentifier });
  }
  matches.push(...legacyJsonReportMatches<Prisma.AbsenceReportWhereInput>(legacyIds));

  if (!matches.length) return null;

  const report = await db.absenceReport.findFirst({
    where: {
      OR: matches,
      child: { branch: { organizationId } },
    },
    select: { id: true },
  });

  return report?.id ?? null;
}

export async function findAbsenceReportForChildDate(childId: string, date: Date) {
  const { organizationId } = await requireOrg();

  const report = await db.absenceReport.findFirst({
    where: {
      childId,
      date,
      child: { branch: { organizationId } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return report?.id ?? null;
}
