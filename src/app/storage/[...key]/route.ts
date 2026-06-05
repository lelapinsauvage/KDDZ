import fs from "fs";

import { NextResponse } from "next/server";

import {
  contentTypeForFilename,
  getObjectStorageConfig,
  resolveLocalObjectPath,
} from "@/lib/storage/object-storage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ key: string[] }>;
}

async function readLocalObject(context: RouteContext) {
  const { key } = await context.params;
  const objectKey = key.join("/");
  const storage = getObjectStorageConfig();
  if (storage.provider !== "local") {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = resolveLocalObjectPath(objectKey, storage);
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) return new NextResponse("Not found", { status: 404 });
    const body = await fs.promises.readFile(filePath);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentTypeForFilename(objectKey),
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new NextResponse("Not found", { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Storage error";
    return new NextResponse(message, { status: 500 });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  return readLocalObject(context);
}

export async function HEAD(_request: Request, context: RouteContext) {
  const response = await readLocalObject(context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
