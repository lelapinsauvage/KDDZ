"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  absenceReportSchema,
  type AbsenceReportFormValues,
} from "@/lib/validations/absence-report";
import {
  createAbsenceReport,
  updateAbsenceReport,
} from "@/lib/actions/absent-reports";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Trash2,
  User,
  UserX,
} from "lucide-react";

interface ChildOption {
  id: string;
  name: string;
  childNumber: string;
  branchId: string;
  classId: string | null;
  className: string;
  photo: string | null;
}

interface TeacherOption {
  id: string;
  legacyId: number | null;
  name: string;
  branchId: string;
}

interface ExistingAttachment {
  id: string;
  filename: string;
  fileUrl: string;
}

interface PendingAttachment {
  key: string;
  file: File;
  title: string;
  previewUrl: string | null;
}

interface AbsenceReportFormProps {
  childrenList: ChildOption[];
  teacherList: TeacherOption[];
  defaultValues?: Partial<AbsenceReportFormValues>;
  reportId?: string;
  existingAttachments?: ExistingAttachment[];
}

const reasonPresets = ["Gripp", "Flu", "Fracture", "Holiday", "Travel"];

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/AbsDocs/${fileUrl}`;
}

function isImageLike(value: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value);
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function PendingPreview({ attachment }: { attachment: PendingAttachment }) {
  if (!attachment.previewUrl) {
    return (
      <div className="flex h-28 w-36 items-center justify-center rounded border bg-muted">
        <FileText className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-28 w-36 overflow-hidden rounded border bg-muted">
      <Image
        src={attachment.previewUrl}
        alt={attachment.file.name}
        fill
        sizes="144px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

function ExistingPreview({ attachment }: { attachment: ExistingAttachment }) {
  const href = attachmentHref(attachment.fileUrl);
  if (!isImageLike(href)) {
    return (
      <div className="flex h-28 w-36 items-center justify-center rounded border bg-muted">
        <FileText className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="relative block h-28 w-36 overflow-hidden rounded border bg-muted"
    >
      <Image
        src={href}
        alt={attachment.filename}
        fill
        sizes="144px"
        className="object-cover"
        unoptimized
      />
    </a>
  );
}

export function AbsenceReportForm({
  childrenList,
  teacherList,
  defaultValues,
  reportId,
  existingAttachments = [],
}: AbsenceReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialHospitalChoice =
    defaultValues?.hospitalizedChoice ??
    (defaultValues?.hospitalized ? "Yes" : reportId ? "No" : "");
  const [hospitalChoice, setHospitalChoiceState] = useState<"" | "Yes" | "No">(
    initialHospitalChoice as "" | "Yes" | "No",
  );

  const {
    register,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<AbsenceReportFormValues>({
    resolver: zodResolver(absenceReportSchema),
    defaultValues: {
      childId: "",
      classId: "",
      teacherId: "",
      date: todayString(),
      reason: "",
      absentFrom: "",
      absentTo: "",
      hospitalized: false,
      hospitalizedChoice: initialHospitalChoice,
      hospitalName: "",
      doctorName: "",
      status: "PENDING",
      ...defaultValues,
    },
  });

  const selectedChildId = watch("childId");
  const selectedChild = useMemo(
    () => childrenList.find((child) => child.id === selectedChildId) ?? null,
    [childrenList, selectedChildId],
  );
  const selectedChildPhoto = childPhotoSrc(selectedChild?.photo ?? null);
  const isSubmittedReport = defaultValues?.status === "APPROVED";
  const visibleExistingAttachments = existingAttachments.filter(
    (attachment) => !removedAttachmentIds.includes(attachment.id),
  );

  useEffect(() => {
    if (!selectedChild) return;
    setValue("classId", selectedChild.classId ?? "");
  }, [selectedChild, setValue]);

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

  function setHospitalChoice(value: "" | "Yes" | "No") {
    setHospitalChoiceState(value);
    setValue("hospitalizedChoice", value);
    setValue("hospitalized", value === "Yes");
    if (value !== "Yes") {
      setValue("hospitalName", "");
      setValue("doctorName", "");
    }
  }

  function addPendingFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setPendingAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        title: "No Title",
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removePendingAttachment(key: string) {
    setPendingAttachments((current) => {
      const attachment = current.find((item) => item.key === key);
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }

  function updatePendingAttachmentTitle(key: string, title: string) {
    setPendingAttachments((current) =>
      current.map((attachment) =>
        attachment.key === key ? { ...attachment, title } : attachment,
      ),
    );
  }

  function submittedValidationErrors(data: AbsenceReportFormValues) {
    const missing: string[] = [];
    if (!data.teacherId?.trim()) missing.push("Teacher");
    if (!data.reason?.trim()) missing.push("Reason of absence");
    if (!data.absentFrom?.trim()) missing.push("Absent From");
    if (!data.absentTo?.trim()) missing.push("Absent To");
    if (!hospitalChoice) missing.push("Does the Child attend Hospital?");
    if (hospitalChoice === "Yes") {
      if (!data.hospitalName?.trim()) missing.push("Hospital Name");
      if (!data.doctorName?.trim()) missing.push("Dr Name");
    }
    if (data.absentFrom && data.absentTo) {
      const from = Date.parse(data.absentFrom);
      const to = Date.parse(data.absentTo);
      if (Number.isFinite(from) && Number.isFinite(to) && to < from) {
        return "Absent To can't be less than absent From.";
      }
    }
    if (missing.length) {
      return `Please fill the mandatory fields: ${missing.join(", ")}.`;
    }
    return null;
  }

  async function submitWithStatus(status: "PENDING" | "APPROVED") {
    setError(null);
    const hasBaseFields = await trigger(["childId", "date"]);
    if (!hasBaseFields) return;

    const data: AbsenceReportFormValues = {
      ...getValues(),
      status,
      hospitalized: hospitalChoice === "Yes",
      hospitalizedChoice: hospitalChoice,
    };

    if (status === "APPROVED") {
      const validationMessage = submittedValidationErrors(data);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("childId", data.childId);
      fd.set("date", data.date);
      fd.set("status", status);
      fd.set("hospitalized", String(data.hospitalized));
      fd.set("hospitalizedChoice", hospitalChoice);
      if (data.classId) fd.set("classId", data.classId);
      if (data.teacherId) fd.set("teacherId", data.teacherId);
      if (data.reason) fd.set("reason", data.reason);
      if (data.absentFrom) fd.set("absentFrom", data.absentFrom);
      if (data.absentTo) fd.set("absentTo", data.absentTo);
      if (data.hospitalized && data.hospitalName) fd.set("hospitalName", data.hospitalName);
      if (data.hospitalized && data.doctorName) fd.set("doctorName", data.doctorName);

      if (pendingAttachments.length) {
        const child = childrenList.find((item) => item.id === data.childId);
        if (!child?.branchId) {
          setError("Cannot upload attachments because the child's branch is unavailable");
          return;
        }

        try {
          const uploadedAttachments: Array<{
            filename: string;
            fileUrl: string;
          }> = [];
          for (const attachment of pendingAttachments) {
            const uploaded = await uploadFileWithPresign({
              branchId: child.branchId,
              scope: "absence-report",
              ownerId: reportId ?? data.childId,
              file: attachment.file,
            });
            uploadedAttachments.push({
              filename: attachment.title.trim() || attachment.file.name,
              fileUrl: uploaded.publicUrl,
            });
          }
          fd.set("attachments", JSON.stringify(uploadedAttachments));
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload attachments",
          );
          return;
        }
      }

      if (removedAttachmentIds.length) {
        fd.set("removeAttachmentIds", JSON.stringify(removedAttachmentIds));
      }

      const result = reportId
        ? await updateAbsenceReport(reportId, fd)
        : await createAbsenceReport(fd);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      router.push(status === "PENDING" ? "/absent-reports/drafts" : reportId ? `/absent-reports/${reportId}` : "/absent-reports");
    });
  }

  return (
    <form className="space-y-6 p-4 md:p-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {selectedChildPhoto ? (
            <div className="relative size-20 overflow-hidden rounded-full border bg-muted">
              <Image
                src={selectedChildPhoto}
                alt={selectedChild?.name ?? "Child"}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full border bg-muted">
              <User className="size-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">Absent Report</h2>
            <p className="text-sm text-muted-foreground">
              {selectedChild ? `${selectedChild.childNumber} - ${selectedChild.name}` : "Select a child"}
            </p>
          </div>
        </div>
        <div className={`rounded px-3 py-1 text-sm font-medium ${isSubmittedReport ? "bg-[#008200] text-white" : "bg-[#c29d0b] text-white"}`}>
          {isSubmittedReport ? "Submitted" : "Draft"}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="size-4 text-primary" />
            General Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="childId">Child *</Label>
              <Select
                value={watch("childId") || "UNASSIGNED"}
                onValueChange={(value) => setValue("childId", value === "UNASSIGNED" ? "" : value)}
              >
                <SelectTrigger className={errors.childId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Choose Child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Choose Child</SelectItem>
                  {childrenList.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.childNumber}: {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.childId && (
                <p className="text-xs text-destructive">{errors.childId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                readOnly
                {...register("date")}
                className={errors.date ? "border-destructive" : "bg-muted/60"}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="classId">Class *</Label>
              <Input
                value={selectedChild?.className ?? ""}
                readOnly
                placeholder="Select Class"
                className="bg-muted/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher *</Label>
              <Select
                value={watch("teacherId") || "UNASSIGNED"}
                onValueChange={(value) => setValue("teacherId", value === "UNASSIGNED" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Select Teacher</SelectItem>
                  {teacherList.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Reason of absence *</Label>
              <Input
                id="reason"
                list="absence-reasons"
                placeholder="Select/Add"
                {...register("reason")}
              />
              <datalist id="absence-reasons">
                {reasonPresets.map((reason) => (
                  <option key={reason} value={reason} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absentFrom">Absent From *</Label>
              <Input type="date" {...register("absentFrom")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absentTo">Absent To *</Label>
              <Input type="date" {...register("absentTo")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Hospital Infos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Does the Child attend Hospital? *</Label>
              <Select
                value={hospitalChoice || "UNSET"}
                onValueChange={(value) => setHospitalChoice(value === "UNSET" ? "" : value as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNSET">Select</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hospitalChoice === "Yes" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input placeholder="Hospital" {...register("hospitalName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Dr Name *</Label>
                  <Input placeholder="Doctor" {...register("doctorName")} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="size-4 text-primary" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {visibleExistingAttachments.length + pendingAttachments.length} attachment{visibleExistingAttachments.length + pendingAttachments.length === 1 ? "" : "s"}
            </p>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Plus className="size-4" />
              Add New Attachments
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) => addPendingFiles(event.target.files)}
            />
          </div>

          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addPendingFiles(event.dataTransfer.files);
            }}
            className="space-y-3 rounded border border-dashed border-muted-foreground/25 bg-muted/30 p-3"
          >
            {visibleExistingAttachments.length === 0 && pendingAttachments.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Drop files here or add an attachment.
              </div>
            ) : (
              <>
                {visibleExistingAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex flex-col gap-3 rounded border bg-card p-3 md:flex-row md:items-center">
                    <ExistingPreview attachment={attachment} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>Title</Label>
                      <Input value={attachment.filename || "No Title"} readOnly className="bg-muted/60" />
                      <a
                        href={attachmentHref(attachment.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs text-primary hover:underline"
                      >
                        {attachment.fileUrl}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setRemovedAttachmentIds((current) => [...current, attachment.id])}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                ))}

                {pendingAttachments.map((attachment) => (
                  <div key={attachment.key} className="flex flex-col gap-3 rounded border bg-card p-3 md:flex-row md:items-center">
                    <PendingPreview attachment={attachment} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={attachment.title}
                        onChange={(event) => updatePendingAttachmentTitle(attachment.key, event.target.value)}
                        placeholder="Image Title"
                      />
                      <p className="truncate text-xs text-muted-foreground">{attachment.file.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removePendingAttachment(attachment.key)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t bg-card px-4 py-3 md:flex-row md:items-center md:justify-end md:px-6 md:py-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        {!isSubmittedReport && (
          <Button type="button" variant="secondary" onClick={() => submitWithStatus("PENDING")} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save As Draft
          </Button>
        )}
        <Button type="button" onClick={() => submitWithStatus("APPROVED")} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {reportId && isSubmittedReport ? "Update Absent Report" : "Save Absent Report"}
        </Button>
      </div>
    </form>
  );
}
