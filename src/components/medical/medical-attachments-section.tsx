"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";

export interface MedicalChildOption {
  id: string;
  name: string;
  branchId: string;
}

export interface MedicalAttachmentValue {
  id?: string;
  title?: string;
  filename: string;
  fileUrl: string;
}

export interface PendingMedicalAttachment {
  id: string;
  title: string;
  file: File;
  previewUrl: string | null;
}

interface MedicalAttachmentsSectionProps {
  existingAttachments: MedicalAttachmentValue[];
  pendingAttachments: PendingMedicalAttachment[];
  disabled?: boolean;
  onExistingTitleChange: (index: number, title: string) => void;
  onRemoveExisting: (index: number) => void;
  onAddPending: (files: File[]) => void;
  onPendingTitleChange: (index: number, title: string) => void;
  onRemovePending: (index: number) => void;
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

function isImageLike(value: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value);
}

function AttachmentPreview({
  href,
  filename,
  linked = false,
}: {
  href: string | null;
  filename: string;
  linked?: boolean;
}) {
  const content = href && isImageLike(href) ? (
    <div
      className="h-24 w-28 rounded border bg-muted bg-cover bg-center"
      style={{ backgroundImage: `url("${href}")` }}
      aria-label={filename}
    />
  ) : (
    <div className="flex h-24 w-28 items-center justify-center rounded border bg-muted">
      <FileText className="size-7 text-muted-foreground" />
    </div>
  );

  if (!linked || !href) return content;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}

export function MedicalAttachmentsSection({
  existingAttachments,
  pendingAttachments,
  disabled = false,
  onExistingTitleChange,
  onRemoveExisting,
  onAddPending,
  onPendingTitleChange,
  onRemovePending,
}: MedicalAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Attachments</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Add Files
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(event) => {
            onAddPending(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        {existingAttachments.length === 0 && pendingAttachments.length === 0 ? (
          <div className="flex items-center gap-2 rounded-sm border border-dashed p-4 text-sm text-muted-foreground">
            <Paperclip className="size-4" />
            No attachments
          </div>
        ) : (
          <div className="space-y-3">
            {existingAttachments.map((attachment, index) => (
              <div
                key={attachment.id ?? attachment.fileUrl}
                className="grid gap-3 rounded-sm border p-3 md:grid-cols-[112px_1fr_auto]"
              >
                <AttachmentPreview
                  href={attachmentHref(attachment.fileUrl)}
                  filename={attachment.filename}
                  linked
                />
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={attachment.title ?? ""}
                    placeholder={attachment.filename}
                    disabled={disabled}
                    onChange={(event) =>
                      onExistingTitleChange(index, event.target.value)
                    }
                  />
                  <a
                    href={attachmentHref(attachment.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    <span className="truncate">{attachment.filename}</span>
                  </a>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onRemoveExisting(index)}
                  aria-label="Remove attachment"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            {pendingAttachments.map((attachment, index) => (
              <div
                key={attachment.id}
                className="grid gap-3 rounded-sm border border-dashed p-3 md:grid-cols-[112px_1fr_auto]"
              >
                <AttachmentPreview
                  href={attachment.previewUrl}
                  filename={attachment.file.name}
                />
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={attachment.title}
                    placeholder={attachment.file.name}
                    disabled={disabled}
                    onChange={(event) =>
                      onPendingTitleChange(index, event.target.value)
                    }
                  />
                  <p className="truncate text-xs text-muted-foreground">
                    Ready to upload: {attachment.file.name}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onRemovePending(index)}
                  aria-label="Remove pending attachment"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function appendPendingMedicalAttachments(
  files: File[]
): PendingMedicalAttachment[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    title: "",
    file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  }));
}

export async function uploadPendingMedicalAttachments(params: {
  branchId: string;
  childId: string;
  formId?: string | null;
  attachments: PendingMedicalAttachment[];
}): Promise<MedicalAttachmentValue[]> {
  const uploaded: MedicalAttachmentValue[] = [];

  for (const attachment of params.attachments) {
    const result = await uploadFileWithPresign({
      branchId: params.branchId,
      scope: "medical-form",
      ownerId: params.formId ?? params.childId,
      file: attachment.file,
    });

    uploaded.push({
      title: attachment.title,
      filename: attachment.file.name,
      fileUrl: result.publicUrl,
    });
  }

  return uploaded;
}

export function useMedicalAttachments(
  initialAttachments: MedicalAttachmentValue[]
) {
  const [existingAttachments, setExistingAttachments] = useState<
    MedicalAttachmentValue[]
  >(initialAttachments);
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingMedicalAttachment[]
  >([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const pendingAttachmentsRef = useRef<PendingMedicalAttachment[]>([]);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    return () => {
      pendingAttachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  function addPendingAttachments(files: File[]) {
    setPendingAttachments((current) => [
      ...current,
      ...appendPendingMedicalAttachments(files),
    ]);
  }

  function updateExistingAttachmentTitle(index: number, title: string) {
    setExistingAttachments((current) =>
      current.map((attachment, attachmentIndex) =>
        attachmentIndex === index ? { ...attachment, title } : attachment
      )
    );
  }

  function removeExistingAttachment(index: number) {
    setExistingAttachments((current) => {
      const removed = current[index];
      if (removed?.id) {
        setRemovedAttachmentIds((ids) => [...ids, removed.id!]);
      }
      return current.filter((_, attachmentIndex) => attachmentIndex !== index);
    });
  }

  function updatePendingAttachmentTitle(index: number, title: string) {
    setPendingAttachments((current) =>
      current.map((attachment, attachmentIndex) =>
        attachmentIndex === index ? { ...attachment, title } : attachment
      )
    );
  }

  function removePendingAttachment(index: number) {
    setPendingAttachments((current) => {
      const removed = current[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, attachmentIndex) => attachmentIndex !== index);
    });
  }

  async function resolveAttachmentPayload(params: {
    childrenList: MedicalChildOption[];
    childId: string;
    formId?: string | null;
  }): Promise<MedicalAttachmentValue[] | null> {
    if (pendingAttachments.length === 0) return existingAttachments;

    const child = params.childrenList.find((item) => item.id === params.childId);
    if (!child?.branchId) {
      toast.error("Select a child before uploading medical attachments");
      return null;
    }

    try {
      const uploaded = await uploadPendingMedicalAttachments({
        branchId: child.branchId,
        childId: params.childId,
        formId: params.formId,
        attachments: pendingAttachments,
      });
      return [...existingAttachments, ...uploaded];
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload medical attachments"
      );
      return null;
    }
  }

  return {
    existingAttachments,
    pendingAttachments,
    removedAttachmentIds,
    addPendingAttachments,
    updateExistingAttachmentTitle,
    removeExistingAttachment,
    updatePendingAttachmentTitle,
    removePendingAttachment,
    resolveAttachmentPayload,
  };
}
