import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateBirthdayAlarmsForOrganization,
  type BirthdayGenerationSummary,
} from "@/lib/jobs/birthday-alarms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CronTarget {
  organizationId: string;
  branchId?: string;
}

function emptySummary(): BirthdayGenerationSummary {
  return {
    branchesScanned: 0,
    childrenMatched: 0,
    alarmsCreated: 0,
    receiptsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedLegacyNotificationGate: false,
  };
}

function addSummary(
  total: BirthdayGenerationSummary,
  next: BirthdayGenerationSummary,
) {
  total.branchesScanned += next.branchesScanned;
  total.childrenMatched += next.childrenMatched;
  total.alarmsCreated += next.alarmsCreated;
  total.receiptsCreated += next.receiptsCreated;
  total.notificationsCreated += next.notificationsCreated;
  total.skippedExisting += next.skippedExisting;
  total.skippedDisabledBranches += next.skippedDisabledBranches;
  total.skippedLegacyNotificationGate ||= next.skippedLegacyNotificationGate;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? process.env.VERCEL_CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  return authorization === `Bearer ${secret}` || cronSecret === secret;
}

async function resolveTargets(request: NextRequest): Promise<
  | { ok: true; targets: CronTarget[] }
  | { ok: false; status: number; error: string }
> {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const branchId = searchParams.get("branchId");

  if (branchId) {
    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: { id: true, organizationId: true },
    });
    if (!branch) {
      return { ok: false, status: 404, error: "Branch not found" };
    }
    if (organizationId && organizationId !== branch.organizationId) {
      return {
        ok: false,
        status: 400,
        error: "Branch does not belong to organization",
      };
    }
    return {
      ok: true,
      targets: [{ organizationId: branch.organizationId, branchId: branch.id }],
    };
  }

  if (organizationId) {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      return { ok: false, status: 404, error: "Organization not found" };
    }
    return { ok: true, targets: [{ organizationId: organization.id }] };
  }

  const organizations = await db.organization.findMany({
    select: { id: true },
    orderBy: { name: "asc" },
  });
  return {
    ok: true,
    targets: organizations.map((organization) => ({
      organizationId: organization.id,
    })),
  };
}

async function runBirthdayCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const resolved = await resolveTargets(request);
  if (!resolved.ok) {
    return NextResponse.json(
      { success: false, error: resolved.error },
      { status: resolved.status },
    );
  }

  const total = emptySummary();
  const runs = [];
  for (const target of resolved.targets) {
    const summary = await generateBirthdayAlarmsForOrganization(target);
    addSummary(total, summary);
    runs.push({ ...target, summary });
  }

  return NextResponse.json({
    success: true,
    job: "birthday-alarms",
    ranAt: new Date().toISOString(),
    total,
    runs,
  });
}

export async function GET(request: NextRequest) {
  return runBirthdayCron(request);
}

export async function POST(request: NextRequest) {
  return runBirthdayCron(request);
}
