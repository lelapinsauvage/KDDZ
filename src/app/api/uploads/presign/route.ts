import path from "path";
import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import {
  contentTypeForFilename,
  createPresignedUploadUrl,
  getObjectStorageConfig,
  objectKeyForStorageKey,
  publicUrlForObjectKey,
} from "@/lib/storage/object-storage";
import { requireLegacyActionAllowed } from "@/lib/legacy-action-permissions";
import { requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const uploadScopeSchema = z.enum([
  "branch",
  "class",
  "child",
  "child-document",
  "compliance-document",
  "teacher",
  "teacher-document",
  "nurse",
  "nurse-document",
  "doctor",
  "doctor-document",
  "manager",
  "manager-document",
  "profile-avatar",
  "payment-receipt",
  "daily-report",
  "absence-report",
  "form-attachment",
  "medical-form",
]);

const presignSchema = z.object({
  branchId: z.string().uuid(),
  scope: uploadScopeSchema,
  filename: z.string().min(1).max(240),
  contentType: z.string().min(1).max(120).optional(),
  byteSize: z.number().int().positive().max(MAX_UPLOAD_BYTES).optional(),
  ownerId: z.string().uuid().optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function safeFilename(filename: string): string {
  const parsed = path.parse(filename.trim());
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  const base = parsed.name
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "upload"}${ext || ""}`;
}

function isAllowedContentType(contentType: string): boolean {
  return (
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType === "application/octet-stream"
  );
}

function uploadObjectKey(params: {
  organizationId: string;
  branchId: string;
  scope: z.infer<typeof uploadScopeSchema>;
  ownerId?: string;
  filename: string;
}): string {
  const owner = params.ownerId ? `/${params.ownerId}` : "";
  return [
    "uploads",
    params.organizationId,
    params.branchId,
    params.scope,
    `${new Date().toISOString().slice(0, 10)}${owner}`,
    `${randomUUID()}-${safeFilename(params.filename)}`,
  ].join("/");
}

export async function POST(request: NextRequest) {
  const auth = await requireOrgSafe();
  if (!auth.ok) return jsonError(auth.error, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid upload request", 400);
  }

  const { branchId, scope, filename, ownerId, byteSize } = parsed.data;
  const contentType =
    parsed.data.contentType || contentTypeForFilename(filename);

  if (!isAllowedContentType(contentType)) {
    return jsonError("Unsupported upload content type", 400);
  }

  if (!(await verifyBranchAccess(branchId, auth.ctx.organizationId))) {
    return jsonError("Branch not found in organization", 403);
  }

  if (scope === "compliance-document") {
    const permission = await requireLegacyActionAllowed(auth.ctx, "Upnurseryinfo");
    if (!permission.ok) return jsonError(permission.error, 403);
  }

  let storage;
  try {
    storage = getObjectStorageConfig();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Storage is not configured";
    return jsonError(message, 500);
  }

  try {
    const storageKey = uploadObjectKey({
      organizationId: auth.ctx.organizationId,
      branchId,
      scope,
      ownerId,
      filename,
    });

    if (storage.provider === "local") {
      const key = objectKeyForStorageKey(storageKey, storage);
      const params = new URLSearchParams({ key, branchId });
      return NextResponse.json({
        success: true,
        provider: storage.provider,
        method: "PUT",
        uploadUrl: `/api/uploads/local?${params.toString()}`,
        key,
        publicUrl: publicUrlForObjectKey(key, storage),
        expiresAt: new Date(Date.now() + 900_000).toISOString(),
        headers: {
          "Content-Type": contentType,
        },
      });
    }

    const presigned = await createPresignedUploadUrl({
      key: storageKey,
      contentType,
      expiresInSeconds: 900,
      metadata: {
        "organization-id": auth.ctx.organizationId,
        "branch-id": branchId,
        "uploaded-by": auth.ctx.userId,
        scope,
        "owner-id": ownerId,
        "original-filename": filename,
        "byte-size": byteSize,
      },
    });

    return NextResponse.json({
      success: true,
      provider: storage.provider,
      method: "PUT",
      uploadUrl: presigned.url,
      key: presigned.key,
      publicUrl: presigned.publicUrl,
      expiresAt: presigned.expiresAt.toISOString(),
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create upload URL";
    return jsonError(message, 500);
  }
}
