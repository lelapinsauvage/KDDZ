import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getLegacyAccessPermissionDecision,
} from "@/lib/legacy-access-permissions";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";
import { legacyPermissionAllows } from "@/lib/legacy-page-guards";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

export const runtime = "nodejs";

function normalizeMonth(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isExpiredIsoDate(value: string | null | undefined) {
  return Boolean(value) && Date.parse(value as string) <= Date.now();
}

async function organizationIdForSession(session: Session) {
  let organizationId = session.user.organizationId ?? null;

  if (!organizationId && session.user.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        branch: { select: { organizationId: true } },
      },
    });
    organizationId = user?.organizationId ?? user?.branch?.organizationId ?? null;
  }

  if (!organizationId) {
    const firstOrg = await db.organization.findFirst({ select: { id: true } });
    organizationId = firstOrg?.id ?? null;
  }

  return organizationId;
}

async function assertLegacyMonthlyAccess(request: NextRequest) {
  const session = await auth();
  const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (
    !session?.user?.id ||
    isExpiredIsoDate(session.user.legacySessionExpiresAt)
  ) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`, request.url),
    );
  }

  const organizationId = await organizationIdForSession(session);
  if (!organizationId) return null;

  const decision = await getLegacyAccessPermissionDecision(
    {
      userId: session.user.id,
      organizationId,
      branchId: session.user.branchId ?? null,
      role: session.user.role ?? "TEACHER",
    },
    "Monthly_report.php",
    "PAGE",
  );

  if (!legacyPermissionAllows(decision)) {
    return NextResponse.redirect(new URL("/forbidden.php", request.url));
  }

  return null;
}

function appendMonthlyParams(target: URL, request: NextRequest) {
  const source = request.nextUrl.searchParams;
  const month =
    normalizeMonth(source.get("month")) ??
    normalizeMonth(source.get("from")) ??
    normalizeMonth(source.get("p"));
  const classId = normalizeLegacySearchQuery(
    source.get("classId") ?? source.get("class") ?? undefined,
  );
  const query = normalizeLegacySearchQuery(source.get("q") ?? undefined);

  if (month) target.searchParams.set("month", month);
  if (classId) target.searchParams.set("classId", classId);
  if (query) target.searchParams.set("q", query);
}

async function monthlyBranchTarget(request: NextRequest) {
  const source = request.nextUrl.searchParams;
  const brid = normalizeLegacySearchQuery(
    source.get("brid") ?? source.get("branch") ?? undefined,
  );

  if (!brid) {
    const target = new URL("/reports/monthly", request.url);
    appendMonthlyParams(target, request);
    return target;
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) return null;

  const target = new URL("/reports/monthly-branch", request.url);
  target.searchParams.set("branch", branchId);
  appendMonthlyParams(target, request);
  return target;
}

export async function GET(request: NextRequest) {
  const accessRedirect = await assertLegacyMonthlyAccess(request);
  if (accessRedirect) return accessRedirect;

  const target = await monthlyBranchTarget(request);
  if (!target) {
    return new NextResponse("Branch not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.redirect(target);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
