import fs from "fs";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import {
  getObjectStorageConfig,
  normalizeStorageKey,
  resolveLocalObjectPath,
} from "@/lib/storage/object-storage";
import { requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const localUploadQuerySchema = z.object({
  key: z.string().min(1).max(2048),
  branchId: z.string().uuid(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isAllowedContentType(contentType: string): boolean {
  return (
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType === "application/octet-stream"
  );
}

function keyBelongsToBranch(params: {
  key: string;
  organizationId: string;
  branchId: string;
}): boolean {
  const parts = normalizeStorageKey(params.key).split("/");
  const uploadsIndex = parts.lastIndexOf("uploads");
  return (
    uploadsIndex >= 0 &&
    parts[uploadsIndex + 1] === params.organizationId &&
    parts[uploadsIndex + 2] === params.branchId
  );
}

export async function PUT(request: NextRequest) {
  const auth = await requireOrgSafe();
  if (!auth.ok) return jsonError(auth.error, 401);

  const parsed = localUploadQuerySchema.safeParse({
    key: request.nextUrl.searchParams.get("key"),
    branchId: request.nextUrl.searchParams.get("branchId"),
  });
  if (!parsed.success) return jsonError("Invalid local upload request", 400);

  const { key, branchId } = parsed.data;
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";
  if (!isAllowedContentType(contentType)) {
    return jsonError("Unsupported upload content type", 400);
  }

  const contentLength = Number.parseInt(
    request.headers.get("content-length") || "0",
    10
  );
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return jsonError("File is too large", 413);
  }

  if (!(await verifyBranchAccess(branchId, auth.ctx.organizationId))) {
    return jsonError("Branch not found in organization", 403);
  }

  if (
    !keyBelongsToBranch({
      key,
      organizationId: auth.ctx.organizationId,
      branchId,
    })
  ) {
    return jsonError("Upload key is outside the authorized branch", 403);
  }

  let storage;
  try {
    storage = getObjectStorageConfig();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Storage is not configured";
    return jsonError(message, 500);
  }
  if (storage.provider !== "local") {
    return jsonError("Local upload endpoint requires STORAGE_PROVIDER=local", 404);
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (body.byteLength === 0) return jsonError("Upload body is empty", 400);
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    return jsonError("File is too large", 413);
  }

  try {
    const targetPath = resolveLocalObjectPath(key, storage);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, body);
    return NextResponse.json({
      success: true,
      key,
      bytes: body.byteLength,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, 500);
  }
}
