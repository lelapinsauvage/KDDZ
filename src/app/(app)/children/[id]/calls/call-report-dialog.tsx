"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCallLog, updateCallLog } from "@/lib/actions/calls";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { ExternalLink, FileText, Upload, X } from "lucide-react";

export interface CallCauseOption {
  id: string;
  value: string;
  label: string;
  category?: string;
}

export interface CallDialogInitialCall {
  id: string;
  direction: string;
  date: string;
  time: string | null;
  reason: string;
  subject: string;
  remarks: string;
  staffId: string;
  attachments: Array<{
    id: string;
    filename: string;
    fileUrl: string;
  }>;
}

type CallDirectionValue = "INCOMING" | "OUTGOING";

const CALL_CAUSE_OPTIONS: CallCauseOption[] = [
  { id: "health", value: "health", label: "Health Issue" },
  { id: "behavior", value: "behavior", label: "Behavior" },
  { id: "absence", value: "absence", label: "Absence" },
  { id: "pickup", value: "pickup", label: "Pickup Arrangement" },
  { id: "emergency", value: "emergency", label: "Emergency" },
  { id: "general_inquiry", value: "general_inquiry", label: "General Inquiry" },
  { id: "complaint", value: "complaint", label: "Complaint" },
  { id: "follow_up", value: "follow_up", label: "Follow Up" },
  { id: "other", value: "other", label: "Other" },
];

interface Props {
  childId: string;
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: { id: string; name: string | null; email: string }[];
  callCauseOptions?: CallCauseOption[];
  initialCall?: CallDialogInitialCall | null;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDirection(direction: string): CallDirectionValue {
  return direction === "OUTGOING" ? "OUTGOING" : "INCOMING";
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

export function CallReportDialog({
  childId,
  branchId,
  open,
  onOpenChange,
  staffList,
  callCauseOptions = [],
  initialCall = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [direction, setDirection] = useState<CallDirectionValue>(() =>
    initialCall ? normalizeDirection(initialCall.direction) : "INCOMING",
  );
  const [date, setDate] = useState(() => initialCall?.date || todayDate());
  const [time, setTime] = useState(() => initialCall?.time ?? "");
  const [causeOfCall, setCauseOfCall] = useState(() => initialCall?.reason ?? "");
  const [subject, setSubject] = useState(() => initialCall?.subject ?? "");
  const [remarks, setRemarks] = useState(() => initialCall?.remarks ?? "");
  const [teacherId, setTeacherId] = useState(() => initialCall?.staffId ?? "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const causeOptions = callCauseOptions.length ? callCauseOptions : CALL_CAUSE_OPTIONS;
  const isEditing = Boolean(initialCall);

  function resetForm() {
    setDirection(initialCall ? normalizeDirection(initialCall.direction) : "INCOMING");
    setDate(initialCall?.date || todayDate());
    setTime(initialCall?.time ?? "");
    setCauseOfCall(initialCall?.reason ?? "");
    setSubject(initialCall?.subject ?? "");
    setRemarks(initialCall?.remarks ?? "");
    setTeacherId(initialCall?.staffId ?? "");
    setAttachments([]);
    setError("");
  }

  function addAttachments(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length) {
      setAttachments((current) => [...current, ...files]);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!direction) {
      setError("Call type is required");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!time) {
      setError("Time is required");
      return;
    }
    if (!causeOfCall.trim()) {
      setError("Cause of call is required");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!teacherId) {
      setError("Teacher is required");
      return;
    }

    setError("");

    startTransition(async () => {
      const uploadedAttachments: Array<{ filename: string; fileUrl: string }> = [];
      if (attachments.length) {
        try {
          for (const file of attachments) {
            const uploaded = await uploadFileWithPresign({
              branchId,
              scope: "form-attachment",
              ownerId: childId,
              file,
            });
            uploadedAttachments.push({
              filename: file.name,
              fileUrl: uploaded.publicUrl,
            });
          }
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload attachments",
          );
          return;
        }
      }

      const payload = {
        childId,
        direction,
        date,
        time,
        reason: causeOfCall.trim(),
        subject: subject.trim(),
        remarks: remarks.trim() || undefined,
        staffId: teacherId,
        attachments: uploadedAttachments,
      };

      const result =
        initialCall
          ? await updateCallLog(initialCall.id, payload)
          : await createCallLog(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Call Report" : "New Call Report"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Call Type */}
          <div className="space-y-1.5">
            <Label>Call Type *</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as CallDirectionValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOMING">Incoming</SelectItem>
                <SelectItem value="OUTGOING">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="call-date">Date *</Label>
              <Input
                id="call-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-time">Time *</Label>
              <Input
                id="call-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Cause of Call */}
          <div className="space-y-1.5">
            <Label>Cause of Call *</Label>
            <Select value={causeOfCall} onValueChange={setCauseOfCall}>
              <SelectTrigger>
                <SelectValue placeholder="Select cause..." />
              </SelectTrigger>
              <SelectContent>
                {causeOptions.map((opt) => (
                  <SelectItem key={opt.id ?? opt.value} value={opt.value}>
                    {opt.category ? `${opt.category} - ${opt.label}` : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="call-subject">Subject *</Label>
            <Input
              id="call-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject of the call..."
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="call-remarks">Remarks</Label>
            <Textarea
              id="call-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Teacher who filled report */}
          <div className="space-y-1.5">
            <Label>Teacher Who Filled Report *</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            {initialCall?.attachments.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Existing attachments
                </p>
                {initialCall.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={attachmentHref(attachment.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm hover:underline"
                    >
                      {attachment.filename}
                    </a>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : null}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  New attachments
                </p>
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      disabled={isPending}
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addAttachments(event.dataTransfer.files);
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <Upload className="size-4" />
              Add files
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => {
                  addAttachments(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Call Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
