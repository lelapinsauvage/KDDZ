import { db } from "@/lib/db";
import { jsonSuccess } from "@/lib/parent-auth";
import { buildLegacyGarderieBootstrapPayload } from "@/lib/parent-mobile-bootstrap-contract";

export async function GET() {
  return handleRequest();
}

export async function POST() {
  return handleRequest();
}

async function handleRequest() {
  try {
    const rows = await db.legacyGarderieRegistry.findMany({
      where: { isActive: true },
      orderBy: { legacyId: "asc" },
      select: {
        legacyId: true,
        name: true,
        alias: true,
        userManageDatabase: true,
        currentDatabase: true,
        path: true,
      },
    });

    return jsonSuccess(buildLegacyGarderieBootstrapPayload(rows));
  } catch {
    return jsonSuccess(buildLegacyGarderieBootstrapPayload([]));
  }
}
