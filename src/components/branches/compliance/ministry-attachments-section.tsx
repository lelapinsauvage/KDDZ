"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComplianceDocument } from "../branch-compliance-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Clock } from "lucide-react";
import { upsertDocument } from "@/lib/actions/branch-compliance";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  branchId: string;
  documents: ComplianceDocument[];
  canUpdate?: boolean;
}

const REQUIRED_DOCS = [
  {
    type: "CERTIFIED_PHOTO",
    label: "صورة شمسية لصاحب الطلب مصدقة من مختار المحلة",
    color: "border-l-purple-500",
  },
  {
    type: "ID_COPY",
    label: "صورة عن تذكرة الهوية أو إخراج قيد",
    color: "border-l-purple-500",
  },
  {
    type: "BUILDING_MAP",
    label: "خريطة للبناء المنوي اتخاذه دار حضانة (لا تقل مساحته عن 200 م٢)",
    color: "border-l-orange-500",
  },
  {
    type: "PROPERTY_DEED",
    label: "سند ملكية أو إيجار أو عقد إستثمار",
    color: "border-l-purple-500",
  },
  {
    type: "CHILD_SAFETY_INSURANCE",
    label: "صورة عن عقد ضمان لسلامة الأطفال",
    color: "border-l-green-500",
  },
  {
    type: "INTERNAL_REGULATIONS",
    label: "النظام الداخلي لدار الحضانة",
    color: "border-l-green-500",
  },
  {
    type: "HEALTH_FILE",
    label: "الملف الصحي الصادر عن وزارة الصحة العامة",
    color: "border-l-green-500",
  },
  {
    type: "DIRECTOR_DIPLOMA",
    label: "صورة عن شهادة المديرة",
    color: "border-l-purple-500",
  },
  {
    type: "DOCTOR_LICENSE",
    label: "صورة عن رخصة الطبيب المسؤول",
    color: "border-l-purple-500",
  },
  {
    type: "DOCTOR_PLEDGE",
    label: "تعهد الطبيب المسؤول",
    color: "border-l-teal-500",
  },
  {
    type: "NURSE_LICENSE",
    label: "صورة عن رخصة الممرضة",
    color: "border-l-teal-500",
  },
] as const;

export function MinistryAttachmentsSection({
  branchId,
  documents,
  canUpdate = true,
}: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        المستندات المطلوبة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        المستندات المطلوبة من وزارة الصحة — ١١ وثيقة
      </p>

      <div className="space-y-4">
        {REQUIRED_DOCS.map((req) => {
          const existing = documents.find((d) => d.documentType === req.type);
          return (
            <AttachmentRow
              key={req.type}
              branchId={branchId}
              docType={req.type}
              label={req.label}
              color={req.color}
              existing={existing}
              canUpdate={canUpdate}
            />
          );
        })}
      </div>
    </div>
  );
}

function AttachmentRow({
  branchId,
  docType,
  label,
  color,
  existing,
  canUpdate,
}: {
  branchId: string;
  docType: string;
  label: string;
  color: string;
  existing?: ComplianceDocument;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [documentId, setDocumentId] = useState(existing?.id);
  const [title, setTitle] = useState(existing?.label ?? "");
  const [expiryDate, setExpiryDate] = useState(
    existing?.expiryDate
      ? new Date(existing.expiryDate).toISOString().split("T")[0]
      : "",
  );
  const [filename, setFilename] = useState(existing?.filename ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");

  const isUploaded = existing?.status === "UPLOADED" || existing?.status === "VERIFIED";

  function handleSave() {
    if (!canUpdate) {
      toast.error("Access denied");
      return;
    }
    startTransition(async () => {
      const result = await upsertDocument(branchId, {
        id: documentId,
        documentType: docType,
        label: title || undefined,
        filename: filename || undefined,
        fileUrl: fileUrl || undefined,
        expiryDate: expiryDate || undefined,
        status: "UPLOADED",
      });
      if (result.success) {
        const saved = result.data as { id?: string } | undefined;
        if (saved?.id) setDocumentId(saved.id);
        toast.success("تم حفظ المستند");
        router.refresh();
      } else {
        toast.error(result.error ?? "فشل في حفظ المستند");
      }
    });
  }

  async function handleUpload(file: File) {
    if (!canUpdate) {
      toast.error("Access denied");
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await uploadFileWithPresign({
        branchId,
        scope: "compliance-document",
        file,
        ownerId: documentId,
      });

      setFilename(file.name);
      setFileUrl(uploaded.publicUrl);

      const result = await upsertDocument(branchId, {
        id: documentId,
        documentType: docType,
        label: title || undefined,
        filename: file.name,
        fileUrl: uploaded.publicUrl,
        expiryDate: expiryDate || undefined,
        status: "UPLOADED",
      });

      if (result.success) {
        const saved = result.data as { id?: string } | undefined;
        if (saved?.id) setDocumentId(saved.id);
        toast.success("تم رفع المستند");
        router.refresh();
      } else {
        toast.error(result.error ?? "فشل في حفظ المستند");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل في رفع المستند");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "rounded-sm border border-l-4 p-4 transition-colors",
        color,
        isUploaded ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" : "border-border",
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        {isUploaded ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
        ) : (
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-xs">عنوان المستند</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            dir="rtl"
            className="text-sm"
            readOnly={!canUpdate}
          />
        </div>
        <div>
          <Label className="text-xs">اسم الملف</Label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
              disabled={!canUpdate}
            />
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="اختر ملف..."
              dir="rtl"
              className="text-sm"
              readOnly={!canUpdate}
            />
            {canUpdate ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={isPending || isUploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div>
          <Label className="text-xs">تاريخ الانتهاء</Label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            dir="ltr"
            className="text-sm"
            disabled={!canUpdate}
          />
        </div>
      </div>

      {canUpdate ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || isUploading}
            onClick={handleSave}
          >
            {isPending || isUploading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
