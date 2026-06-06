"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  Ear,
  Eye,
  HeartPulse,
  Loader2,
  Save,
  Send,
  Stethoscope,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export type VisitStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
type BusyAction = "draft" | "submit" | null;

export interface VisitFormValues {
  childId: string;
  visitDate: string;
  height: string;
  weight: string;
  bp: string;
  leye: string;
  reye: string;
  leyewg: boolean;
  eyeprob: string;
  creye: string;
  earwl: string;
  earwr: string;
  eardl: string;
  eardr: string;
  earhl: string;
  earhr: string;
  earprob: string;
  nose: string;
  noseprob: string;
  thyriod: string;
  thprob: string;
  lymph: string;
  lymphprob: string;
  heart: string;
  arterial: string;
  heartprob: string;
  resp: string;
  respprob: string;
  bone: string;
  joint: string;
  backbone: string;
  muscle: string;
  motor: string;
  abdomen: string;
  enlarged: string;
  tumor: string;
  genitals: string;
  abdoprob: string;
  lice: string;
  derma: string;
  skin: string;
  hair: string;
  nails: string;
  skinprob: string;
  status: VisitStatus;
}

interface VisitChildOption extends MedicalChildOption {
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

interface VisitDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: VisitFormValues;
  initialData: Record<string, unknown>;
  childrenList: VisitChildOption[];
  initialAttachments: MedicalAttachmentValue[];
  legacyFormId?: number | null;
}

type StringVisitField = Exclude<keyof VisitFormValues, "leyewg" | "status">;

const normalAbnormalOptions = ["Normal", "Abnormal"];
const earOptions = ["Good", "Fair", "Bad"];
const yesNoOptions = ["Yes", "No"];

const requiredSubmitFields: StringVisitField[] = [
  "childId",
  "visitDate",
  "height",
  "weight",
  "bp",
  "leye",
  "reye",
  "earwl",
  "earwr",
  "eardl",
  "eardr",
  "earhl",
  "earhr",
  "nose",
  "thyriod",
  "lymph",
  "heart",
  "arterial",
  "resp",
  "bone",
  "joint",
  "backbone",
  "muscle",
  "abdomen",
  "enlarged",
  "tumor",
  "genitals",
  "lice",
  "derma",
  "skin",
  "hair",
  "nails",
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

function statusBadge(status: VisitStatus) {
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

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

interface LegacyInputProps {
  label: string;
  field: StringVisitField;
  values: VisitFormValues;
  missingFields: Set<string>;
  disabled: boolean;
  required?: boolean;
  type?: string;
  step?: string;
  list?: string;
  placeholder?: string;
  onChange: (field: StringVisitField, value: string) => void;
}

function LegacyInput({
  label,
  field,
  values,
  missingFields,
  disabled,
  required = false,
  type = "text",
  step,
  list,
  placeholder = "Select/Add",
  onChange,
}: LegacyInputProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        type={type}
        step={step}
        list={list}
        value={values[field]}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass(missingFields.has(field))}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function VisitSection({ title, icon, children }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChildPhoto({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
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

export function VisitDetailClient({
  isNew,
  formId,
  formData,
  initialData,
  childrenList,
  initialAttachments,
  legacyFormId,
}: VisitDetailClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<VisitFormValues>(formData);
  const [status, setStatus] = useState<VisitStatus>(formData.status);
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

  function setField(field: StringVisitField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearMissing([field]);
  }

  function setWithGlasses(checked: boolean) {
    setValues((current) => ({ ...current, leyewg: checked }));
  }

  function rawVisitPayload(nextStatus: VisitStatus) {
    const child = childrenList.find((item) => item.id === values.childId) ?? selectedChild;
    const formNumber =
      legacyFormId ?? legacyNumber(initialData, "form_id") ?? legacyNumber(initialData, "_oldId");
    const isDraft = nextStatus === "DRAFT" ? 1 : 0;

    return {
      ...initialData,
      child_id: child?.legacyId ?? legacyNumber(initialData, "child_id"),
      branch_id: child?.branchLegacyId ?? legacyNumber(initialData, "branch_id"),
      class_id: child?.classLegacyId ?? legacyNumber(initialData, "class_id"),
      form_id: formNumber,
      modernChildId: values.childId,
      modernBranchId: child?.branchId ?? null,
      modernClassId: child?.classId ?? null,
      formdate: values.visitDate,
      visit_date: values.visitDate,
      visitDate: values.visitDate,
      height: values.height,
      weight: values.weight,
      bp: values.bp,
      leye: values.leye,
      reye: values.reye,
      leyewg: values.leyewg ? 1 : 0,
      reyewg: 0,
      eyeprob: values.eyeprob,
      creye: values.creye,
      earwl: values.earwl,
      earwr: values.earwr,
      eardl: values.eardl,
      eardr: values.eardr,
      earhl: values.earhl,
      earhr: values.earhr,
      earprob: values.earprob,
      nose: values.nose,
      noseprob: values.noseprob,
      thyriod: values.thyriod,
      thprob: values.thprob,
      lymph: values.lymph,
      lymphprob: values.lymphprob,
      heart: values.heart,
      arterial: values.arterial,
      heartprob: values.heartprob,
      resp: values.resp,
      respprob: values.respprob,
      bone: values.bone,
      joint: values.joint,
      backbone: values.backbone,
      muscle: values.muscle,
      motor: values.motor,
      abdomen: values.abdomen,
      enlarged: values.enlarged,
      tumor: values.tumor,
      genitals: values.genitals,
      abdoprob: values.abdoprob,
      lice: values.lice,
      derma: values.derma,
      skin: values.skin,
      hair: values.hair,
      nails: values.nails,
      skinprob: values.skinprob,
      heightCm: values.height,
      weightKg: values.weight,
      bloodPressure: values.bp,
      withGlasses: values.leyewg,
      leftEye: values.leye,
      rightEye: values.reye,
      crookedEyes: values.creye,
      eyesNotes: values.eyeprob,
      waxLeft: values.earwl,
      waxRight: values.earwr,
      drumLeft: values.eardl,
      drumRight: values.eardr,
      hearingLeft: values.earhl,
      hearingRight: values.earhr,
      earsNotes: values.earprob,
      noseThroat: values.nose,
      thyroid: values.thyriod,
      lymphNodes: values.lymph,
      respiratory: values.resp,
      motorSystem: values.motor,
      abdomenGenitals: values.abdoprob,
      liceLupus: values.lice,
      dermatitis: values.derma,
      skinAllergy: values.skin,
      skinNotes: values.skinprob,
      is_rep_draft: isDraft,
      legacyVisitValues: {
        ...values,
        formdate: values.visitDate,
        leyewg: values.leyewg ? 1 : 0,
        reyewg: 0,
      },
    };
  }

  function validateSubmit() {
    const missing = new Set<string>();

    requiredSubmitFields.forEach((field) => {
      if (!values[field].trim()) missing.add(field);
    });

    const invalidGeneral =
      !values.bp.trim() ||
      !parsePositiveNumber(values.height) ||
      !parsePositiveNumber(values.weight);

    if (!parsePositiveNumber(values.height)) missing.add("height");
    if (!parsePositiveNumber(values.weight)) missing.add("weight");
    if (!values.bp.trim()) missing.add("bp");

    setMissingFields(missing);

    if (missing.size > 0) {
      toast.error(
        invalidGeneral
          ? "Please fill all general info with correct data."
          : "Please fill the mandatory fields marked in red.",
      );
      return false;
    }

    return true;
  }

  async function save(nextStatus: VisitStatus) {
    if (!values.childId) {
      setMissingFields(new Set(["childId"]));
      toast.error("Select a child before saving the medical visit form.");
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
            formType: "VISITS",
            status: nextStatus,
            data: rawVisitPayload(nextStatus),
            attachments: attachmentPayload,
          })
        : await updateMedicalForm(formId!, {
            childId: values.childId,
            formType: "VISITS",
            status: nextStatus,
            data: rawVisitPayload(nextStatus),
            attachments: attachmentPayload,
            removeAttachmentIds: attachments.removedAttachmentIds,
          });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      setStatus(nextStatus);
      setValues((current) => ({ ...current, status: nextStatus }));
      toast.success(nextStatus === "DRAFT" ? "Medical visit saved as draft." : "Medical visit has been saved.");

      if (isNew && "formId" in result && result.formId) {
        router.push(`/medical/visits/${result.formId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save medical visit.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Medical Visit"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits", href: "/medical/visits" },
          { label: isNew ? "New Medical Visit" : selectedChild?.name ?? "Medical Visit" },
        ]}
      />

      <datalist id="visit-normal-abnormal">
        {normalAbnormalOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="visit-ear-options">
        {earOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="visit-yes-no">
        {yesNoOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/medical/visits">
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

        <VisitSection title="General Info" icon={<Stethoscope className="size-4 text-[#327ad5]" />}>
          <div className="grid gap-4 md:grid-cols-4">
            <LegacyInput
              label="Visit Date"
              field="visitDate"
              type="date"
              required
              values={values}
              missingFields={missingFields}
              disabled={busy}
              placeholder=""
              onChange={setField}
            />
            <LegacyInput
              label="Height (CM)"
              field="height"
              type="number"
              step="0.1"
              required
              values={values}
              missingFields={missingFields}
              disabled={busy}
              placeholder="CM"
              onChange={setField}
            />
            <LegacyInput
              label="Weight (KG)"
              field="weight"
              type="number"
              step="0.1"
              required
              values={values}
              missingFields={missingFields}
              disabled={busy}
              placeholder="KG"
              onChange={setField}
            />
            <LegacyInput
              label="Blood Pressure"
              field="bp"
              required
              values={values}
              missingFields={missingFields}
              disabled={busy}
              placeholder="mm"
              onChange={setField}
            />
          </div>
        </VisitSection>

        <VisitSection title="Eyes" icon={<Eye className="size-4 text-[#7239ea]" />}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-sm border bg-muted/20 p-3">
              <Checkbox
                checked={values.leyewg}
                disabled={busy}
                onCheckedChange={(checked) => setWithGlasses(checked === true)}
              />
              <Label>With Glasses</Label>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <LegacyInput
                label="Left Eye"
                field="leye"
                list="visit-normal-abnormal"
                required
                values={values}
                missingFields={missingFields}
                disabled={busy}
                onChange={setField}
              />
              <LegacyInput
                label="Right Eye"
                field="reye"
                list="visit-normal-abnormal"
                required
                values={values}
                missingFields={missingFields}
                disabled={busy}
                onChange={setField}
              />
              <LegacyInput
                label="Other Problems"
                field="eyeprob"
                values={values}
                missingFields={missingFields}
                disabled={busy}
                placeholder=""
                onChange={setField}
              />
              <LegacyInput
                label="Crooked Eyes"
                field="creye"
                values={values}
                missingFields={missingFields}
                disabled={busy}
                placeholder=""
                onChange={setField}
              />
            </div>
          </div>
        </VisitSection>

        <VisitSection title="Ears" icon={<Ear className="size-4 text-[#d48706]" />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <LegacyInput label="Wax Left" field="earwl" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Wax Right" field="earwr" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Drum Left" field="eardl" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Drum Right" field="eardr" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Hearing Left" field="earhl" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Hearing Right" field="earhr" list="visit-ear-options" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <div className="md:col-span-2">
              <LegacyInput label="Other Problems" field="earprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
            </div>
          </div>
        </VisitSection>

        <VisitSection title="Nose and Throat" icon={<Activity className="size-4 text-[#008200]" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <LegacyInput label="Nose and Throat" field="nose" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Problems" field="noseprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Thyriod" icon={<Activity className="size-4 text-[#327ad5]" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <LegacyInput label="Thyriod" field="thyriod" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Notes" field="thprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Lymph nodes" icon={<Activity className="size-4 text-[#7239ea]" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <LegacyInput label="Lymph nodes" field="lymph" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Problems" field="lymphprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Heart And Arterial System" icon={<HeartPulse className="size-4 text-[#d64690]" />}>
          <div className="grid gap-4 md:grid-cols-3">
            <LegacyInput label="Heart" field="heart" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Arterial System" field="arterial" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Problems" field="heartprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Respiratory" icon={<Activity className="size-4 text-[#008200]" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <LegacyInput label="Respiratory" field="resp" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Problems" field="respprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Motor System" icon={<Activity className="size-4 text-[#7239ea]" />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <LegacyInput label="Bones" field="bone" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Joints" field="joint" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Backbone" field="backbone" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Muscles" field="muscle" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Additional Notes" field="motor" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Abdomen - Genitals" icon={<Activity className="size-4 text-[#d48706]" />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <LegacyInput label="Abdomen" field="abdomen" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Enlarged" field="enlarged" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Tumor" field="tumor" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Genitals" field="genitals" list="visit-normal-abnormal" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Other Problems" field="abdoprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

        <VisitSection title="Skin - Hair - Nails" icon={<Activity className="size-4 text-[#d64690]" />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <LegacyInput label="Lice - Lupus" field="lice" list="visit-yes-no" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Dermatitis" field="derma" list="visit-yes-no" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Skin Alergy" field="skin" list="visit-yes-no" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Hair" field="hair" list="visit-yes-no" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Nails" field="nails" list="visit-yes-no" required values={values} missingFields={missingFields} disabled={busy} onChange={setField} />
            <LegacyInput label="Additional Notes" field="skinprob" values={values} missingFields={missingFields} disabled={busy} placeholder="" onChange={setField} />
          </div>
        </VisitSection>

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
