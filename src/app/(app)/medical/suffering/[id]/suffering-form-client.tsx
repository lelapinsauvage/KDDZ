"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Ear,
  MessageCircle,
  Eye,
  Wind,
  Bug,
  HeartPulse,
  Activity,
  Droplets,
  Zap,
  BrainCircuit,
  UtensilsCrossed,
  Syringe,
  ClipboardList,
} from "lucide-react";
import {
  createMedicalForm,
  updateMedicalForm,
} from "@/lib/actions/medical";
import type { LucideIcon } from "lucide-react";

// --- Assessment categories ---

interface AssessmentCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}

const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  { key: "hearing", label: "Hearing", icon: Ear, iconColor: "text-blue-600" },
  { key: "speaking", label: "Speaking", icon: MessageCircle, iconColor: "text-indigo-600" },
  { key: "sight", label: "Sight", icon: Eye, iconColor: "text-emerald-600" },
  { key: "respiration", label: "Respiration", icon: Wind, iconColor: "text-cyan-600" },
  { key: "worms", label: "Worms", icon: Bug, iconColor: "text-amber-600" },
  { key: "heart", label: "Heart", icon: HeartPulse, iconColor: "text-red-600" },
  { key: "arteries", label: "Arteries", icon: Activity, iconColor: "text-rose-600" },
  { key: "urine", label: "Urine", icon: Droplets, iconColor: "text-yellow-600" },
  { key: "epilepsy", label: "Epilepsy", icon: Zap, iconColor: "text-purple-600" },
  { key: "migraine", label: "Migraine", icon: BrainCircuit, iconColor: "text-fuchsia-600" },
  { key: "eatingDisorder", label: "Eating Disorder", icon: UtensilsCrossed, iconColor: "text-orange-600" },
  { key: "chronicBloodProblems", label: "Chronic Blood Problems", icon: Syringe, iconColor: "text-red-700" },
  { key: "otherHealthProblems", label: "Other Health Problems", icon: ClipboardList, iconColor: "text-slate-600" },
];

const STATUS_OPTIONS = ["Normal", "Mild", "Moderate", "Severe", "N/A"] as const;

const CONCLUSION_OPTIONS = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Poor",
  "Needs Follow-up",
] as const;

// --- Types ---

interface AssessmentData {
  status: string;
  remarks: string;
}

interface SufferingFormData {
  assessments: Record<string, AssessmentData>;
  conclusion: string;
}

interface SufferingFormClientProps {
  isNew: boolean;
  formId: string | null;
  childId: string;
  childName: string;
  formStatus: string;
  initialData: SufferingFormData;
  childrenList: { id: string; name: string }[];
}

// --- Component ---

export function SufferingFormClient({
  isNew,
  formId,
  childId: initialChildId,
  childName,
  formStatus,
  initialData,
  childrenList,
}: SufferingFormClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(formStatus);
  const [childId, setChildId] = useState(initialChildId);
  const [assessments, setAssessments] = useState<Record<string, AssessmentData>>(
    initialData.assessments
  );
  const [conclusion, setConclusion] = useState(initialData.conclusion);

  function updateAssessment(key: string, field: "status" | "remarks", value: string) {
    setAssessments((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function save(status: "DRAFT" | "SUBMITTED") {
    if (!childId) {
      toast.error("Please select a child.");
      return;
    }

    const setter = status === "DRAFT" ? setIsSaving : setIsSubmitting;
    setter(true);

    try {
      const payload = {
        formSubType: "SUFFERING",
        assessments,
        conclusion,
      };

      let result;
      if (isNew) {
        result = await createMedicalForm({
          childId,
          formType: "CONDITIONS",
          status,
          data: payload,
        });
      } else {
        result = await updateMedicalForm(formId!, {
          childId,
          status,
          data: payload,
        });
      }

      if (result.success) {
        setCurrentStatus(status);
        toast.success(
          status === "DRAFT" ? "Draft saved." : "Suffering form submitted."
        );
        router.push("/medical/suffering");
      } else {
        toast.error(result.error || "Failed to save.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setter(false);
    }
  }

  const isLoading = isSaving || isSubmitting;

  function getStatusBadge(s: string) {
    switch (s) {
      case "DRAFT":
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Draft</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>;
      case "REVIEWED":
        return <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20">Reviewed</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New Suffering Assessment" : "Suffering Assessment"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Suffering Forms", href: "/medical/suffering" },
          { label: isNew ? "New" : childName || "Details" },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/suffering">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentStatus)}
            <Button
              variant="outline"
              onClick={() => save("DRAFT")}
              disabled={isLoading}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              className="text-white"
              onClick={() => save("SUBMITTED")}
              disabled={isLoading}
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

        {/* Child selector */}
        <Card>
          <CardHeader>
            <CardTitle>Child Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label>
                Child <span className="text-red-500">*</span>
              </Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessment rows */}
        <Card>
          <CardHeader>
            <CardTitle>Health Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Header row */}
            <div className="hidden md:grid md:grid-cols-[240px_180px_1fr] gap-3 px-3 pb-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Category</span>
              <span>Assessment</span>
              <span>Remarks</span>
            </div>

            {ASSESSMENT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const data = assessments[cat.key] ?? { status: "", remarks: "" };
              return (
                <div
                  key={cat.key}
                  className="grid grid-cols-1 md:grid-cols-[240px_180px_1fr] gap-2 md:gap-3 items-start rounded-lg border border-border/40 bg-muted/20 p-3"
                >
                  {/* Category label */}
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <Icon className={`size-4 ${cat.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>

                  {/* Status select */}
                  <Select
                    value={data.status}
                    onValueChange={(val) => updateAssessment(cat.key, "status", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remarks */}
                  <Input
                    placeholder="Add remarks..."
                    value={data.remarks}
                    onChange={(e) => updateAssessment(cat.key, "remarks", e.target.value)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Conclusion */}
        <Card>
          <CardHeader>
            <CardTitle>Conclusion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <Label>How do you assess General Health of your child?</Label>
              <Select value={conclusion} onValueChange={setConclusion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assessment..." />
                </SelectTrigger>
                <SelectContent>
                  {CONCLUSION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
