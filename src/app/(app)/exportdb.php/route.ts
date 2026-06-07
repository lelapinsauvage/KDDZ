import { NextResponse } from "next/server";

import { createDatabaseSqlDump } from "@/lib/database-sql-export";
import { requireRole } from "@/lib/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const dump = await createDatabaseSqlDump();

    return new Response(dump.content, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dump.filename}"`,
        "Cache-Control": "no-store",
        "X-Garderie-Export-Engine": dump.engine,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database export failed";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
