"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Stethoscope,
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
import { Textarea } from "@/components/ui/textarea";
import {
  MedicalAttachmentsSection,
  type MedicalAttachmentValue,
  type MedicalChildOption,
  useMedicalAttachments,
} from "@/components/medical/medical-attachments-section";
import { createMedicalForm, updateMedicalForm } from "@/lib/actions/medical";

type GeneralStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
type BusyAction = "draft" | "submit" | null;

export interface GeneralDoctorRow {
  id: string;
  firstName: string;
  lastName: string;
  mouhafaza: string;
  quadaa: string;
  region: string;
  city: string;
  street: string;
  building: string;
  phone: string;
  remarks: string;
  latitude: string;
  longitude: string;
}

export interface MedicalStatusRow {
  id: string;
  type: string;
  date: string;
}

export interface MedicationStatusRow extends MedicalStatusRow {
  time: string;
  expiry: string;
}

export interface GeneralFormValues {
  childId: string;
  hasInsurance: "" | "Yes" | "No";
  insuranceType: string;
  insuranceExpiry: string;
  doctorRows: GeneralDoctorRow[];
  disabilityRows: MedicalStatusRow[];
  medicalCaseRows: MedicalStatusRow[];
  medicationRows: MedicationStatusRow[];
  surgicalRows: MedicalStatusRow[];
  allergyRows: MedicalStatusRow[];
  status: GeneralStatus;
}

interface GeneralChildOption extends MedicalChildOption {
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

export interface GeneralDoctorOption extends GeneralDoctorRow {
  legacyId: number | null;
  name: string;
  branchId: string;
}

interface GeneralDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: GeneralFormValues;
  initialData: Record<string, unknown>;
  childrenList: GeneralChildOption[];
  doctorList: GeneralDoctorOption[];
  initialAttachments: MedicalAttachmentValue[];
  legacyFormId?: number | null;
}

const insuranceTypes = [
  "NSSF",
  "Private",
  "Governmental",
  "Syndicate",
  "Private with NSSF",
];

const disabilityPresets = ["No", "Motion", "Mental", "Visual"];
const medicalCasePresets = ["No", "Diabetes", "Lukeimia", "Astma"];
const medicationPresets = ["No", "Panadol", "Insuline"];
const surgicalPresets = ["No", "Hernia"];
const allergyPresets = ["No", "Chocolat", "Glutin Free"];

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

function statusBadge(status: GeneralStatus) {
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

function emptyDoctorRow(): GeneralDoctorRow {
  return {
    id: "doctor-1",
    firstName: "",
    lastName: "",
    mouhafaza: "",
    quadaa: "",
    region: "",
    city: "",
    street: "",
    building: "",
    phone: "",
    remarks: "",
    latitude: "",
    longitude: "",
  };
}

function newStatusRow(group: string): MedicalStatusRow {
  return { id: `${group}-${crypto.randomUUID()}`, type: "", date: todayString() };
}

function newMedicationRow(): MedicationStatusRow {
  return {
    id: `medication-${crypto.randomUUID()}`,
    type: "",
    date: todayString(),
    time: "",
    expiry: "",
  };
}

function roundLegacyMedicationTime(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hour, minute] = time.split(":");
  const roundedMinute = (10 * Math.round(Number(minute) / 10)) % 60;
  return `${hour}:${roundedMinute.toString().padStart(2, "0")}`;
}

function doctorToLegacy(row: GeneralDoctorRow) {
  return {
    Dfname: row.firstName,
    Dlname: row.lastName,
    Mouhafaza: row.mouhafaza,
    Quadaa: row.quadaa,
    Region: row.region,
    City: row.city,
    Street: row.street,
    Building: row.building,
    Address_phone: row.phone,
    Address_remarks: row.remarks,
    Latitude: row.latitude,
    Longitude: row.longitude,
  };
}

function simpleRowsToLegacy(
  rows: MedicalStatusRow[],
  typeKey: "Distype" | "Casetype" | "Surgtype" | "Allergtype",
  dateKey: "Disdate" | "Casedate" | "Surgdate" | "Allergdate",
) {
  return rows.map((row) => ({
    [typeKey]: row.type,
    [dateKey]: row.date,
  }));
}

function medicationRowsToLegacy(rows: MedicationStatusRow[]) {
  return rows.map((row) => ({
    Medtype: row.type,
    Meddate: row.date,
    Medtime: roundLegacyMedicationTime(row.time),
    Medtimeexp: row.expiry,
  }));
}

interface StatusRowsSectionProps {
  title: string;
  question: string;
  rows: MedicalStatusRow[];
  group: string;
  presets: string[];
  listId: string;
  missingFields: Set<string>;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onChange: (rowId: string, patch: Partial<MedicalStatusRow>) => void;
}

function StatusRowsSection({
  title,
  question,
  rows,
  group,
  presets,
  listId,
  missingFields,
  disabled,
  onAdd,
  onRemove,
  onChange,
}: StatusRowsSectionProps) {
  return (
    <div className="space-y-3 rounded-sm border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <datalist id={listId}>
        {presets.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {rows.length === 0 ? (
        <div className="rounded-sm border border-dashed p-3 text-sm text-muted-foreground">No rows</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-sm bg-muted/30 p-3 md:grid-cols-[1fr_180px_auto]">
              <div className="space-y-2">
                <Label>
                  {question} <span className="text-destructive">*</span>
                </Label>
                <Input
                  list={listId}
                  value={row.type}
                  placeholder="Select/Add"
                  disabled={disabled}
                  className={inputClass(missingFields.has(missingKey(group, row.id, "type")))}
                  onChange={(event) => onChange(row.id, { type: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={row.date}
                  readOnly
                  className={inputClass(missingFields.has(missingKey(group, row.id, "date")))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onRemove(row.id)}
                  aria-label={`Remove ${title} row ${index + 1}`}
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

interface MedicationRowsSectionProps {
  rows: MedicationStatusRow[];
  missingFields: Set<string>;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onChange: (rowId: string, patch: Partial<MedicationStatusRow>) => void;
}

function MedicationRowsSection({
  rows,
  missingFields,
  disabled,
  onAdd,
  onRemove,
  onChange,
}: MedicationRowsSectionProps) {
  return (
    <div className="space-y-3 rounded-sm border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Medication</h3>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <datalist id="general-form-medication-presets">
        {medicationPresets.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {rows.length === 0 ? (
        <div className="rounded-sm border border-dashed p-3 text-sm text-muted-foreground">No rows</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-sm bg-muted/30 p-3 md:grid-cols-[1fr_140px_160px_160px_auto]">
              <div className="space-y-2">
                <Label>
                  Does the child take any Medication? <span className="text-destructive">*</span>
                </Label>
                <Input
                  list="general-form-medication-presets"
                  value={row.type}
                  placeholder="Select/Add"
                  disabled={disabled}
                  className={inputClass(missingFields.has(missingKey("medication", row.id, "type")))}
                  onChange={(event) => onChange(row.id, { type: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={row.time}
                  disabled={disabled}
                  onChange={(event) => onChange(row.id, { time: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={row.expiry}
                  disabled={disabled}
                  onChange={(event) => onChange(row.id, { expiry: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={row.date}
                  readOnly
                  className={inputClass(missingFields.has(missingKey("medication", row.id, "date")))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onRemove(row.id)}
                  aria-label={`Remove medication row ${index + 1}`}
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

export function GeneralDetailClient({
  isNew,
  formId,
  formData,
  initialData,
  childrenList,
  doctorList,
  initialAttachments,
  legacyFormId,
}: GeneralDetailClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<GeneralFormValues>(formData);
  const [status, setStatus] = useState<GeneralStatus>(formData.status);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const attachments = useMedicalAttachments(initialAttachments);

  const selectedChild = useMemo(
    () => childrenList.find((child) => child.id === values.childId) ?? null,
    [childrenList, values.childId],
  );
  const selectedChildPhoto = childPhotoSrc(selectedChild?.photo ?? null);

  const visibleDoctors = useMemo(() => {
    if (!selectedChild?.branchId) return doctorList;
    const branchDoctors = doctorList.filter((doctor) => doctor.branchId === selectedChild.branchId);
    return branchDoctors.length ? branchDoctors : doctorList;
  }, [doctorList, selectedChild?.branchId]);

  const busy = busyAction !== null;
  const canSaveDraft = status === "DRAFT";

  function clearMissing(keys: string[]) {
    setMissingFields((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.delete(key));
      return next;
    });
  }

  function setField<K extends keyof GeneralFormValues>(field: K, value: GeneralFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    clearMissing([field]);
  }

  function updateDoctorRow(rowId: string, patch: Partial<GeneralDoctorRow>) {
    setValues((current) => ({
      ...current,
      doctorRows: current.doctorRows.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
    clearMissing(Object.keys(patch).map((field) => missingKey("doctor", rowId, field)));
  }

  function updateSimpleRows(
    field: "disabilityRows" | "medicalCaseRows" | "surgicalRows" | "allergyRows",
    group: string,
    rowId: string,
    patch: Partial<MedicalStatusRow>,
  ) {
    setValues((current) => ({
      ...current,
      [field]: current[field].map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
    clearMissing(Object.keys(patch).map((key) => missingKey(group, rowId, key)));
  }

  function updateMedicationRow(rowId: string, patch: Partial<MedicationStatusRow>) {
    setValues((current) => ({
      ...current,
      medicationRows: current.medicationRows.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
    clearMissing(Object.keys(patch).map((key) => missingKey("medication", rowId, key)));
  }

  function removeSimpleRow(field: "disabilityRows" | "medicalCaseRows" | "surgicalRows" | "allergyRows", rowId: string) {
    setValues((current) => ({
      ...current,
      [field]: current[field].filter((row) => row.id !== rowId),
    }));
  }

  function applyDoctor(doctorId: string) {
    const doctor = doctorList.find((item) => item.id === doctorId);
    setSelectedDoctorId(doctorId);
    if (!doctor) return;
    setValues((current) => ({
      ...current,
      doctorRows: [{ ...doctor, id: current.doctorRows[0]?.id ?? "doctor-1" }],
    }));
    clearMissing([
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "firstName"),
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "lastName"),
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "city"),
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "street"),
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "building"),
      missingKey("doctor", values.doctorRows[0]?.id ?? "doctor-1", "phone"),
    ]);
  }

  function buildPayload(nextStatus: GeneralStatus) {
    const child = childrenList.find((item) => item.id === values.childId) ?? selectedChild;
    const doctorRows = values.doctorRows.length ? values.doctorRows : [emptyDoctorRow()];
    const firstDoctor = doctorRows[0];
    const hasInsurance = values.hasInsurance;
    const insuranceType = hasInsurance === "Yes" ? values.insuranceType : "";
    const insuranceExpiry = hasInsurance === "Yes" ? values.insuranceExpiry : "";

    return {
      ...initialData,
      child_id: child?.legacyId ?? legacyNumber(initialData, "child_id"),
      branch_id: child?.branchLegacyId ?? legacyNumber(initialData, "branch_id"),
      class_id: child?.classLegacyId ?? legacyNumber(initialData, "class_id"),
      form_id: legacyFormId ?? legacyNumber(initialData, "form_id"),
      modernChildId: values.childId,
      modernBranchId: child?.branchId ?? null,
      modernClassId: child?.classId ?? null,
      has_insurance: hasInsurance,
      hasInsurance: hasInsurance === "Yes",
      insurance: insuranceType,
      ins: insuranceType,
      insuranceType,
      ins_expdate: insuranceExpiry,
      insexp: insuranceExpiry,
      insuranceExpiry,
      fdfname: firstDoctor.firstName,
      fdlname: firstDoctor.lastName,
      muhafaza: firstDoctor.mouhafaza,
      quadaa: firstDoctor.quadaa,
      region: firstDoctor.region,
      city: firstDoctor.city,
      street: firstDoctor.street,
      building: firstDoctor.building,
      tel: firstDoctor.phone,
      remarks: firstDoctor.remarks,
      latitude: firstDoctor.latitude,
      longitude: firstDoctor.longitude,
      doctor: [firstDoctor.firstName, firstDoctor.lastName].filter(Boolean).join(" "),
      address_values: doctorRows.map(doctorToLegacy),
      relative_values: simpleRowsToLegacy(values.disabilityRows, "Distype", "Disdate"),
      case_values: simpleRowsToLegacy(values.medicalCaseRows, "Casetype", "Casedate"),
      med_values: medicationRowsToLegacy(values.medicationRows),
      surg_values: simpleRowsToLegacy(values.surgicalRows, "Surgtype", "Surgdate"),
      allerg_values: simpleRowsToLegacy(values.allergyRows, "Allergtype", "Allergdate"),
      is_rep_draft: nextStatus === "DRAFT" ? 1 : 0,
    };
  }

  function validateSubmit() {
    const missing = new Set<string>();
    if (!values.childId) missing.add("childId");

    const doctorRows = values.doctorRows.length ? values.doctorRows : [emptyDoctorRow()];
    doctorRows.forEach((row) => {
      ["firstName", "lastName", "city", "street", "building", "phone"].forEach((field) => {
        if (!String(row[field as keyof GeneralDoctorRow] ?? "").trim()) {
          missing.add(missingKey("doctor", row.id, field));
        }
      });
    });

    if (!values.hasInsurance) missing.add("hasInsurance");
    if (values.hasInsurance === "Yes") {
      if (!values.insuranceType.trim()) missing.add("insuranceType");
      if (!values.insuranceExpiry.trim()) missing.add("insuranceExpiry");
    }

    const checkSimpleRows = (rows: MedicalStatusRow[], group: string) => {
      rows.forEach((row) => {
        if (!row.type.trim()) missing.add(missingKey(group, row.id, "type"));
        if (!row.date.trim()) missing.add(missingKey(group, row.id, "date"));
      });
    };

    checkSimpleRows(values.disabilityRows, "disability");
    checkSimpleRows(values.medicalCaseRows, "medical-case");
    checkSimpleRows(values.surgicalRows, "surgical");
    checkSimpleRows(values.allergyRows, "allergy");
    values.medicationRows.forEach((row) => {
      if (!row.type.trim()) missing.add(missingKey("medication", row.id, "type"));
      if (!row.date.trim()) missing.add(missingKey("medication", row.id, "date"));
    });

    setMissingFields(missing);
    if (missing.size > 0) {
      toast.error("Please fill the mandatory fields marked in red.");
      return false;
    }
    return true;
  }

  async function save(nextStatus: GeneralStatus) {
    if (!values.childId) {
      setMissingFields(new Set(["childId"]));
      toast.error("Select a child before saving the general form.");
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
            formType: "GENERAL",
            status: nextStatus,
            data: buildPayload(nextStatus),
            attachments: attachmentPayload,
          })
        : await updateMedicalForm(formId!, {
            childId: values.childId,
            formType: "GENERAL",
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
      toast.success(nextStatus === "DRAFT" ? "General form saved as draft." : "General form has been saved.");

      if (isNew && "formId" in result && result.formId) {
        router.push(`/medical/general/${result.formId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save general form.");
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
          { label: "General Info", href: "/medical/general" },
          { label: isNew ? "New Child General Form" : selectedChild?.name ?? "General Form" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/medical/general">
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="size-5" />
                  Dr. Infos
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setSelectedDoctorId("");
                    setValues((current) => ({ ...current, doctorRows: [emptyDoctorRow()] }));
                  }}
                >
                  Clear Doctor Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Saved Drs</Label>
                <Select value={selectedDoctorId} disabled={busy} onValueChange={applyDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select saved doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.legacyId ? `${doctor.legacyId} - ` : ""}
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(values.doctorRows.length ? values.doctorRows : [emptyDoctorRow()]).map((row) => (
                <div key={row.id} className="space-y-4 rounded-sm border bg-muted/20 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Dr. First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.firstName}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "firstName")))}
                        onChange={(event) => updateDoctorRow(row.id, { firstName: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Dr. Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.lastName}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "lastName")))}
                        onChange={(event) => updateDoctorRow(row.id, { lastName: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Mouhafaza</Label>
                      <Input value={row.mouhafaza} disabled={busy} onChange={(event) => updateDoctorRow(row.id, { mouhafaza: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Quadaa</Label>
                      <Input value={row.quadaa} disabled={busy} onChange={(event) => updateDoctorRow(row.id, { quadaa: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Input value={row.region} disabled={busy} onChange={(event) => updateDoctorRow(row.id, { region: event.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.city}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "city")))}
                        onChange={(event) => updateDoctorRow(row.id, { city: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Street <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.street}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "street")))}
                        onChange={(event) => updateDoctorRow(row.id, { street: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Building <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.building}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "building")))}
                        onChange={(event) => updateDoctorRow(row.id, { building: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Telephone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={row.phone}
                        disabled={busy}
                        className={inputClass(missingFields.has(missingKey("doctor", row.id, "phone")))}
                        onChange={(event) => updateDoctorRow(row.id, { phone: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Textarea
                        value={row.remarks}
                        disabled={busy}
                        rows={2}
                        onChange={(event) => updateDoctorRow(row.id, { remarks: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        Latitude
                      </Label>
                      <Input value={row.latitude} disabled={busy} onChange={(event) => updateDoctorRow(row.id, { latitude: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        Longitude
                      </Label>
                      <Input value={row.longitude} disabled={busy} onChange={(event) => updateDoctorRow(row.id, { longitude: event.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance Infos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Has Insurance <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={values.hasInsurance}
                  disabled={busy}
                  onValueChange={(value: "Yes" | "No") => {
                    setValues((current) => ({
                      ...current,
                      hasInsurance: value,
                      insuranceType: value === "Yes" ? current.insuranceType : "",
                      insuranceExpiry: value === "Yes" ? current.insuranceExpiry : "",
                    }));
                    clearMissing(["hasInsurance", "insuranceType", "insuranceExpiry"]);
                  }}
                >
                  <SelectTrigger className={inputClass(missingFields.has("hasInsurance"))}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {values.hasInsurance === "Yes" ? (
                <>
                  <div className="space-y-2">
                    <Label>
                      Insurance <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      list="general-form-insurance-types"
                      value={values.insuranceType}
                      disabled={busy}
                      className={inputClass(missingFields.has("insuranceType"))}
                      onChange={(event) => setField("insuranceType", event.target.value)}
                    />
                    <datalist id="general-form-insurance-types">
                      {insuranceTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Expiry Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={values.insuranceExpiry}
                      disabled={busy}
                      className={inputClass(missingFields.has("insuranceExpiry"))}
                      onChange={(event) => setField("insuranceExpiry", event.target.value)}
                    />
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRowsSection
                title="Disability"
                question="Does the child Suffer any Disability?"
                rows={values.disabilityRows}
                group="disability"
                presets={disabilityPresets}
                listId="general-form-disability-presets"
                missingFields={missingFields}
                disabled={busy}
                onAdd={() => setValues((current) => ({ ...current, disabilityRows: [...current.disabilityRows, newStatusRow("disability")] }))}
                onRemove={(rowId) => removeSimpleRow("disabilityRows", rowId)}
                onChange={(rowId, patch) => updateSimpleRows("disabilityRows", "disability", rowId, patch)}
              />

              <StatusRowsSection
                title="Medical Case"
                question="Does the child Suffer any medical case?"
                rows={values.medicalCaseRows}
                group="medical-case"
                presets={medicalCasePresets}
                listId="general-form-medical-case-presets"
                missingFields={missingFields}
                disabled={busy}
                onAdd={() => setValues((current) => ({ ...current, medicalCaseRows: [...current.medicalCaseRows, newStatusRow("medical-case")] }))}
                onRemove={(rowId) => removeSimpleRow("medicalCaseRows", rowId)}
                onChange={(rowId, patch) => updateSimpleRows("medicalCaseRows", "medical-case", rowId, patch)}
              />

              <MedicationRowsSection
                rows={values.medicationRows}
                missingFields={missingFields}
                disabled={busy}
                onAdd={() => setValues((current) => ({ ...current, medicationRows: [...current.medicationRows, newMedicationRow()] }))}
                onRemove={(rowId) =>
                  setValues((current) => ({
                    ...current,
                    medicationRows: current.medicationRows.filter((row) => row.id !== rowId),
                  }))
                }
                onChange={updateMedicationRow}
              />

              <StatusRowsSection
                title="Surgical Operation"
                question="Does the child have any Surgical Operation?"
                rows={values.surgicalRows}
                group="surgical"
                presets={surgicalPresets}
                listId="general-form-surgical-presets"
                missingFields={missingFields}
                disabled={busy}
                onAdd={() => setValues((current) => ({ ...current, surgicalRows: [...current.surgicalRows, newStatusRow("surgical")] }))}
                onRemove={(rowId) => removeSimpleRow("surgicalRows", rowId)}
                onChange={(rowId, patch) => updateSimpleRows("surgicalRows", "surgical", rowId, patch)}
              />

              <StatusRowsSection
                title="Allergy"
                question="Does the child is allergic to any medication or food?"
                rows={values.allergyRows}
                group="allergy"
                presets={allergyPresets}
                listId="general-form-allergy-presets"
                missingFields={missingFields}
                disabled={busy}
                onAdd={() => setValues((current) => ({ ...current, allergyRows: [...current.allergyRows, newStatusRow("allergy")] }))}
                onRemove={(rowId) => removeSimpleRow("allergyRows", rowId)}
                onChange={(rowId, patch) => updateSimpleRows("allergyRows", "allergy", rowId, patch)}
              />
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
