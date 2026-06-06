"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MedicalAttachmentsSection,
  type MedicalAttachmentValue,
  type MedicalChildOption,
  useMedicalAttachments,
} from "@/components/medical/medical-attachments-section";
import { createMedicalForm, updateMedicalForm } from "@/lib/actions/medical";

export type ConditionStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
export type ConditionGroupKey =
  | "hearing"
  | "speaking"
  | "sight"
  | "respiration"
  | "worms"
  | "heart"
  | "arteries"
  | "urine"
  | "epilepsy"
  | "migraine"
  | "eating"
  | "blood"
  | "health";

type BusyAction = "draft" | "submit" | null;

export interface ConditionAssessmentRow {
  id: string;
  result: "" | "Yes" | "No";
  caseValue: string;
  remarks: string;
  date: string;
}

export interface ConditionFormValues {
  childId: string;
  assessmentDate: string;
  generalHealth: string;
  groups: Record<ConditionGroupKey, ConditionAssessmentRow[]>;
  status: ConditionStatus;
}

interface ConditionChildOption extends MedicalChildOption {
  legacyId: number | null;
  childNumber: string;
  dateOfBirth: string;
  gender: string;
  photo: string | null;
  branchName: string;
  branchLegacyId: number | null;
  classId: string | null;
  className: string;
  classLegacyId: number | null;
}

interface ConditionDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: ConditionFormValues;
  initialData: Record<string, unknown>;
  childrenList: ConditionChildOption[];
  initialAttachments: MedicalAttachmentValue[];
  legacyFormId?: number | null;
}

interface ConditionGroupConfig {
  key: ConditionGroupKey;
  label: string;
  hasCase: boolean;
  casePresets: string[];
}

const conditionGroups: ConditionGroupConfig[] = [
  { key: "hearing", label: "Hearing", hasCase: false, casePresets: [] },
  { key: "speaking", label: "Speaking", hasCase: false, casePresets: [] },
  { key: "sight", label: "Sight", hasCase: false, casePresets: [] },
  { key: "respiration", label: "Respiration", hasCase: false, casePresets: [] },
  { key: "worms", label: "Worms", hasCase: false, casePresets: [] },
  { key: "heart", label: "Heart", hasCase: false, casePresets: [] },
  { key: "arteries", label: "Arteries", hasCase: false, casePresets: [] },
  { key: "urine", label: "Urine", hasCase: false, casePresets: [] },
  { key: "epilepsy", label: "Epilepsy", hasCase: false, casePresets: [] },
  { key: "migraine", label: "Migraine", hasCase: false, casePresets: [] },
  {
    key: "eating",
    label: "Eating Disorder",
    hasCase: true,
    casePresets: ["No", "Obeisity", "Over Eating", "Normal"],
  },
  {
    key: "blood",
    label: "Chronic Blood Problems",
    hasCase: true,
    casePresets: ["No", "Thalasemia", "Hemophelia", "Leukemia", "Normal"],
  },
  { key: "health", label: "Other Health Problems", hasCase: true, casePresets: ["No"] },
];

const generalHealthOptions = ["Excellent", "Good", "Fair", "Week"];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function legacyNumber(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function statusBadge(status: ConditionStatus) {
  if (status === "DRAFT") {
    return <Badge className="border-transparent bg-[#c29d0b] text-white">Draft</Badge>;
  }
  if (status === "REVIEWED") {
    return <Badge className="border-transparent bg-[#327ad5] text-white">Reviewed</Badge>;
  }
  return <Badge className="border-transparent bg-[#008200] text-white">Submitted</Badge>;
}

function inputClass(isMissing: boolean) {
  return isMissing
    ? "border-destructive bg-destructive/5 text-destructive focus-visible:ring-destructive"
    : "";
}

function missingKey(group: string, rowId: string, field: string) {
  return `${group}.${rowId}.${field}`;
}

function newAssessmentRow(group: ConditionGroupKey): ConditionAssessmentRow {
  return {
    id: `${group}-${crypto.randomUUID()}`,
    result: "",
    caseValue: "",
    remarks: "",
    date: todayString(),
  };
}

function rowsToLegacy(rows: ConditionAssessmentRow[], hasCase: boolean) {
  return rows.map((row) => {
    const legacyRow = {
      Asstype: row.result,
      Assdate: row.date,
      Remarks: row.remarks,
    };
    return hasCase ? { ...legacyRow, Asscas: row.caseValue } : legacyRow;
  });
}

function groupValuesToLegacy(groups: ConditionFormValues["groups"]) {
  return Object.fromEntries(
    conditionGroups.map((group) => [
      `${group.key}_values`,
      rowsToLegacy(groups[group.key], group.hasCase),
    ]),
  );
}

interface AssessmentGroupSectionProps {
  config: ConditionGroupConfig;
  rows: ConditionAssessmentRow[];
  missingFields: Set<string>;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onChange: (rowId: string, patch: Partial<ConditionAssessmentRow>) => void;
}

function AssessmentGroupSection({
  config,
  rows,
  missingFields,
  disabled,
  onAdd,
  onRemove,
  onChange,
}: AssessmentGroupSectionProps) {
  const listId = `condition-${config.key}-cases`;

  return (
    <div className="space-y-3 rounded-sm border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{config.label}</h3>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {config.hasCase ? (
        <datalist id={listId}>
          {config.casePresets.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-sm border border-dashed p-3 text-sm text-muted-foreground">No rows</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={
                config.hasCase
                  ? "grid gap-3 rounded-sm bg-muted/30 p-3 md:grid-cols-[140px_1fr_1fr_150px_auto]"
                  : "grid gap-3 rounded-sm bg-muted/30 p-3 md:grid-cols-[140px_1fr_150px_auto]"
              }
            >
              <div className="space-y-2">
                <Label>
                  {config.label} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={row.result}
                  disabled={disabled}
                  onValueChange={(value) =>
                    onChange(row.id, { result: value as ConditionAssessmentRow["result"] })
                  }
                >
                  <SelectTrigger
                    className={inputClass(missingFields.has(missingKey(config.key, row.id, "result")))}
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.hasCase ? (
                <div className="space-y-2">
                  <Label>
                    Case <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    list={listId}
                    value={row.caseValue}
                    placeholder="Add/Select Case"
                    disabled={disabled}
                    className={inputClass(missingFields.has(missingKey(config.key, row.id, "caseValue")))}
                    onChange={(event) => onChange(row.id, { caseValue: event.target.value })}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input
                  value={row.remarks}
                  placeholder="Add Remarks"
                  disabled={disabled}
                  onChange={(event) => onChange(row.id, { remarks: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={row.date}
                  readOnly
                  className={inputClass(missingFields.has(missingKey(config.key, row.id, "date")))}
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onRemove(row.id)}
                  aria-label={`Remove ${config.label} row ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConditionDetailClient({
  isNew,
  formId,
  formData,
  initialData,
  childrenList,
  initialAttachments,
  legacyFormId,
}: ConditionDetailClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<ConditionFormValues>(formData);
  const [status, setStatus] = useState<ConditionStatus>(formData.status);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const attachments = useMedicalAttachments(initialAttachments);

  const selectedChild = useMemo(
    () => childrenList.find((child) => child.id === values.childId) ?? null,
    [childrenList, values.childId],
  );
  const selectedChildPhoto = childPhotoSrc(selectedChild?.photo ?? null);
  const busy = busyAction !== null;
  const canSaveDraft = status === "DRAFT";

  function clearMissing(keys: string[]) {
    setMissingFields((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.delete(key));
      return next;
    });
  }

  function setField<K extends keyof ConditionFormValues>(
    field: K,
    value: ConditionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    clearMissing([field]);
  }

  function updateGroupRow(
    group: ConditionGroupKey,
    rowId: string,
    patch: Partial<ConditionAssessmentRow>,
  ) {
    setValues((current) => ({
      ...current,
      groups: {
        ...current.groups,
        [group]: current.groups[group].map((row) =>
          row.id === rowId ? { ...row, ...patch } : row,
        ),
      },
    }));
    clearMissing(Object.keys(patch).map((field) => missingKey(group, rowId, field)));
  }

  function addGroupRow(group: ConditionGroupKey) {
    setValues((current) => ({
      ...current,
      groups: {
        ...current.groups,
        [group]: [...current.groups[group], newAssessmentRow(group)],
      },
    }));
  }

  function removeGroupRow(group: ConditionGroupKey, rowId: string) {
    setValues((current) => ({
      ...current,
      groups: {
        ...current.groups,
        [group]: current.groups[group].filter((row) => row.id !== rowId),
      },
    }));
  }

  function buildPayload(nextStatus: ConditionStatus) {
    const child = childrenList.find((item) => item.id === values.childId) ?? selectedChild;
    const formNumber = legacyFormId ?? legacyNumber(initialData, "form_id") ?? legacyNumber(initialData, "_oldId");

    return {
      ...initialData,
      child_id: child?.legacyId ?? legacyNumber(initialData, "child_id"),
      branch_id: child?.branchLegacyId ?? legacyNumber(initialData, "branch_id"),
      class_id: child?.classLegacyId ?? legacyNumber(initialData, "class_id"),
      form_id: formNumber,
      modernChildId: values.childId,
      modernBranchId: child?.branchId ?? null,
      modernClassId: child?.classId ?? null,
      assess: values.generalHealth,
      general_health: values.generalHealth,
      generalHealth: values.generalHealth,
      formdate: values.assessmentDate,
      asses_date: values.assessmentDate,
      assessmentDate: values.assessmentDate,
      conditionType: "Health Assessment",
      severity: values.generalHealth,
      diagnosisDate: values.assessmentDate,
      assessmentGroups: values.groups,
      ...groupValuesToLegacy(values.groups),
      is_rep_draft: nextStatus === "DRAFT" ? 1 : 0,
    };
  }

  function validateSubmit() {
    const missing = new Set<string>();
    if (!values.childId) missing.add("childId");
    if (!values.assessmentDate.trim()) missing.add("assessmentDate");
    if (!values.generalHealth.trim()) missing.add("generalHealth");

    conditionGroups.forEach((group) => {
      values.groups[group.key].forEach((row) => {
        if (!row.result.trim()) missing.add(missingKey(group.key, row.id, "result"));
        if (!row.date.trim()) missing.add(missingKey(group.key, row.id, "date"));
        if (group.hasCase && !row.caseValue.trim()) {
          missing.add(missingKey(group.key, row.id, "caseValue"));
        }
      });
    });

    setMissingFields(missing);
    if (missing.size > 0) {
      toast.error("Please fill the mandatory fields marked in red.");
      return false;
    }
    return true;
  }

  async function save(nextStatus: ConditionStatus) {
    if (!values.childId) {
      setMissingFields(new Set(["childId"]));
      toast.error("Select a child before saving the medical form.");
      return;
    }
    if (nextStatus === "SUBMITTED" && !validateSubmit()) return;

    setBusyAction(nextStatus === "DRAFT" ? "draft" : "submit");
    try {
      const attachmentPayload = await attachments.resolveAttachmentPayload({
        childrenList,
        childId: values.childId,
        formId,
      });
      if (!attachmentPayload) return;

      const result = isNew
        ? await createMedicalForm({
            childId: values.childId,
            formType: "CONDITIONS",
            status: nextStatus,
            data: buildPayload(nextStatus),
            attachments: attachmentPayload,
          })
        : await updateMedicalForm(formId!, {
            childId: values.childId,
            formType: "CONDITIONS",
            status: nextStatus,
            data: buildPayload(nextStatus),
            attachments: attachmentPayload,
            removeAttachmentIds: attachments.removedAttachmentIds,
          });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      setStatus(nextStatus);
      setValues((current) => ({ ...current, status: nextStatus }));
      toast.success(nextStatus === "DRAFT" ? "Medical form saved as draft." : "Medical form has been saved.");

      if (isNew && "formId" in result && result.formId) {
        router.push(`/medical/conditions/${result.formId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save medical form.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Medical Form - General Information"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions", href: "/medical/conditions" },
          { label: isNew ? "New Assessment" : selectedChild?.name ?? "Assessment" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/medical/conditions">
              <ArrowLeft className="size-4" />
              Back to List
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(status)}
            {canSaveDraft ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => save("DRAFT")}>
                {busyAction === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save As Draft
              </Button>
            ) : null}
            <Button type="button" disabled={busy} onClick={() => save("SUBMITTED")}>
              {busyAction === "submit" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_220px] md:p-5">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Child <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={values.childId}
                    disabled={!isNew || busy}
                    onValueChange={(value) => setField("childId", value)}
                  >
                    <SelectTrigger className={inputClass(missingFields.has("childId"))}>
                      <SelectValue placeholder="Select child" />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenList.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.childNumber} - {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input value={selectedChild?.className ?? ""} readOnly />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-sm border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Child #</p>
                  <p className="font-medium">{selectedChild?.childNumber ?? "-"}</p>
                </div>
                <div className="rounded-sm border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{selectedChild?.branchName ?? "-"}</p>
                </div>
                <div className="rounded-sm border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium">{selectedChild?.gender ?? "-"}</p>
                </div>
                <div className="rounded-sm border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Form #</p>
                  <p className="font-medium">{legacyFormId ?? (isNew ? "New" : "-")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-sm border bg-muted/20 p-4">
              {selectedChildPhoto ? (
                <div className="relative size-24 overflow-hidden rounded-full border bg-muted">
                  <Image
                    src={selectedChildPhoto}
                    alt={selectedChild?.name ?? "Child"}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border bg-muted">
                  <User className="size-8 text-muted-foreground" />
                </div>
              )}
              <p className="text-center text-sm font-medium">{selectedChild?.name ?? "Name"}</p>
            </div>
          </CardContent>
        </Card>

        <form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5" />
                Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Assessment Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={values.assessmentDate}
                    disabled={busy}
                    className={inputClass(missingFields.has("assessmentDate"))}
                    onChange={(event) => setField("assessmentDate", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    How do you assess General Health of your child?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={values.generalHealth}
                    disabled={busy}
                    onValueChange={(value) => setField("generalHealth", value)}
                  >
                    <SelectTrigger className={inputClass(missingFields.has("generalHealth"))}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {generalHealthOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {conditionGroups.map((group) => (
                  <AssessmentGroupSection
                    key={group.key}
                    config={group}
                    rows={values.groups[group.key]}
                    missingFields={missingFields}
                    disabled={busy}
                    onAdd={() => addGroupRow(group.key)}
                    onRemove={(rowId) => removeGroupRow(group.key, rowId)}
                    onChange={(rowId, patch) => updateGroupRow(group.key, rowId, patch)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Supporting Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Attach insurance card, disability report, medical report, medical prescription, surgical report, or related files.
              </p>
            </CardContent>
          </Card>

          <MedicalAttachmentsSection
            existingAttachments={attachments.existingAttachments}
            pendingAttachments={attachments.pendingAttachments}
            disabled={busy}
            onExistingTitleChange={attachments.updateExistingAttachmentTitle}
            onRemoveExisting={attachments.removeExistingAttachment}
            onAddPending={attachments.addPendingAttachments}
            onPendingTitleChange={attachments.updatePendingAttachmentTitle}
            onRemovePending={attachments.removePendingAttachment}
          />
        </form>
      </div>
    </>
  );
}
