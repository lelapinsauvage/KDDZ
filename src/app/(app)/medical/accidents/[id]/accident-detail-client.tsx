"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Path, type PathValue } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Send, ShieldAlert, User } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MedicalAttachmentsSection,
  type MedicalAttachmentValue,
  type MedicalChildOption,
  useMedicalAttachments,
} from "@/components/medical/medical-attachments-section";
import { createMedicalForm, updateMedicalForm } from "@/lib/actions/medical";

type AccidentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

export interface AccidentFormValues {
  childId: string;
  cause: string;
  accidentDate: string;
  accidentTime: string;
  place: string;
  area: string;
  cameraNumber: string;
  firstAid: string;
  emergencyHospital: string;
  treatment: string;
  teacherId: string;
  status: AccidentStatus;
}

interface AccidentChildOption extends MedicalChildOption {
  legacyId: number | null;
  childNumber: string;
  photo: string | null;
  branchName: string;
  branchLegacyId: number | null;
  classId: string | null;
  className: string;
  classLegacyId: number | null;
}

interface TeacherOption {
  id: string;
  legacyId: number | null;
  name: string;
  branchId: string;
}

interface AccidentDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: AccidentFormValues;
  initialData: Record<string, unknown>;
  childrenList: AccidentChildOption[];
  teacherList: TeacherOption[];
  initialAttachments: MedicalAttachmentValue[];
}

const causePresets = [
  "Fall (the child had fallen)",
  "Bite (the child had a bite by a child)",
  "Hiting (some baby hit the child)",
  "Congnade (l'enfant s'est cong?)",
];

const placePresets = [
  "in the class",
  "On the floor",
  "On the table",
  "On the swing",
  "By another child",
  "Glass",
  "On the slide",
  "On the chair",
  "in the toilet",
];

const firstAidPresets = [
  "Water",
  "Soap",
  "Hydrogen peroxide",
  "Adhesive",
  "bandage",
  "Ice pack",
];

const treatmentPresets = ["x-ray", "Stitch", "fracture"];

const requiredSubmitFields: Array<{ key: keyof AccidentFormValues; label: string }> = [
  { key: "cause", label: "Accident Cause" },
  { key: "accidentDate", label: "Date" },
  { key: "accidentTime", label: "Time" },
  { key: "place", label: "The accident happened" },
  { key: "area", label: "Specify Area" },
  { key: "cameraNumber", label: "Camera Number" },
  { key: "firstAid", label: "First Aid" },
  { key: "emergencyHospital", label: "Emergency Hospital" },
  { key: "treatment", label: "Treatment" },
  { key: "teacherId", label: "Teacher" },
];

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

function statusBadge(status: AccidentStatus) {
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

export function AccidentDetailClient({
  isNew,
  formId,
  formData,
  initialData,
  childrenList,
  teacherList,
  initialAttachments,
}: AccidentDetailClientProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"draft" | "submit" | null>(null);
  const [missingFields, setMissingFields] = useState<Set<keyof AccidentFormValues>>(new Set());
  const attachments = useMedicalAttachments(initialAttachments);

  const {
    register,
    watch,
    setValue,
    getValues,
  } = useForm<AccidentFormValues>({
    defaultValues: formData,
  });

  const selectedChildId = watch("childId");
  const currentStatus = watch("status");
  const selectedChild = useMemo(
    () => childrenList.find((child) => child.id === selectedChildId) ?? null,
    [childrenList, selectedChildId],
  );
  const selectedChildPhoto = childPhotoSrc(selectedChild?.photo ?? null);

  const visibleTeachers = useMemo(() => {
    if (!selectedChild?.branchId) return teacherList;
    const branchTeachers = teacherList.filter((teacher) => teacher.branchId === selectedChild.branchId);
    return branchTeachers.length ? branchTeachers : teacherList;
  }, [selectedChild?.branchId, teacherList]);

  function clearMissing(field: keyof AccidentFormValues) {
    setMissingFields((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field);
      return next;
    });
  }

  function setField<K extends Path<AccidentFormValues>>(field: K, value: PathValue<AccidentFormValues, K>) {
    setValue(field, value, { shouldDirty: true });
    clearMissing(field as keyof AccidentFormValues);
  }

  function buildPayload(data: AccidentFormValues, status: AccidentStatus) {
    const child = childrenList.find((item) => item.id === data.childId) ?? selectedChild;
    const teacher = teacherList.find((item) => item.id === data.teacherId);

    return {
      ...initialData,
      child_id: child?.legacyId ?? legacyNumber(initialData, "child_id"),
      branch_id: child?.branchLegacyId ?? legacyNumber(initialData, "branch_id"),
      class_id: child?.classLegacyId ?? legacyNumber(initialData, "class_id"),
      teacher_id: teacher?.legacyId ?? legacyNumber(initialData, "teacher_id"),
      modernChildId: data.childId,
      modernBranchId: child?.branchId ?? null,
      modernClassId: child?.classId ?? null,
      modernTeacherId: data.teacherId,
      cause: data.cause,
      accidentCause: data.cause,
      accident_date: data.accidentDate,
      date: data.accidentDate,
      accident_time: data.accidentTime,
      time: data.accidentTime,
      place: data.place,
      location: data.place,
      area: data.area,
      specifyArea: data.area,
      camnum: data.cameraNumber,
      cameraNumber: data.cameraNumber,
      firstaid: data.firstAid,
      firstAid: data.firstAid,
      firstAidGiven: data.firstAid,
      em_hospital: data.emergencyHospital,
      emergencyHospital: data.emergencyHospital === "Yes",
      treatment: data.treatment,
      is_rep_draft: status === "DRAFT" ? 1 : 0,
    };
  }

  function validateForSubmit(data: AccidentFormValues) {
    const missing = new Set<keyof AccidentFormValues>();
    if (!data.childId) missing.add("childId");
    requiredSubmitFields.forEach((field) => {
      if (!String(data[field.key] ?? "").trim()) missing.add(field.key);
    });
    setMissingFields(missing);

    if (missing.size > 0) {
      const labels = requiredSubmitFields
        .filter((field) => missing.has(field.key))
        .map((field) => field.label)
        .join(", ");
      toast.error(`Please fill the mandatory fields: ${labels}`);
      return false;
    }
    return true;
  }

  async function save(status: AccidentStatus) {
    const data = getValues();
    if (!data.childId) {
      setMissingFields(new Set(["childId"]));
      toast.error("Select a child before saving the accident report.");
      return;
    }
    if (status === "SUBMITTED" && !validateForSubmit(data)) return;

    const action = status === "DRAFT" ? "draft" : "submit";
    setBusyAction(action);
    setValue("status", status, { shouldDirty: true });

    try {
      const attachmentPayload = await attachments.resolveAttachmentPayload({
        childrenList,
        childId: data.childId,
        formId,
      });
      if (!attachmentPayload) return;

      const payload = buildPayload(data, status);
      const result = isNew
        ? await createMedicalForm({
            childId: data.childId,
            formType: "ACCIDENTS",
            status,
            data: payload,
            attachments: attachmentPayload,
          })
        : await updateMedicalForm(formId!, {
            childId: data.childId,
            formType: "ACCIDENTS",
            status,
            data: payload,
            attachments: attachmentPayload,
            removeAttachmentIds: attachments.removedAttachmentIds,
          });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(status === "DRAFT" ? "Accident report saved as draft." : "Accident report has been submitted.");
      if (isNew && "formId" in result && result.formId) {
        router.push(`/medical/accidents/${result.formId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save accident report.");
    } finally {
      setBusyAction(null);
    }
  }

  const busy = busyAction !== null;

  return (
    <>
      <PageHeader
        title="Accident Report"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Accident Reports", href: "/medical/accidents" },
          { label: isNew ? "New Accident Report" : selectedChild?.name ?? "Accident Report" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/medical/accidents">
              <ArrowLeft className="size-4" />
              Back to List
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(currentStatus)}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => save("DRAFT")}
            >
              {busyAction === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save As Draft
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => save("SUBMITTED")}
            >
              {busyAction === "submit" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Save Accident Report
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_220px] md:p-5">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Child <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedChildId}
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Child #</p>
                  <p className="font-medium">{selectedChild?.childNumber ?? "—"}</p>
                </div>
                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{selectedChild?.branchName ?? "—"}</p>
                </div>
                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Report</p>
                  <p className="font-medium">{isNew ? "New" : "Existing"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded border bg-muted/20 p-4">
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
            <CardHeader className="border-b bg-[#d64635] text-white">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" />
                Accident Cause
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
              <div className="space-y-2">
                <Label>Accident Cause <span className="text-destructive">*</span></Label>
                <Input
                  list="accident-cause-list"
                  placeholder="Select/Add"
                  className={inputClass(missingFields.has("cause"))}
                  {...register("cause", { onChange: () => clearMissing("cause") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  className={inputClass(missingFields.has("accidentDate"))}
                  {...register("accidentDate", { onChange: () => clearMissing("accidentDate") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  className={inputClass(missingFields.has("accidentTime"))}
                  {...register("accidentTime", { onChange: () => clearMissing("accidentTime") })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-[#327ad5] text-white">
              <CardTitle className="text-base">Accident Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
              <div className="space-y-2">
                <Label>The accident happened <span className="text-destructive">*</span></Label>
                <Input
                  list="accident-place-list"
                  placeholder="Select/Add"
                  className={inputClass(missingFields.has("place"))}
                  {...register("place", { onChange: () => clearMissing("place") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Specify Area <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Specify the area"
                  className={inputClass(missingFields.has("area"))}
                  {...register("area", { onChange: () => clearMissing("area") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Camera Number <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Cam #"
                  className={inputClass(missingFields.has("cameraNumber"))}
                  {...register("cameraNumber", { onChange: () => clearMissing("cameraNumber") })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-[#1caf9a] text-white">
              <CardTitle className="text-base">First Aid</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
              <div className="space-y-2">
                <Label>First Aid <span className="text-destructive">*</span></Label>
                <Input
                  list="first-aid-list"
                  placeholder="Select/Add"
                  className={inputClass(missingFields.has("firstAid"))}
                  {...register("firstAid", { onChange: () => clearMissing("firstAid") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Hospital <span className="text-destructive">*</span></Label>
                <Select
                  value={watch("emergencyHospital")}
                  onValueChange={(value) => setField("emergencyHospital", value)}
                >
                  <SelectTrigger className={inputClass(missingFields.has("emergencyHospital"))}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Treatment <span className="text-destructive">*</span></Label>
                <Input
                  list="treatment-list"
                  placeholder="Select/Add"
                  className={inputClass(missingFields.has("treatment"))}
                  {...register("treatment", { onChange: () => clearMissing("treatment") })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>The teacher who filled the report is <span className="text-destructive">*</span></Label>
                <Select
                  value={watch("teacherId")}
                  onValueChange={(value) => setField("teacherId", value)}
                >
                  <SelectTrigger className={inputClass(missingFields.has("teacherId"))}>
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

        <datalist id="accident-cause-list">
          {causePresets.map((cause) => (
            <option key={cause} value={cause} />
          ))}
        </datalist>
        <datalist id="accident-place-list">
          {placePresets.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>
        <datalist id="first-aid-list">
          {firstAidPresets.map((firstAid) => (
            <option key={firstAid} value={firstAid} />
          ))}
        </datalist>
        <datalist id="treatment-list">
          {treatmentPresets.map((treatment) => (
            <option key={treatment} value={treatment} />
          ))}
        </datalist>
      </div>
    </>
  );
}
