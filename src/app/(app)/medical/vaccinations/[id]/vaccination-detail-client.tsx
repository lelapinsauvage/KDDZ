"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Send, Syringe, User } from "lucide-react";

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

export type VaccinationFormStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
type BusyAction = "draft" | "submit" | null;

export interface VaccinationFormValues {
  childId: string;
  hepdate: string;
  hep: string;
  ipvdate: string;
  ipv: string;
  opvdate1: string;
  opv1: string;
  opvdate2: string;
  opv2: string;
  opvdate3: string;
  opv3: string;
  opvdate4: string;
  opv4: string;
  opvdate5: string;
  opv5: string;
  dptdate1: string;
  dpt1: string;
  dptdate2: string;
  dpt2: string;
  dptdate3: string;
  dpt3: string;
  dptdate4: string;
  dpt4: string;
  hasbedate1: string;
  hasbe1: string;
  mmrdate1: string;
  mmr1: string;
  mmrdate2: string;
  mmr2: string;
  ndptdate: string;
  ndpt: string;
  dtdate1: string;
  dt1: string;
  status: VaccinationFormStatus;
}

interface VaccinationChildOption extends MedicalChildOption {
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

interface VaccinationDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: VaccinationFormValues;
  initialData: Record<string, unknown>;
  childrenList: VaccinationChildOption[];
  initialAttachments: MedicalAttachmentValue[];
  legacyFormId?: number | null;
}

type VaccinationTextField = Exclude<keyof VaccinationFormValues, "status">;
type DoseField = Exclude<VaccinationTextField, "childId">;

interface DoseConfig {
  label: string;
  dateField: DoseField;
  adminField: DoseField;
}

interface VaccineSectionConfig {
  title: string;
  doses: DoseConfig[];
}

const vaccineSections: VaccineSectionConfig[] = [
  {
    title: "Hepatiti's B",
    doses: [{ label: "Zero Month 1st Dose at birth", dateField: "hepdate", adminField: "hep" }],
  },
  {
    title: "IPV",
    doses: [{ label: "2 Months 1st Dose", dateField: "ipvdate", adminField: "ipv" }],
  },
  {
    title: "OPV",
    doses: [
      { label: "4 Months 2nd Dose", dateField: "opvdate1", adminField: "opv1" },
      { label: "6 Months 3rd Dose", dateField: "opvdate2", adminField: "opv2" },
      { label: "18 Months 1st Reminder", dateField: "opvdate3", adminField: "opv3" },
      { label: "4/8 Years 2nd Reminder", dateField: "opvdate4", adminField: "opv4" },
      { label: "10/12 Years 3rd Reminder", dateField: "opvdate5", adminField: "opv5" },
    ],
  },
  {
    title: "DPT-Hib-HepB",
    doses: [
      { label: "2 Months 1st Dose", dateField: "dptdate1", adminField: "dpt1" },
      { label: "4 Months 2nd Dose", dateField: "dptdate2", adminField: "dpt2" },
      { label: "6 Months 3rd Dose", dateField: "dptdate3", adminField: "dpt3" },
      { label: "18 Months 1st Reminder", dateField: "dptdate4", adminField: "dpt4" },
    ],
  },
  {
    title: "Measles",
    doses: [{ label: "9 Months 1st Dose", dateField: "hasbedate1", adminField: "hasbe1" }],
  },
  {
    title: "MMR",
    doses: [
      { label: "12 Months 1st Dose", dateField: "mmrdate1", adminField: "mmr1" },
      { label: "18 Months 2nd Dose", dateField: "mmrdate2", adminField: "mmr2" },
    ],
  },
  {
    title: "DPT",
    doses: [{ label: "4/5 years 2nd Reminder", dateField: "ndptdate", adminField: "ndpt" }],
  },
  {
    title: "DT",
    doses: [{ label: "10/12 Years 2nd Reminder", dateField: "dtdate1", adminField: "dt1" }],
  },
];

const doseFields = vaccineSections.flatMap((section) =>
  section.doses.flatMap((dose) => [dose.dateField, dose.adminField]),
);

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

function statusBadge(status: VaccinationFormStatus) {
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

function ChildPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex size-24 items-center justify-center rounded-full border bg-muted">
        <User className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative size-24 overflow-hidden rounded-full border bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="96px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

interface DoseRowProps {
  dose: DoseConfig;
  values: VaccinationFormValues;
  missingFields: Set<string>;
  disabled: boolean;
  onChange: (field: VaccinationTextField, value: string) => void;
}

function DoseRow({ dose, values, missingFields, disabled, onChange }: DoseRowProps) {
  return (
    <div className="grid gap-3 rounded-sm bg-muted/30 p-3 md:grid-cols-[1.25fr_1fr_1fr]">
      <div className="flex items-center">
        <p className="text-sm font-medium">{dose.label}</p>
      </div>
      <div className="space-y-2">
        <Label>Date Given</Label>
        <Input
          type="date"
          value={values[dose.dateField]}
          disabled={disabled}
          className={inputClass(missingFields.has(dose.dateField))}
          onChange={(event) => onChange(dose.dateField, event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Administrated By</Label>
        <Input
          value={values[dose.adminField]}
          disabled={disabled}
          className={inputClass(missingFields.has(dose.adminField))}
          onChange={(event) => onChange(dose.adminField, event.target.value)}
        />
      </div>
    </div>
  );
}

function valuesToDoseSummary(values: VaccinationFormValues) {
  return vaccineSections.flatMap((section) =>
    section.doses.map((dose) => ({
      vaccine: section.title,
      dose: dose.label,
      dateGiven: values[dose.dateField],
      administeredBy: values[dose.adminField],
      dateField: dose.dateField,
      adminField: dose.adminField,
    })),
  );
}

export function VaccinationDetailClient({
  isNew,
  formId,
  formData,
  initialData,
  childrenList,
  initialAttachments,
  legacyFormId,
}: VaccinationDetailClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<VaccinationFormValues>(formData);
  const [status, setStatus] = useState<VaccinationFormStatus>(formData.status);
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

  function setField(field: VaccinationTextField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearMissing([field]);
  }

  function rawPayload(nextStatus: VaccinationFormStatus) {
    const child = childrenList.find((item) => item.id === values.childId) ?? selectedChild;
    const formNumber =
      legacyFormId ?? legacyNumber(initialData, "form_id") ?? legacyNumber(initialData, "_oldId");
    const doseValues = Object.fromEntries(doseFields.map((field) => [field, values[field]]));

    return {
      ...initialData,
      ...doseValues,
      child_id: child?.legacyId ?? legacyNumber(initialData, "child_id"),
      branch_id: child?.branchLegacyId ?? legacyNumber(initialData, "branch_id"),
      class_id: child?.classLegacyId ?? legacyNumber(initialData, "class_id"),
      form_id: formNumber,
      modernChildId: values.childId,
      modernBranchId: child?.branchId ?? null,
      modernClassId: child?.classId ?? null,
      is_rep_draft: nextStatus === "DRAFT" ? 1 : 0,
      vaccinationDoses: valuesToDoseSummary(values),
    };
  }

  function validateSubmit() {
    const missing = new Set<string>();

    vaccineSections.forEach((section) => {
      section.doses.forEach((dose) => {
        const dateValue = values[dose.dateField].trim();
        const adminValue = values[dose.adminField].trim();
        if ((dateValue && !adminValue) || (!dateValue && adminValue)) {
          if (!dateValue) missing.add(dose.dateField);
          if (!adminValue) missing.add(dose.adminField);
        }
      });
    });

    setMissingFields(missing);
    if (missing.size > 0) {
      toast.error("Please fill the mandatory paired fields marked in red.");
      return false;
    }

    return true;
  }

  async function save(nextStatus: VaccinationFormStatus) {
    if (!values.childId) {
      setMissingFields(new Set(["childId"]));
      toast.error("Select a child before saving the vaccination form.");
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
            formType: "VACCINATIONS",
            status: nextStatus,
            data: rawPayload(nextStatus),
            attachments: attachmentPayload,
          })
        : await updateMedicalForm(formId!, {
            childId: values.childId,
            formType: "VACCINATIONS",
            status: nextStatus,
            data: rawPayload(nextStatus),
            attachments: attachmentPayload,
            removeAttachmentIds: attachments.removedAttachmentIds,
          });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      setStatus(nextStatus);
      setValues((current) => ({ ...current, status: nextStatus }));
      toast.success(nextStatus === "DRAFT" ? "Vaccination form saved as draft." : "Vaccination form has been saved.");

      if (isNew && "formId" in result && result.formId) {
        router.push(`/medical/vaccinations/${result.formId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save vaccination form.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Vaccination"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Vaccinations", href: "/medical/vaccinations" },
          { label: isNew ? "New Vaccination" : selectedChild?.name ?? "Vaccination" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/medical/vaccinations">
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
                      <SelectValue placeholder="Choose Child" />
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
              <ChildPhoto src={selectedChildPhoto} alt={selectedChild?.name ?? "Child"} />
              <p className="text-center text-sm font-medium">{selectedChild?.name ?? "No child selected"}</p>
              <p className="text-center text-xs text-muted-foreground">
                DOB: {selectedChild?.dateOfBirth || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {vaccineSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Syringe className="size-4 text-[#008200]" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.doses.map((dose) => (
                <DoseRow
                  key={`${dose.dateField}-${dose.adminField}`}
                  dose={dose}
                  values={values}
                  missingFields={missingFields}
                  disabled={busy}
                  onChange={setField}
                />
              ))}
            </CardContent>
          </Card>
        ))}

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
      </div>
    </>
  );
}
