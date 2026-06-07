import { NextRequest, NextResponse } from "next/server";

import { encryptLegacyId } from "@/lib/legacy-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readField(request: NextRequest, name: string) {
  const queryValue = request.nextUrl.searchParams.get(name);
  if (queryValue) return queryValue;
  if (request.method !== "POST") return null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const value = body?.[name];
    return typeof value === "string" || typeof value === "number" ? String(value) : null;
  }

  const formData = await request.formData().catch(() => null);
  const value = formData?.get(name);
  return typeof value === "string" ? value : null;
}

function textResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const id = await readField(request, "id");
  if (!id) {
    return textResponse("Missing id", 400);
  }

  return textResponse(encryptLegacyId(id));
}
