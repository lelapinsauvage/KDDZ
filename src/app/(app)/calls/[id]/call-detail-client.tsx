"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Pencil,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Printer,
  Trash2,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCallLog } from "@/lib/actions/calls";
import {
  CallReportDialog,
  type CallCauseOption,
} from "../../children/[id]/calls/call-report-dialog";

type CallDirectionValue = "INCOMING" | "OUTGOING" | "MISSED";

interface CallAttachment {
  id: string;
  title: string | null;
  filename: string;
  fileUrl: string;
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
}

export interface StandaloneCallDetail {
  id: string;
  legacyId: number | null;
  sourceDatabase: string | null;
  childId: string;
  childName: string;
  childNumber: string;
  childPhoto: string | null;
  legacyChildId: number | null;
  branchId: string;
  branchName: string;
  legacyBranchId: number | null;
  className: string | null;
  legacyClassId: number | null;
  direction: CallDirectionValue;
  date: string;
  time: string | null;
  reason: string;
  subject: string;
  remarks: string;
  staffId: string;
  teacherName: string | null;
  legacyTeacherId: number | null;
  createdBy: string | null;
  isDraft: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
  attachments: CallAttachment[];
}

interface Props {
  call: StandaloneCallDetail;
  staffList: StaffMember[];
  callCauseOptions: CallCauseOption[];
}

const directionConfig: Record<
  CallDirectionValue,
  { label: string; icon: typeof Phone; className: string }
> = {
  INCOMING: {
    label: "Incoming",
    icon: PhoneIncoming,
    className: "bg-blue-100 text-blue-700 border-transparent",
  },
  OUTGOING: {
    label: "Outgoing",
    icon: PhoneOutgoing,
    className: "bg-emerald-100 text-emerald-700 border-transparent",
  },
  MISSED: {
    label: "Missed",
    icon: Phone,
    className: "bg-amber-100 text-amber-700 border-transparent",
  },
};

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text || "-";
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function isImageAttachment(attachment: CallAttachment) {
  const value = `${attachment.fileUrl} ${attachment.filename}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(value);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[170px_1fr]">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap text-sm text-foreground">
        {display(value)}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

export function CallDetailClient({ call, staffList, callCauseOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<CallAttachment | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  const direction = directionConfig[call.direction] ?? directionConfig.INCOMING;
  const DirectionIcon = direction.icon;
  const complete = call.progress === 1 && !call.isDraft;
  const photoSrc = childPhotoSrc(call.childPhoto);
  const canEditFormSix = call.direction !== "MISSED";

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCallLog(call.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete call report");
        return;
      }

      toast.success("Call report deleted");
      router.push(`/children/${call.childId}/calls`);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title={`Call Report ${call.legacyId ? `#${call.legacyId}` : ""}`.trim()}
        description={`${call.childName} - ${call.branchName}${call.className ? ` / ${call.className}` : ""}`}
        breadcrumbs={[
          { label: "Calls Reports", href: "/calls" },
          { label: call.childName, href: `/children/${call.childId}/calls` },
          { label: "Call Report" },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calls">
                <ArrowLeft className="size-4" />
                Calls
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
            {canEditFormSix ? (
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
          </>
        }
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
          <Card className="rounded-sm">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {photoSrc && !photoFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoSrc}
                      alt={call.childName}
                      className="size-full object-cover"
                      onError={() => setPhotoFailed(true)}
                    />
                  ) : (
                    <User className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{call.childName}</p>
                  <p className="text-sm text-muted-foreground">
                    Child # {call.childNumber}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={direction.className}>
                  <DirectionIcon className="size-3" />
                  {direction.label}
                </Badge>
                <Badge
                  className={
                    complete
                      ? "bg-[#008200]/10 text-[#008200]"
                      : "bg-[#d64635]/10 text-[#b73528]"
                  }
                >
                  {complete ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <AlertTriangle className="size-3" />
                  )}
                  {complete ? "Form Filled Completely" : "Form Not Filled Completely"}
                </Badge>
                {call.isDraft ? <Badge variant="secondary">Draft</Badge> : null}
              </div>

              <dl>
                <DetailField label="Legacy Form ID" value={call.legacyId} />
                <DetailField label="Source Database" value={call.sourceDatabase} />
                <DetailField label="Legacy Child ID" value={call.legacyChildId} />
                <DetailField label="Legacy Branch ID" value={call.legacyBranchId} />
                <DetailField label="Legacy Class ID" value={call.legacyClassId} />
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/children/${call.childId}/calls`}>Child Calls</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Section title="Call">
              <dl>
                <DetailField label="Call Type" value={direction.label} />
                <DetailField label="Date" value={call.date} />
                <DetailField label="Time" value={call.time} />
              </dl>
            </Section>

            <Section title="Cause of Call">
              <dl>
                <DetailField label="Cause of Call" value={call.reason} />
              </dl>
            </Section>

            <Section title="Subject">
              <dl>
                <DetailField label="Subject" value={call.subject} />
                <DetailField label="Remarks" value={call.remarks} />
                <DetailField
                  label="Teacher Who Filled Report"
                  value={call.teacherName}
                />
                <DetailField label="Legacy Teacher ID" value={call.legacyTeacherId} />
                <DetailField label="Filed By" value={call.createdBy} />
                <DetailField label="Created" value={call.createdAt} />
                <DetailField label="Updated" value={call.updatedAt} />
              </dl>
            </Section>
          </div>
        </div>

        <Section title="Attachments">
          {call.attachments.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {call.attachments.map((attachment, index) => {
                const href = attachmentHref(attachment.fileUrl);
                const image = isImageAttachment(attachment);
                return (
                  <div
                    key={attachment.id}
                    className="grid gap-3 rounded-sm border border-border/70 bg-muted/20 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-background text-muted-foreground">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {attachment.title || `Attachment ${index + 1}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {attachment.filename}
                        </p>
                      </div>
                    </div>

                    {image ? (
                      <button
                        type="button"
                        className="aspect-[4/3] overflow-hidden rounded-sm border bg-background text-left"
                        onClick={() => setPreviewAttachment(attachment)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={href}
                          alt={attachment.title || attachment.filename}
                          className="size-full object-cover"
                        />
                      </button>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {image ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewAttachment(attachment)}
                        >
                          Preview
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" asChild>
                        <a href={href} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              No active attachments on this call report.
            </p>
          )}
        </Section>
      </div>

      {canEditFormSix ? (
        <CallReportDialog
          childId={call.childId}
          branchId={call.branchId}
          open={editOpen}
          onOpenChange={setEditOpen}
          staffList={staffList}
          callCauseOptions={callCauseOptions}
          initialCall={{
            id: call.id,
            direction: call.direction,
            date: call.date,
            time: call.time,
            reason: call.reason,
            subject: call.subject,
            remarks: call.remarks,
            isDraft: call.isDraft,
            staffId: call.staffId,
            attachments: call.attachments.map((attachment) => ({
              id: attachment.id,
              filename: attachment.filename,
              fileUrl: attachment.fileUrl,
            })),
          }}
        />
      ) : null}

      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      >
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>
              {previewAttachment?.title || previewAttachment?.filename || "Attachment"}
            </DialogTitle>
          </DialogHeader>
          {previewAttachment ? (
            <div className="overflow-hidden rounded-sm border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentHref(previewAttachment.fileUrl)}
                alt={previewAttachment.title || previewAttachment.filename}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Report</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the call report from the child and global calls lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
