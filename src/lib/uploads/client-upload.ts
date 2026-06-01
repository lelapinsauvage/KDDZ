export type UploadScope =
  | "branch"
  | "class"
  | "child"
  | "child-document"
  | "compliance-document"
  | "teacher"
  | "teacher-document"
  | "nurse"
  | "nurse-document"
  | "doctor"
  | "doctor-document"
  | "manager"
  | "manager-document"
  | "payment-receipt"
  | "daily-report"
  | "absence-report"
  | "medical-form";

interface PresignResponse {
  success: boolean;
  error?: string;
  method?: "PUT";
  uploadUrl?: string;
  key?: string;
  publicUrl?: string | null;
  headers?: Record<string, string>;
}

export interface UploadedFileResult {
  key: string;
  publicUrl: string;
}

export async function uploadFileWithPresign(params: {
  branchId: string;
  scope: UploadScope;
  file: File;
  ownerId?: string;
}): Promise<UploadedFileResult> {
  const presignResponse = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branchId: params.branchId,
      scope: params.scope,
      filename: params.file.name,
      contentType: params.file.type || "application/octet-stream",
      byteSize: params.file.size,
      ownerId: params.ownerId,
    }),
  });

  const presign = (await presignResponse.json()) as PresignResponse;
  if (!presignResponse.ok || !presign.success) {
    throw new Error(presign.error || "Failed to prepare upload");
  }
  if (!presign.uploadUrl || !presign.key) {
    throw new Error("Upload URL response is incomplete");
  }
  if (!presign.publicUrl) {
    throw new Error("Storage public URL is not configured");
  }

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: presign.method || "PUT",
    headers: presign.headers,
    body: params.file,
  });

  if (!uploadResponse.ok) {
    throw new Error("File upload failed");
  }

  return {
    key: presign.key,
    publicUrl: presign.publicUrl,
  };
}
