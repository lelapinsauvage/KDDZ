"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  Heart,
  Eye,
  Ear,
  Activity,
  Sparkles,
} from "lucide-react";
import { createMedicalForm, updateMedicalForm } from "@/lib/actions/medical";

// ---------------------------------------------------------------------------
// Zod schema — comprehensive physical exam
// ---------------------------------------------------------------------------

const acuityOptions = ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60"] as const;
const earCondition = ["Normal", "Mild", "Moderate", "Severe"] as const;
const systemStatus = ["Normal", "Abnormal"] as const;

const visitFormSchema = z.object({
  // -- Visit info
  childId: z.string().min(1, "Child is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  doctor: z.string().min(1, "Doctor is required"),

  // -- 1. Vitals
  heightCm: z.string().optional(),
  weightKg: z.string().optional(),
  bloodPressure: z.string().optional(),
  vitalsNotes: z.string().optional(),

  // -- 2. Eyes
  withGlasses: z.boolean().optional(),
  leftEye: z.string().optional(),
  rightEye: z.string().optional(),
  crookedEyes: z.string().optional(),
  eyesNotes: z.string().optional(),

  // -- 3. Ears
  waxLeft: z.string().optional(),
  waxRight: z.string().optional(),
  drumLeft: z.string().optional(),
  drumRight: z.string().optional(),
  hearingLeft: z.string().optional(),
  hearingRight: z.string().optional(),
  earsNotes: z.string().optional(),

  // -- 4. Systems
  noseThroat: z.string().optional(),
  thyroid: z.string().optional(),
  lymphNodes: z.string().optional(),
  heartArterial: z.string().optional(),
  respiratory: z.string().optional(),
  motorSystem: z.string().optional(),
  abdomenGenitals: z.string().optional(),
  systemsNotes: z.string().optional(),

  // -- 5. Skin / Hair / Nails
  liceLupus: z.string().optional(),
  dermatitis: z.string().optional(),
  skinAllergy: z.string().optional(),
  hair: z.string().optional(),
  nails: z.string().optional(),
  skinNotes: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECTION_ICONS = {
  vitals: Heart,
  eyes: Eye,
  ears: Ear,
  systems: Activity,
  skin: Sparkles,
} as const;

const SECTIONS = [
  {
    id: "vitals",
    label: "Vitals",
    fields: ["heightCm", "weightKg", "bloodPressure"] as const,
  },
  {
    id: "eyes",
    label: "Eyes",
    fields: ["leftEye", "rightEye", "crookedEyes"] as const,
  },
  {
    id: "ears",
    label: "Ears",
    fields: ["waxLeft", "waxRight", "drumLeft", "drumRight", "hearingLeft", "hearingRight"] as const,
  },
  {
    id: "systems",
    label: "Systems",
    fields: ["noseThroat", "thyroid", "lymphNodes", "heartArterial", "respiratory", "motorSystem", "abdomenGenitals"] as const,
  },
  {
    id: "skin",
    label: "Skin / Hair / Nails",
    fields: ["liceLupus", "dermatitis", "skinAllergy", "hair", "nails"] as const,
  },
] as const;

function isSectionComplete(values: VisitFormValues, fields: readonly string[]): boolean {
  return fields.every((f) => {
    const val = values[f as keyof VisitFormValues];
    if (typeof val === "boolean") return true;
    return val !== undefined && val !== "";
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

function FormSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select...",
}: {
  label: string;
  value: string | undefined;
  onValueChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value || ""} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisitDetailClientProps {
  isNew: boolean;
  formId: string | null;
  initialData: VisitFormValues;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  childrenList: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VisitDetailClient({
  isNew,
  formId,
  initialData,
  status,
  childrenList,
}: VisitDetailClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: initialData,
  });

  const watchedValues = watch();
  const selectedChildName =
    childrenList.find((c) => c.id === watchedValues.childId)?.name ?? "";

  // Compute completion per section
  const sectionCompletion = useMemo(
    () =>
      SECTIONS.map((s) => ({
        id: s.id,
        complete: isSectionComplete(watchedValues, s.fields as unknown as string[]),
      })),
    [watchedValues],
  );

  const buildPayload = (data: VisitFormValues, formStatus: "DRAFT" | "SUBMITTED") => {
    const { childId, ...rest } = data;
    return {
      childId,
      formType: "VISITS" as const,
      status: formStatus,
      data: rest,
    };
  };

  const onSaveDraft = async (data: VisitFormValues) => {
    setIsSaving(true);
    try {
      const payload = buildPayload(data, "DRAFT");
      const result = isNew
        ? await createMedicalForm(payload)
        : await updateMedicalForm(formId!, payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Visit saved as draft.");
        router.push("/medical/visits");
      }
    } catch {
      toast.error("Failed to save visit.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitForm = async (data: VisitFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload(data, "SUBMITTED");
      const result = isNew
        ? await createMedicalForm(payload)
        : await updateMedicalForm(formId!, payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Visit submitted successfully.");
        router.push("/medical/visits");
      }
    } catch {
      toast.error("Failed to submit visit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSaving || isSubmitting;

  return (
    <>
      <PageHeader
        title={isNew ? "New Physical Exam" : "Physical Exam"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits", href: "/medical/visits" },
          { label: isNew ? "New" : selectedChildName || "Details" },
        ]}
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link href="/medical/visits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(status)}
            <Button
              variant="outline"
              onClick={handleSubmit(onSaveDraft)}
              disabled={busy}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              variant="default"
              className="text-white"
              onClick={handleSubmit(onSubmitForm)}
              disabled={busy}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Submit
            </Button>
          </div>
        </div>

        <form className="space-y-4 md:space-y-6">
          {/* Visit header info */}
          <Card>
            <CardHeader>
              <CardTitle>Visit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Child</Label>
                  <Select
                    value={watchedValues.childId}
                    onValueChange={(val) => setValue("childId", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenList.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.childId && (
                    <p className="text-xs text-red-500">{errors.childId.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Visit Date</Label>
                  <Input type="date" {...register("visitDate")} />
                  {errors.visitDate && (
                    <p className="text-xs text-red-500">{errors.visitDate.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Doctor</Label>
                  <Input placeholder="e.g. Dr. Antoine Karam" {...register("doctor")} />
                  {errors.doctor && (
                    <p className="text-xs text-red-500">{errors.doctor.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Exam Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Examination</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete each section of the physical exam. A checkmark appears when all fields are filled.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["vitals"]} className="w-full">
                {/* ── 1. Vitals ── */}
                <AccordionItem value="vitals">
                  <AccordionTrigger className="text-base">
                    <span className="flex items-center gap-2">
                      <Heart className="size-4 text-rose-500" />
                      Vitals
                      {sectionCompletion.find((s) => s.id === "vitals")?.complete && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 95"
                          {...register("heightCm")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 14.5"
                          {...register("weightKg")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Blood Pressure (mmHg)</Label>
                        <Input
                          placeholder="e.g. 100/60"
                          {...register("bloodPressure")}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Problems / Additional Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Any notes about vitals..."
                        {...register("vitalsNotes")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ── 2. Eyes ── */}
                <AccordionItem value="eyes">
                  <AccordionTrigger className="text-base">
                    <span className="flex items-center gap-2">
                      <Eye className="size-4 text-blue-500" />
                      Eyes
                      {sectionCompletion.find((s) => s.id === "eyes")?.complete && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-1">
                    <div className="flex items-center gap-3">
                      <Controller
                        name="withGlasses"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                        )}
                      />
                      <Label>With Glasses</Label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormSelect
                        label="Left Eye"
                        value={watchedValues.leftEye}
                        onValueChange={(v) => setValue("leftEye", v)}
                        options={acuityOptions}
                        placeholder="Acuity..."
                      />
                      <FormSelect
                        label="Right Eye"
                        value={watchedValues.rightEye}
                        onValueChange={(v) => setValue("rightEye", v)}
                        options={acuityOptions}
                        placeholder="Acuity..."
                      />
                      <FormSelect
                        label="Crooked Eyes"
                        value={watchedValues.crookedEyes}
                        onValueChange={(v) => setValue("crookedEyes", v)}
                        options={["Yes", "No"]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Problems / Additional Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Any notes about eyes..."
                        {...register("eyesNotes")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ── 3. Ears ── */}
                <AccordionItem value="ears">
                  <AccordionTrigger className="text-base">
                    <span className="flex items-center gap-2">
                      <Ear className="size-4 text-amber-500" />
                      Ears
                      {sectionCompletion.find((s) => s.id === "ears")?.complete && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormSelect
                        label="Wax — Left Ear"
                        value={watchedValues.waxLeft}
                        onValueChange={(v) => setValue("waxLeft", v)}
                        options={earCondition}
                      />
                      <FormSelect
                        label="Wax — Right Ear"
                        value={watchedValues.waxRight}
                        onValueChange={(v) => setValue("waxRight", v)}
                        options={earCondition}
                      />
                      <FormSelect
                        label="Drum — Left Ear"
                        value={watchedValues.drumLeft}
                        onValueChange={(v) => setValue("drumLeft", v)}
                        options={earCondition}
                      />
                      <FormSelect
                        label="Drum — Right Ear"
                        value={watchedValues.drumRight}
                        onValueChange={(v) => setValue("drumRight", v)}
                        options={earCondition}
                      />
                      <FormSelect
                        label="Hearing — Left Ear"
                        value={watchedValues.hearingLeft}
                        onValueChange={(v) => setValue("hearingLeft", v)}
                        options={earCondition}
                      />
                      <FormSelect
                        label="Hearing — Right Ear"
                        value={watchedValues.hearingRight}
                        onValueChange={(v) => setValue("hearingRight", v)}
                        options={earCondition}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Problems / Additional Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Any notes about ears..."
                        {...register("earsNotes")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ── 4. Systems ── */}
                <AccordionItem value="systems">
                  <AccordionTrigger className="text-base">
                    <span className="flex items-center gap-2">
                      <Activity className="size-4 text-violet-500" />
                      Systems
                      {sectionCompletion.find((s) => s.id === "systems")?.complete && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormSelect
                        label="Nose / Throat (Paranasal Sinuses)"
                        value={watchedValues.noseThroat}
                        onValueChange={(v) => setValue("noseThroat", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Thyroid"
                        value={watchedValues.thyroid}
                        onValueChange={(v) => setValue("thyroid", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Lymph Nodes"
                        value={watchedValues.lymphNodes}
                        onValueChange={(v) => setValue("lymphNodes", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Heart & Arterial System"
                        value={watchedValues.heartArterial}
                        onValueChange={(v) => setValue("heartArterial", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Respiratory"
                        value={watchedValues.respiratory}
                        onValueChange={(v) => setValue("respiratory", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Motor System (Bones, Joints, Backbone, Muscles)"
                        value={watchedValues.motorSystem}
                        onValueChange={(v) => setValue("motorSystem", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Abdomen — Genitals"
                        value={watchedValues.abdomenGenitals}
                        onValueChange={(v) => setValue("abdomenGenitals", v)}
                        options={systemStatus}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Problems / Additional Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Any notes about systems..."
                        {...register("systemsNotes")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ── 5. Skin / Hair / Nails ── */}
                <AccordionItem value="skin">
                  <AccordionTrigger className="text-base">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4 text-pink-500" />
                      Skin / Hair / Nails
                      {sectionCompletion.find((s) => s.id === "skin")?.complete && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormSelect
                        label="Lice / Lupus"
                        value={watchedValues.liceLupus}
                        onValueChange={(v) => setValue("liceLupus", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Dermatitis"
                        value={watchedValues.dermatitis}
                        onValueChange={(v) => setValue("dermatitis", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Skin Allergy"
                        value={watchedValues.skinAllergy}
                        onValueChange={(v) => setValue("skinAllergy", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Hair"
                        value={watchedValues.hair}
                        onValueChange={(v) => setValue("hair", v)}
                        options={systemStatus}
                      />
                      <FormSelect
                        label="Nails"
                        value={watchedValues.nails}
                        onValueChange={(v) => setValue("nails", v)}
                        options={systemStatus}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Problems / Additional Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Any notes about skin, hair, nails..."
                        {...register("skinNotes")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
