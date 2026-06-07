"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { upsertDocument } from "@/lib/actions/branch-compliance";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";

// ── Required document types for Lebanese Ministry of Health ──
const REQUIRED_DOCUMENTS = [
  { type: "COMMERCIAL_REGISTER", label: "Commercial Register Extract", arabicLabel: "السجل التجاري" },
  { type: "CIVIL_STATUS", label: "Civil Status Record", arabicLabel: "صورة عن تذكرة الهوية او اخراج قيد" },
  { type: "CRIMINAL_RECORD", label: "Criminal Record Certificate", arabicLabel: "سجل عدلي" },
  { type: "LEASE_CONTRACT", label: "Lease Contract / Rental Agreement", arabicLabel: "سند ملكية أو إيجار أو عقد إستثمار" },
  { type: "PROPERTY_DEED", label: "Property Deed", arabicLabel: "سند ملكية" },
  { type: "HEALTH_LICENSE", label: "Ministry of Health License", arabicLabel: "الملف الصحي الصادر عن وزارة الصحة العامة" },
  { type: "FIRE_SAFETY", label: "Fire Safety Certificate", arabicLabel: "شهادة السلامة من الحريق" },
  { type: "INSURANCE_CERTIFICATE", label: "Insurance Certificate", arabicLabel: "عقد ضمان لسلامة الأطفال" },
  { type: "DIRECTOR_DIPLOMA", label: "Director Diploma / Credential", arabicLabel: "شهادات المديرة المسؤولة" },
  { type: "DOCTOR_LICENSE", label: "Doctor License / Syndicate Card", arabicLabel: "اجازة ممارسة مهنة الطب" },
  { type: "FLOOR_PLAN", label: "Floor Plan / Layout Drawing", arabicLabel: "خريطة البناء (لا تقل عن 200 م²)" },
  { type: "OTHER", label: "Other Supporting Documents", arabicLabel: "مستندات أخرى" },
];

type RequiredDocument = (typeof REQUIRED_DOCUMENTS)[number];

interface Document {
  id: string;
  documentType: string;
  label: string | null;
  filename: string | null;
  fileUrl: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: "PENDING" | "UPLOADED" | "VERIFIED" | "EXPIRED";
  notes: string | null;
}

interface Props {
  branchId: string;
  documents: Document[];
  themeColor?: string;
  canUpdateNurseryInfo?: boolean;
}

function getStatusConfig(status: string, expiryDate: string | null) {
  const now = new Date();
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const daysUntilExpiry = expiry
    ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (status === "EXPIRED" || (expiry && daysUntilExpiry !== null && daysUntilExpiry < 0)) {
    return {
      icon: XCircle,
      label: "Expired",
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }
  if (expiry && daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    return {
      icon: AlertTriangle,
      label: `Expires in ${daysUntilExpiry}d`,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  if (status === "VERIFIED") {
    return {
      icon: CheckCircle2,
      label: "Verified",
      className: "bg-[#059669]/15 text-[#059669] border-[#059669]/20",
    };
  }
  if (status === "UPLOADED") {
    return {
      icon: Clock,
      label: "Uploaded",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }
  return {
    icon: Clock,
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  };
}

export function ComplianceDocumentsClient({
  branchId,
  documents,
  themeColor = "#1caf9a",
  canUpdateNurseryInfo = true,
}: Props) {
  const docsByType = new Map(documents.map((d) => [d.documentType, d]));

  const uploadedCount = documents.filter(
    (d) => d.status === "UPLOADED" || d.status === "VERIFIED",
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Required Documents
          </h2>
          <p className="text-sm text-muted-foreground">
            {uploadedCount} of {REQUIRED_DOCUMENTS.length} documents uploaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(uploadedCount / REQUIRED_DOCUMENTS.length) * 100}%`,
                backgroundColor: themeColor,
              }}
            />
          </div>
          <span className="text-sm font-medium text-foreground">
            {Math.round((uploadedCount / REQUIRED_DOCUMENTS.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Document cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REQUIRED_DOCUMENTS.map((reqDoc) => {
          const doc = docsByType.get(reqDoc.type);
          const status = doc ? getStatusConfig(doc.status, doc.expiryDate) : null;

          return (
            <Card key={reqDoc.type} className="overflow-hidden rounded-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${doc ? "" : "bg-muted"}`}
                  style={doc ? { backgroundColor: `${themeColor}20` } : undefined}
                >
                  <FileText
                    className={`size-5 ${doc ? "" : "text-muted-foreground/40"}`}
                    style={doc ? { color: themeColor } : undefined}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {reqDoc.label}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="rtl">
                    {reqDoc.arabicLabel}
                  </p>
                  {doc ? (
                    <div className="mt-1 space-y-1">
                      {doc.filename && (
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.filename}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {status && (
                          <Badge className={`${status.className} text-[10px]`}>
                            <status.icon className="mr-1 size-3" />
                            {status.label}
                          </Badge>
                        )}
                        {doc.expiryDate && (
                          <span className="text-[10px] text-muted-foreground/70">
                            Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground">{doc.notes}</p>
                      )}
                      <DocumentUploadButton
                        branchId={branchId}
                        reqDoc={reqDoc}
                        doc={doc}
                        canUpdate={canUpdateNurseryInfo}
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <DocumentUploadButton
                        branchId={branchId}
                        reqDoc={reqDoc}
                        doc={doc}
                        canUpdate={canUpdateNurseryInfo}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DocumentUploadButton({
  branchId,
  reqDoc,
  doc,
  canUpdate,
}: {
  branchId: string;
  reqDoc: RequiredDocument;
  doc?: Document;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File) {
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
        ownerId: doc?.id,
      });

      const result = await upsertDocument(branchId, {
        id: doc?.id,
        documentType: reqDoc.type,
        label: doc?.label ?? reqDoc.label,
        filename: file.name,
        fileUrl: uploaded.publicUrl,
        status: "UPLOADED",
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save uploaded document");
      }

      toast.success("Document uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!canUpdate) return null;

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 rounded-sm border-dashed text-xs"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3" />
        {isUploading ? "Uploading..." : doc ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}
