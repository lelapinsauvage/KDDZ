"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import {
  createMedicalForm,
  updateMedicalForm,
} from "@/lib/actions/medical";

// --- Schema ---

const accidentFormSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  accidentCause: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  injuryType: z.string().min(1, "Injury type is required"),
  severity: z.string().min(1, "Severity is required"),
  firstAidGiven: z.string().optional(),
  emergencyHospital: z.boolean(),
  treatment: z.string().optional(),
  parentNotified: z.boolean(),
  witnesses: z.string().optional(),
  followUpNotes: z.string().optional(),
  status: z.string(),
});

type AccidentFormValues = z.infer<typeof accidentFormSchema>;

// --- Status badge ---

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
        <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20">
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// --- Constants ---

const LOCATIONS = [
  "Classroom",
  "Outdoor playground",
  "Indoor play area",
  "Hallway",
  "Cafeteria",
  "Bathroom",
  "Stairs",
  "Swing",
  "Slide",
  "Other",
];

const ACCIDENT_CAUSES = [
  "Fall",
  "Bite",
  "Hitting",
  "Collision",
  "Other",
];

const INJURY_TYPES = [
  "Scrape/Abrasion",
  "Bump/Bruise",
  "Cut/Laceration",
  "Sprain/Strain",
  "Bite",
  "Burn",
  "Fracture",
  "Other",
];

const SEVERITIES = ["Minor", "Moderate", "Severe"];

// --- Props ---

interface AccidentDetailClientProps {
  isNew: boolean;
  formId: string | null;
  childId: string;
  childName?: string;
  formData: AccidentFormValues;
  childrenList: { id: string; name: string }[];
}

// --- Client Component ---

export function AccidentDetailClient({
  isNew,
  formId,
  childId: _childId,
  childName,
  formData,
  childrenList,
}: AccidentDetailClientProps) {
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
  } = useForm<AccidentFormValues>({
    resolver: zodResolver(accidentFormSchema),
    defaultValues: formData,
  });

  const currentStatus = watch("status");
  const emergencyHospital = watch("emergencyHospital");

  // --- Build data payload ---

  function buildPayload(data: AccidentFormValues) {
    return {
      date: data.date,
      time: data.time,
      location: data.location,
      accidentCause: data.accidentCause ?? "",
      description: data.description,
      injuryType: data.injuryType,
      severity: data.severity,
      firstAidGiven: data.firstAidGiven ?? "",
      emergencyHospital: data.emergencyHospital,
      treatment: data.treatment ?? "",
      parentNotified: data.parentNotified,
      witnesses: data.witnesses ?? "",
      followUpNotes: data.followUpNotes ?? "",
    };
  }

  // --- Save Draft ---

  async function onSaveDraft(data: AccidentFormValues) {
    setIsSaving(true);
    try {
      if (isNew) {
        const result = await createMedicalForm({
          childId: data.childId,
          formType: "ACCIDENTS",
          status: "DRAFT",
          data: buildPayload(data),
        });
        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Accident report saved as draft.");
          router.push("/medical/accidents");
        }
      } else {
        const result = await updateMedicalForm(formId!, {
          childId: data.childId,
          status: "DRAFT",
          data: buildPayload(data),
        });
        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Accident report draft updated.");
          router.push("/medical/accidents");
        }
      }
    } catch {
      toast.error("Failed to save accident report.");
    } finally {
      setIsSaving(false);
    }
  }

  // --- Submit ---

  async function onSubmit(data: AccidentFormValues) {
    setIsSubmitting(true);
    try {
      if (isNew) {
        const result = await createMedicalForm({
          childId: data.childId,
          formType: "ACCIDENTS",
          status: "SUBMITTED",
          data: buildPayload(data),
        });
        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Accident report submitted.");
          router.push("/medical/accidents");
        }
      } else {
        const result = await updateMedicalForm(formId!, {
          childId: data.childId,
          status: "SUBMITTED",
          data: buildPayload(data),
        });
        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Accident report submitted.");
          router.push("/medical/accidents");
        }
      }
    } catch {
      toast.error("Failed to submit accident report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSaving || isSubmitting;

  return (
    <>
      <PageHeader
        title={isNew ? "New Accident Report" : "Accident Report"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Accidents", href: "/medical/accidents" },
          { label: isNew ? "New" : (childName ?? "Detail") },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/accidents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentStatus)}
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
              className="text-primary-foreground"
              onClick={handleSubmit(onSubmit)}
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
          {/* Card 1: Child & Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Child & Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Child</Label>
                  <Select
                    value={watch("childId")}
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
                <div className="space-y-2">
                  <Label>Date of Accident</Label>
                  <Input type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-xs text-red-500">{errors.date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time of Accident</Label>
                  <Input type="time" {...register("time")} />
                  {errors.time && (
                    <p className="text-xs text-red-500">{errors.time.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={watch("location")}
                    onValueChange={(val) => setValue("location", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-xs text-red-500">{errors.location.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Accident Cause</Label>
                  <Select
                    value={watch("accidentCause") ?? ""}
                    onValueChange={(val) => setValue("accidentCause", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCIDENT_CAUSES.map((cause) => (
                        <SelectItem key={cause} value={cause}>
                          {cause}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Injury Type</Label>
                  <Select
                    value={watch("injuryType")}
                    onValueChange={(val) => setValue("injuryType", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select injury type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INJURY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.injuryType && (
                    <p className="text-xs text-red-500">{errors.injuryType.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={watch("severity")}
                    onValueChange={(val) => setValue("severity", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((sev) => (
                        <SelectItem key={sev} value={sev}>
                          {sev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.severity && (
                    <p className="text-xs text-red-500">{errors.severity.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what happened in detail..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: First Aid & Response */}
          <Card>
            <CardHeader>
              <CardTitle>First Aid & Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>First Aid Given</Label>
                  <Textarea
                    placeholder="e.g. Water, Soap, Hydrogen peroxide, Adhesive bandage, Ice pack..."
                    rows={3}
                    {...register("firstAidGiven")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    name="emergencyHospital"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="cursor-pointer">Emergency Hospital Visit</Label>
                </div>
                {emergencyHospital && (
                  <div className="space-y-2">
                    <Label>Treatment at Hospital</Label>
                    <Input
                      placeholder="Describe the treatment received..."
                      {...register("treatment")}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Notifications & Follow-up */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="parentNotified"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="cursor-pointer">Parent / Guardian Notified</Label>
                </div>
                <div className="space-y-2">
                  <Label>Witnesses</Label>
                  <Textarea
                    placeholder="Names or descriptions of witnesses..."
                    rows={2}
                    {...register("witnesses")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follow-up Notes</Label>
                  <Textarea
                    placeholder="Any follow-up actions or observations..."
                    rows={3}
                    {...register("followUpNotes")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
