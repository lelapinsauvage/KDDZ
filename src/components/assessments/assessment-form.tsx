"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { createAssessment, updateAssessment } from "@/lib/actions/assessments";
import type { AssessmentTypeConfig } from "@/lib/assessment-types";

interface ChildOption {
  id: string;
  name: string;
  className: string;
}

interface AssessmentFormProps {
  assessmentType: number;
  typeConfig: AssessmentTypeConfig;
  childrenList: ChildOption[];
  defaultValues?: {
    id?: string;
    childId?: string;
    status?: "DRAFT" | "SUBMITTED" | "REVIEWED";
    data?: Record<string, unknown>;
  };
}

export function AssessmentForm({
  assessmentType,
  typeConfig,
  childrenList,
  defaultValues,
}: AssessmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!defaultValues?.id;

  const [childId, setChildId] = useState(defaultValues?.childId ?? "");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | "REVIEWED">(
    defaultValues?.status ?? "DRAFT"
  );

  // Initialize criteria responses from defaultValues.data
  const initData = (defaultValues?.data ?? {}) as Record<string, unknown>;
  const [responses, setResponses] = useState<Record<string, number | boolean>>(
    () => {
      const initial: Record<string, number | boolean> = {};
      for (const cat of typeConfig.categories) {
        for (const criterion of cat.criteria) {
          if (cat.isRedFlags) {
            initial[criterion.key] = initData[criterion.key] === true;
          } else {
            initial[criterion.key] =
              typeof initData[criterion.key] === "number"
                ? (initData[criterion.key] as number)
                : 0;
          }
        }
      }
      return initial;
    }
  );
  const [comments, setComments] = useState(
    (initData.comments as string) ?? ""
  );

  function setCriterionValue(key: string, value: number | boolean) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(submitStatus: "DRAFT" | "SUBMITTED") {
    if (!childId) {
      alert("Please select a child.");
      return;
    }

    const data: Record<string, unknown> = { ...responses, comments };

    startTransition(async () => {
      let result;
      if (isEditing && defaultValues?.id) {
        result = await updateAssessment(defaultValues.id, {
          childId,
          status: submitStatus,
          data,
        });
      } else {
        result = await createAssessment({
          childId,
          assessmentType,
          status: submitStatus,
          data,
        });
      }

      if (result.error) {
        alert(result.error);
        return;
      }

      router.push(`/assessments/${assessmentType}`);
      router.refresh();
    });
  }

  // Calculate progress
  const totalCriteria = typeConfig.categories
    .filter((c) => !c.isRedFlags)
    .reduce((sum, c) => sum + c.criteria.length, 0);
  const answeredCriteria = typeConfig.categories
    .filter((c) => !c.isRedFlags)
    .reduce(
      (sum, c) =>
        sum +
        c.criteria.filter((cr) => responses[cr.key] !== 0).length,
      0
    );
  const redFlagCount = typeConfig.categories
    .filter((c) => c.isRedFlags)
    .reduce(
      (sum, c) =>
        sum +
        c.criteria.filter((cr) => responses[cr.key] === true).length,
      0
    );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Child Selector & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{typeConfig.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="child">Child *</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger id="child">
                  <SelectValue placeholder="Select a child..." />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.className ? `(${c.className})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "DRAFT" | "SUBMITTED" | "REVIEWED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-4 text-sm text-[#555]">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="size-4 text-emerald-500" />
              <span>
                {answeredCriteria}/{totalCriteria} evaluated
              </span>
            </div>
            {redFlagCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-red-500" />
                <span className="text-red-600">
                  {redFlagCount} red flag{redFlagCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {typeConfig.categories.map((category) => (
        <Card key={category.name}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {category.isRedFlags && (
                <AlertTriangle className="size-4 text-red-500" />
              )}
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category.isRedFlags ? (
              <RedFlagSection
                category={category}
                responses={responses}
                onChange={setCriterionValue}
              />
            ) : (
              <CriteriaSection
                category={category}
                responses={responses}
                onChange={setCriterionValue}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes or observations..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("SUBMITTED")}
          disabled={isPending}
         
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 size-4" />
          )}
          Submit Assessment
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/assessments/${assessmentType}`)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Yes/No criteria section ──────────────────

function CriteriaSection({
  category,
  responses,
  onChange,
}: {
  category: AssessmentFormProps["typeConfig"]["categories"][number];
  responses: Record<string, number | boolean>;
  onChange: (key: string, value: number | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {category.criteria.map((criterion, idx) => {
        const value = responses[criterion.key] as number;
        return (
          <div key={criterion.key}>
            {idx > 0 && <Separator className="my-3" />}
            <div className="flex items-start justify-between gap-4">
              <Label className="text-sm leading-5 font-normal text-foreground flex-1">
                <span className="font-semibold text-primary mr-1.5">
                  {criterion.key.toUpperCase()}
                </span>
                {criterion.label}
              </Label>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={value === 1 ? "default" : "outline"}
                  className={
                    value === 1
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3"
                      : "h-8 px-3"
                  }
                  onClick={() => onChange(criterion.key, value === 1 ? 0 : 1)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={value === -1 ? "default" : "outline"}
                  className={
                    value === -1
                      ? "bg-red-500 hover:bg-red-600 text-white h-8 px-3"
                      : "h-8 px-3"
                  }
                  onClick={() =>
                    onChange(criterion.key, value === -1 ? 0 : -1)
                  }
                >
                  No
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Red flags checkbox section ───────────────

function RedFlagSection({
  category,
  responses,
  onChange,
}: {
  category: AssessmentFormProps["typeConfig"]["categories"][number];
  responses: Record<string, number | boolean>;
  onChange: (key: string, value: number | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {category.criteria.map((criterion, idx) => {
        const checked = responses[criterion.key] === true;
        return (
          <div key={criterion.key}>
            {idx > 0 && <Separator className="my-3" />}
            <div className="flex items-start gap-3">
              <Checkbox
                id={criterion.key}
                checked={checked}
                onCheckedChange={(v) =>
                  onChange(criterion.key, v === true)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor={criterion.key}
                className="text-sm leading-5 font-normal text-foreground cursor-pointer"
              >
                <span className="font-semibold text-red-500 mr-1.5">
                  {criterion.key.toUpperCase()}
                </span>
                {criterion.label}
              </Label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
