"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  FileText,
  Filter,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { createCallLog, deleteCallLog } from "@/lib/actions/calls";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CallDirectionValue = "INCOMING" | "OUTGOING" | "MISSED";

interface CallRow {
  id: string;
  legacyFormId: number | null;
  childNumber: string;
  childPhoto: string | null;
  date: string;
  time: string | null;
  direction: CallDirectionValue;
  isDraft: boolean;
  childId: string;
  firstName: string;
  lastName: string;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  contact: string;
  phone: string;
  subject: string;
  reason: string;
  remarks: string;
  createdBy: string | null;
  attachmentCount: number;
}

interface BranchOption {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
  branchId: string;
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  legacyId?: number | null;
}

interface CallCauseOption {
  id: string;
  value: string;
  label: string;
  category?: string;
}

interface ChildOption {
  id: string;
  childNumber: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  branchId: string;
  classId: string | null;
  branchName: string;
  className: string;
}

interface Filters {
  search: string;
  branch: string;
  class: string;
  direction: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

interface Props {
  calls: CallRow[];
  total: number;
  branches: BranchOption[];
  classes: ClassOption[];
  staffList: StaffMember[];
  callCauseOptions: CallCauseOption[];
  childOptions: ChildOption[];
  filters: Filters;
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
    icon: PhoneMissed,
    className: "bg-amber-100 text-amber-700 border-transparent",
  },
};

const fallbackCallCauseOptions: CallCauseOption[] = [
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

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function queryValue(value: string) {
  return value && value !== "ALL" ? value : "";
}

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function ChildPhoto({ call }: { call: CallRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(call.childPhoto);

  if (!src || failed) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
        <User className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative size-10 overflow-hidden rounded-full border bg-muted">
      <Image
        src={src}
        alt={call.childName}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function CallsManagementClient({
  calls,
  total,
  branches,
  classes,
  staffList,
  callCauseOptions,
  childOptions,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const pageStart = total === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const pageEnd = Math.min(total, filters.page * filters.pageSize);

  const availableClasses = useMemo(() => {
    if (!queryValue(filters.branch)) return classes;
    return classes.filter((cls) => cls.branchId === filters.branch);
  }, [classes, filters.branch]);

  const activeFilterCount = [
    filters.search,
    queryValue(filters.branch),
    queryValue(filters.class),
    queryValue(filters.direction),
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  function replaceParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!("page" in updates)) {
      params.delete("page");
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function clearFilters() {
    setSearchDraft("");
    replaceParams({
      search: "",
      branch: "",
      class: "",
      direction: "",
      dateFrom: "",
      dateTo: "",
      page: "",
    });
  }

  function handleDelete(callId: string) {
    if (!confirm("Delete this call log?")) return;
    startTransition(async () => {
      await deleteCallLog(callId);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Calls Reports"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children Management", href: "/children" },
          { label: "Calls Reports" },
        ]}
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4" />
            <span>
              {total} call{total === 1 ? "" : "s"}
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="size-3" />
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            New Call Report
          </Button>
        </div>

        <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(150px,1fr))_auto]">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              replaceParams({ search: searchDraft });
            }}
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search calls, child, reason..."
              className="pl-9"
            />
          </form>

          <Select
            value={filters.branch}
            onValueChange={(value) => replaceParams({ branch: value, class: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.class}
            onValueChange={(value) => replaceParams({ class: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.direction}
            onValueChange={(value) => replaceParams({ direction: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INCOMING">Incoming</SelectItem>
              <SelectItem value="OUTGOING">Outgoing</SelectItem>
              <SelectItem value="MISSED">Missed</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => replaceParams({ dateFrom: event.target.value })}
            aria-label="Date from"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) => replaceParams({ dateTo: event.target.value })}
            aria-label="Date to"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            disabled={activeFilterCount === 0 || isPending}
            onClick={clearFilters}
            aria-label="Clear filters"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>#</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>F Name</TableHead>
                  <TableHead>L Name</TableHead>
                  <TableHead>Call Type</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Cause</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[92px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.length ? (
                  calls.map((call) => {
                    const direction = directionConfig[call.direction];
                    const DirectionIcon = direction.icon;
                    return (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.childNumber}</TableCell>
                        <TableCell>
                          <ChildPhoto call={call} />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/children/${call.childId}/calls`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {call.firstName || "-"}
                          </Link>
                        </TableCell>
                        <TableCell>{call.lastName || "-"}</TableCell>
                        <TableCell>
                          <Badge className={direction.className}>
                            <DirectionIcon className="mr-1 size-3" />
                            {direction.label}
                          </Badge>
                          {call.isDraft ? (
                            <Badge variant="secondary" className="ml-1">
                              Draft
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>{call.branchName || "-"}</TableCell>
                        <TableCell>{call.className || "-"}</TableCell>
                        <TableCell>
                          <span className="line-clamp-2 max-w-[180px] text-sm">
                            {call.reason || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="line-clamp-1 max-w-[200px] font-medium">
                            {call.subject || "-"}
                          </div>
                          <div className="line-clamp-1 max-w-[220px] text-xs text-muted-foreground">
                            {call.remarks || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatDisplayDate(call.date)}</div>
                          <div className="text-xs text-muted-foreground">{call.time ?? "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                              <Link href={`/children/${call.childId}/calls`} aria-label="Open call log">
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              disabled={isPending}
                              onClick={() => handleDelete(call.id)}
                              aria-label="Delete call log"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="p-6">
                      <EmptyState
                        icon={Phone}
                        title="No call logs found"
                        description="No calls match the current filters."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{pageStart}</span>
            {" - "}
            <span className="font-medium text-foreground">{pageEnd}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={`${filters.pageSize}`}
              onValueChange={(value) => replaceParams({ pageSize: value, page: "1" })}
            >
              <SelectTrigger className="h-9 w-[82px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1 || isPending}
              onClick={() => replaceParams({ page: `${Math.max(1, filters.page - 1)}` })}
            >
              Previous
            </Button>
            <span className="min-w-[84px] text-center text-sm text-muted-foreground">
              Page {filters.page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= pageCount || isPending}
              onClick={() => replaceParams({ page: `${Math.min(pageCount, filters.page + 1)}` })}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <GlobalCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        childOptions={childOptions}
        staffList={staffList}
        callCauseOptions={callCauseOptions}
      />
    </>
  );
}

function GlobalCallDialog({
  open,
  onOpenChange,
  childOptions,
  staffList,
  callCauseOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childOptions: ChildOption[];
  staffList: StaffMember[];
  callCauseOptions: CallCauseOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [childId, setChildId] = useState("");
  const [direction, setDirection] = useState<CallDirectionValue>("INCOMING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [subject, setSubject] = useState("");
  const [remarks, setRemarks] = useState("");
  const [staffId, setStaffId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");

  const selectedChild = childOptions.find((child) => child.id === childId);
  const causeOptions = callCauseOptions.length ? callCauseOptions : fallbackCallCauseOptions;
  const causeParents = useMemo(() => {
    const parents = new Map<string, string>();
    for (const option of causeOptions) {
      const value = option.category?.trim() || option.value.trim() || option.label.trim();
      if (value && !parents.has(value)) {
        parents.set(value, option.category?.trim() || option.label.trim());
      }
    }
    return Array.from(parents, ([value, label]) => ({ value, label }));
  }, [causeOptions]);
  const subjectOptions = useMemo(() => {
    return causeOptions
      .filter((option) => !reason || option.category === reason || option.value === reason)
      .map((option) => option.label)
      .filter((label, index, labels) => label && labels.indexOf(label) === index);
  }, [causeOptions, reason]);

  function resetForm() {
    setChildId("");
    setDirection("INCOMING");
    setDate(new Date().toISOString().slice(0, 10));
    setTime("");
    setReason("");
    setSubject("");
    setRemarks("");
    setStaffId("");
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

  function validateBeforeSave(isDraft: boolean) {
    if (!selectedChild) {
      return "Child is required";
    }
    if (isDraft) {
      return null;
    }
    if (!direction || !date || !time || !reason.trim() || !subject.trim() || !staffId) {
      return "Please fill the mandatory fields (red).";
    }
    return null;
  }

  function submitCall(isDraft: boolean) {
    const validationError = validateBeforeSave(isDraft);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedChild) return;

    setError("");
    startTransition(async () => {
      const uploadedAttachments: Array<{ filename: string; fileUrl: string }> = [];
      if (attachments.length) {
        try {
          for (const file of attachments) {
            const uploaded = await uploadFileWithPresign({
              branchId: selectedChild.branchId,
              scope: "form-attachment",
              ownerId: selectedChild.id,
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

      const result = await createCallLog({
        childId: selectedChild.id,
        direction,
        date: date || new Date().toISOString().slice(0, 10),
        time: time || undefined,
        reason: reason || undefined,
        subject: subject || undefined,
        remarks: remarks || undefined,
        staffId: staffId || undefined,
        isDraft,
        attachments: uploadedAttachments,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      resetForm();
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    submitCall(false);
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
          <DialogTitle>Create Call Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <Label>Child *</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {childOptions.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.childNumber}: {child.firstName} {child.lastName} - {child.branchName}
                    {child.className ? ` / ${child.className}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={direction}
                onValueChange={(value) => setDirection(value as CallDirectionValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">Incoming</SelectItem>
                  <SelectItem value="OUTGOING">Outgoing</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className={!time ? "text-destructive" : undefined}>Time *</Label>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={!reason ? "text-destructive" : undefined}>Cause of Call *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select cause" />
              </SelectTrigger>
              <SelectContent>
                {causeParents.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={!subject ? "text-destructive" : undefined}>Subject *</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              list="call-subject-options"
            />
            <datalist id="call-subject-options">
              {subjectOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={!staffId ? "text-destructive" : undefined}>
              Teacher Who Filled Report *
            </Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name || staff.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Attachments</Label>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
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
                onChange={(event) => addAttachments(event.target.files)}
              />
            </label>
          </div>

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
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => submitCall(true)}
            >
              {isPending ? "Saving..." : "Save As Draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
