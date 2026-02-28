"use client";

import { useState, useTransition, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { createAssessment, updateAssessment } from "@/lib/actions/assessments";
import {
  ASSESSMENT_CONFIGS,
  ASSESSMENT_TYPE_NAMES,
  type AssessmentTypeConfig,
  type AssessmentCategory,
} from "@/lib/assessment-types";

// Full 8 brackets as specified
const ALL_BRACKETS = [
  { idx: 1, label: "0-3 mos", type: 1 },
  { idx: 2, label: "4-7 mos", type: 2 },
  { idx: 3, label: "8-12 mos", type: 3 },
  { idx: 4, label: "13-24 mos", type: 4 },
  { idx: 5, label: "24-36 mos", type: 5 },
  { idx: 6, label: "3-4 yrs", type: 6 },
  { idx: 7, label: "4-5 yrs", type: 7 },
] as const;

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
  const [activeType, setActiveType] = useState(assessmentType);

  // Get the active config based on selected tab
  const activeConfig = ASSESSMENT_CONFIGS[activeType] ?? typeConfig;

  // Initialize criteria responses from defaultValues.data for ALL types
  const initData = (defaultValues?.data ?? {}) as Record<string, unknown>;
  const [responses, setResponses] = useState<Record<string, number | boolean>>(
    () => {
      const initial: Record<string, number | boolean> = {};
      // Initialize for ALL assessment types so switching tabs preserves data
      for (const config of Object.values(ASSESSMENT_CONFIGS)) {
        for (const cat of config.categories) {
          for (const criterion of cat.criteria) {
            if (cat.isRedFlags) {
              initial[`${config.type}_${criterion.key}`] =
                initData[criterion.key] === true;
            } else {
              initial[`${config.type}_${criterion.key}`] =
                typeof initData[criterion.key] === "number"
                  ? (initData[criterion.key] as number)
                  : 0;
            }
          }
        }
      }
      // Also initialize flat keys for backward compat with existing data
      for (const cat of typeConfig.categories) {
        for (const criterion of cat.criteria) {
          if (cat.isRedFlags) {
            if (initData[criterion.key] === true) {
              initial[`${assessmentType}_${criterion.key}`] = true;
            }
          } else {
            if (typeof initData[criterion.key] === "number") {
              initial[`${assessmentType}_${criterion.key}`] =
                initData[criterion.key] as number;
            }
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

    // Build data from the active type's responses
    const cfg = ASSESSMENT_CONFIGS[activeType] ?? typeConfig;
    const data: Record<string, unknown> = { comments };
    for (const cat of cfg.categories) {
      for (const criterion of cat.criteria) {
        data[criterion.key] =
          responses[`${activeType}_${criterion.key}`] ??
          (cat.isRedFlags ? false : 0);
      }
    }

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
          assessmentType: activeType,
          status: submitStatus,
          data,
        });
      }

      if (result.error) {
        alert(result.error);
        return;
      }

      router.push(`/assessments/${activeType}`);
      router.refresh();
    });
  }

  // Calculate progress for active type
  const { totalCriteria, answeredCriteria, redFlagCount } = useMemo(() => {
    const cfg = activeConfig;
    const total = cfg.categories
      .filter((c) => !c.isRedFlags)
      .reduce((sum, c) => sum + c.criteria.length, 0);
    const answered = cfg.categories
      .filter((c) => !c.isRedFlags)
      .reduce(
        (sum, c) =>
          sum +
          c.criteria.filter(
            (cr) => responses[`${activeType}_${cr.key}`] !== 0
          ).length,
        0
      );
    const flags = cfg.categories
      .filter((c) => c.isRedFlags)
      .reduce(
        (sum, c) =>
          sum +
          c.criteria.filter(
            (cr) => responses[`${activeType}_${cr.key}`] === true
          ).length,
        0
      );
    return { totalCriteria: total, answeredCriteria: answered, redFlagCount: flags };
  }, [activeConfig, activeType, responses]);

  const progressPercent =
    totalCriteria > 0
      ? Math.round((answeredCriteria / totalCriteria) * 100)
      : 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Child Selector & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {ASSESSMENT_TYPE_NAMES[activeType] ?? activeConfig.name}
          </CardTitle>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="size-4 text-emerald-500" />
                  <span>
                    {answeredCriteria}/{totalCriteria} evaluated
                  </span>
                </div>
                {redFlagCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span className="text-amber-600 font-medium">
                      {redFlagCount} red flag{redFlagCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age Bracket Tabs */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 md:-mx-6 md:px-6 pt-2">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {ALL_BRACKETS.map((bracket) => {
              const isActive = bracket.type === activeType;
              return (
                <button
                  key={bracket.idx}
                  type="button"
                  onClick={() => setActiveType(bracket.type)}
                  className={`
                    shrink-0 rounded-full px-4 py-2.5 text-sm font-medium
                    transition-all duration-150 border
                    ${
                      isActive
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {bracket.label}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Categories for the active age bracket */}
      {activeConfig.categories.map((category) => (
        <Card key={`${activeType}-${category.key}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {category.isRedFlags && (
                <AlertTriangle className="size-4 text-amber-500" />
              )}
              {category.name}
              {category.isRedFlags && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs ml-auto">
                  Critical for Ministry
                </Badge>
              )}
              {!category.isRedFlags && (
                <Badge variant="secondary" className="text-xs ml-auto font-normal">
                  {category.criteria.filter(
                    (cr) => responses[`${activeType}_${cr.key}`] !== 0
                  ).length}
                  /{category.criteria.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category.isRedFlags ? (
              <RedFlagSection
                category={category}
                responses={responses}
                activeType={activeType}
                onChange={setCriterionValue}
              />
            ) : (
              <CriteriaSection
                category={category}
                responses={responses}
                activeType={activeType}
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
          onClick={() => router.push(`/assessments/${activeType}`)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Large Yes/No Pill Button criteria section ──

function CriteriaSection({
  category,
  responses,
  activeType,
  onChange,
}: {
  category: AssessmentCategory;
  responses: Record<string, number | boolean>;
  activeType: number;
  onChange: (key: string, value: number | boolean) => void;
}) {
  return (
    <div className="space-y-1">
      {category.criteria.map((criterion, idx) => {
        const stateKey = `${activeType}_${criterion.key}`;
        const value = responses[stateKey] as number;
        return (
          <div
            key={criterion.key}
            className={`
              flex items-center justify-between gap-3 rounded-xl px-4 py-3
              ${idx % 2 === 0 ? "bg-muted/40" : ""}
            `}
          >
            <span className="text-sm leading-5 text-foreground flex-1">
              {criterion.label}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {/* Yes pill */}
              <button
                type="button"
                onClick={() => onChange(stateKey, value === 1 ? 0 : 1)}
                className={`
                  inline-flex items-center justify-center rounded-full
                  min-w-[72px] h-11 px-5 text-sm font-semibold
                  transition-all duration-150 border-2
                  ${
                    value === 1
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600"
                  }
                `}
              >
                Yes
              </button>
              {/* No pill */}
              <button
                type="button"
                onClick={() => onChange(stateKey, value === -1 ? 0 : -1)}
                className={`
                  inline-flex items-center justify-center rounded-full
                  min-w-[72px] h-11 px-5 text-sm font-semibold
                  transition-all duration-150 border-2
                  ${
                    value === -1
                      ? "bg-neutral-500 border-neutral-500 text-white shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:border-neutral-400 hover:text-neutral-600"
                  }
                `}
              >
                No
              </button>
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
  activeType,
  onChange,
}: {
  category: AssessmentCategory;
  responses: Record<string, number | boolean>;
  activeType: number;
  onChange: (key: string, value: number | boolean) => void;
}) {
  return (
    <div className="space-y-1">
      {category.criteria.map((criterion, idx) => {
        const stateKey = `${activeType}_${criterion.key}`;
        const checked = responses[stateKey] === true;
        return (
          <div
            key={criterion.key}
            className={`
              flex items-start gap-3 rounded-xl px-4 py-3
              ${checked ? "bg-amber-50 dark:bg-amber-950/20" : idx % 2 === 0 ? "bg-muted/40" : ""}
            `}
          >
            <Checkbox
              id={`${activeType}-${criterion.key}`}
              checked={checked}
              onCheckedChange={(v) => onChange(stateKey, v === true)}
              className="mt-0.5 size-5 rounded border-2"
            />
            <Label
              htmlFor={`${activeType}-${criterion.key}`}
              className="text-sm leading-5 font-normal text-foreground cursor-pointer flex-1"
            >
              {criterion.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
