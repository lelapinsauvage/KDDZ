"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Users,
} from "lucide-react";
import { createDailyReport } from "@/lib/actions/daily-reports";
import { toast } from "sonner";
import { getInitialsFromName } from "@/components/children/children-columns";

const portionOptions = [
  { value: "NONE", label: "None" },
  { value: "LITTLE", label: "A Little" },
  { value: "HALF", label: "Half" },
  { value: "MOST", label: "Most" },
  { value: "ALL", label: "All" },
];

const moodOptions = [
  { value: "HAPPY", label: "Happy" },
  { value: "CALM", label: "Calm" },
  { value: "FUSSY", label: "Fussy" },
  { value: "CRYING", label: "Crying" },
  { value: "SLEEPY", label: "Sleepy" },
];

interface ChildData {
  id: string;
  name: string;
  classId: string | null;
  className: string;
  hasReport: boolean;
  reportStatus: "SUBMITTED" | "DRAFT" | null;
  reportId: string | null;
}

interface FoodOption {
  id: string;
  name: string;
}

interface BatchReportClientProps {
  childrenList: ChildData[];
  classes: Array<{ id: string; name: string }>;
  foods: {
    breakfast: FoodOption[];
    lunch: FoodOption[];
    dessert: FoodOption[];
  };
  todayMenu: {
    breakfastFoodId: string;
    lunchFoodId: string;
  };
  canSubmitDirectly?: boolean;
}

// -- Avatar helpers --
const classColors = [
  { bg: "bg-primary/5", border: "border-[#0B9178]/20", text: "text-[#0B9178]", badge: "bg-primary/10 text-[#0B9178]", avatar: "bg-primary/10 text-[#0B9178]" },
  { bg: "bg-[#4F46E5]/10", border: "border-[#4F46E5]/20", text: "text-[#4F46E5]", badge: "bg-[#4F46E5]/15 text-[#4F46E5]", avatar: "bg-[#4F46E5]/15 text-[#4F46E5]" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700", avatar: "bg-rose-100 text-rose-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", avatar: "bg-amber-100 text-amber-700" },
  { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", badge: "bg-sky-100 text-sky-700", avatar: "bg-sky-100 text-sky-700" },
  { bg: "bg-[#059669]/10", border: "border-[#059669]/20", text: "text-[#059669]", badge: "bg-[#059669]/15 text-[#059669]", avatar: "bg-[#059669]/15 text-[#059669]" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700", badge: "bg-fuchsia-100 text-fuchsia-700", avatar: "bg-fuchsia-100 text-fuchsia-700" },
];

function getClassColor(className: string) {
  let hash = 0;
  for (let i = 0; i < className.length; i++) hash = className.charCodeAt(i) + ((hash << 5) - hash);
  return classColors[Math.abs(hash) % classColors.length];
}

export function BatchReportClient({
  childrenList: children,
  classes,
  foods,
  todayMenu,
  canSubmitDirectly = true,
}: BatchReportClientProps) {
  const router = useRouter();
  const [classFilter, setClassFilter] = useState("all");
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [completedChildren, setCompletedChildren] = useState<Set<string>>(
    new Set(children.filter((c) => c.hasReport).map((c) => c.id))
  );

  const filteredChildren = useMemo(() => {
    if (classFilter === "all") return children;
    return children.filter((c) => c.classId === classFilter);
  }, [children, classFilter]);

  const stats = useMemo(() => {
    const total = filteredChildren.length;
    const done = filteredChildren.filter((c) => completedChildren.has(c.id)).length;
    return { total, done, remaining: total - done };
  }, [filteredChildren, completedChildren]);

  // Group children by class
  const groupedChildren = useMemo(() => {
    const groups = new Map<string, ChildData[]>();
    for (const child of filteredChildren) {
      const key = child.className || "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(child);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredChildren]);

  const handleSaved = useCallback(
    (childId: string) => {
      setCompletedChildren((prev) => new Set([...prev, childId]));
      // Auto-advance to next child
      const currentIndex = filteredChildren.findIndex((c) => c.id === childId);
      const nextChild = filteredChildren
        .slice(currentIndex + 1)
        .find((c) => !completedChildren.has(c.id));
      setExpandedChild(nextChild?.id ?? null);
      router.refresh();
    },
    [filteredChildren, completedChildren, router]
  );

  const progressPercent = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header with filter and progress */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {stats.done} <span className="text-muted-foreground font-normal">of</span> {stats.total}
                </p>
                <p className="text-[11px] text-muted-foreground">reports done</p>
              </div>
              <div className="h-10 w-36 rounded-full bg-muted p-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 100
                      ? "bg-[#059669]"
                      : progressPercent > 50
                      ? "bg-primary"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.max(progressPercent, 2)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child list grouped by class */}
      <div className="space-y-6">
        {groupedChildren.map(([className, classChildren]) => {
          const colorSet = getClassColor(className);
          const classDone = classChildren.filter((c) => completedChildren.has(c.id)).length;

          return (
            <div key={className}>
              {/* Class group header */}
              <div className={`flex items-center gap-2 rounded-t-lg border ${colorSet.border} ${colorSet.bg} px-4 py-2.5`}>
                <Users className={`size-4 ${colorSet.text}`} />
                <h3 className={`text-sm font-semibold ${colorSet.text}`}>{className}</h3>
                <Badge className={`${colorSet.badge} ml-auto`}>
                  {classDone}/{classChildren.length} done
                </Badge>
              </div>

              {/* Children in this class */}
              <div className="space-y-0 rounded-b-lg border border-t-0 border-border/60 overflow-hidden">
                {classChildren.map((child, idx) => {
                  const isCompleted = completedChildren.has(child.id);
                  const isExpanded = expandedChild === child.id;

                  return (
                    <div key={child.id} className={idx > 0 ? "border-t border-border/40" : ""}>
                      <button
                        type="button"
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                          isCompleted ? "opacity-60" : ""
                        }`}
                        onClick={() =>
                          setExpandedChild(isExpanded ? null : child.id)
                        }
                      >
                        <div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${colorSet.avatar}`}>
                          {getInitialsFromName(child.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{child.name}</p>
                        </div>
                        {isCompleted ? (
                          <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 gap-1">
                            <CheckCircle2 className="size-3" />
                            Done
                          </Badge>
                        ) : child.reportStatus === "DRAFT" ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                            <Clock className="size-3" />
                            Draft
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1">
                            <CircleDot className="size-3" />
                            Pending
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {isExpanded && !isCompleted && (
                        <div className="border-t border-border/40 bg-muted/20">
                          <InlineReportForm
                            childId={child.id}
                            childName={child.name}
                            foods={foods}
                            todayMenu={todayMenu}
                            canSubmitDirectly={canSubmitDirectly}
                            onSaved={() => handleSaved(child.id)}
                          />
                        </div>
                      )}

                      {isExpanded && isCompleted && (
                        <div className="border-t border-border/40 bg-muted/20 px-6 py-4">
                          <p className="text-sm text-muted-foreground">
                            Report already submitted.{" "}
                            {child.reportId && (
                              <Link
                                href={`/daily-reports/${child.reportId}`}
                                className="text-primary hover:underline font-medium"
                              >
                                View report
                              </Link>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simplified inline form for batch entry
function InlineReportForm({
  childId,
  childName,
  foods,
  todayMenu,
  canSubmitDirectly,
  onSaved,
}: {
  childId: string;
  childName: string;
  foods: { breakfast: FoodOption[]; lunch: FoodOption[]; dessert: FoodOption[] };
  todayMenu: { breakfastFoodId: string; lunchFoodId: string };
  canSubmitDirectly: boolean;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [breakfastFoodId, setBreakfastFoodId] = useState(todayMenu.breakfastFoodId);
  const [breakfastPortion, setBreakfastPortion] = useState("ALL");
  const [lunchFoodId, setLunchFoodId] = useState(todayMenu.lunchFoodId);
  const [lunchPortion, setLunchPortion] = useState("ALL");
  const [isSleep, setIsSleep] = useState(true);
  const [sleepFrom, setSleepFrom] = useState("12:30");
  const [sleepTo, setSleepTo] = useState("14:30");
  const [mood, setMood] = useState("HAPPY");
  const [remarks, setRemarks] = useState("");

  function handleSubmit(status: "DRAFT" | "SUBMITTED") {
    const formData = new FormData();
    formData.set("childId", childId);
    formData.set("reportDate", new Date().toISOString().split("T")[0]);
    formData.set("status", status);
    if (breakfastFoodId) formData.set("breakfastFoodId", breakfastFoodId);
    formData.set("breakfastPortion", breakfastPortion);
    if (lunchFoodId) formData.set("lunchFoodId", lunchFoodId);
    formData.set("lunchPortion", lunchPortion);
    formData.set("isSleep", String(isSleep));
    if (isSleep) {
      formData.set("sleepFrom", sleepFrom);
      formData.set("sleepTo", sleepTo);
    }
    formData.set("mood", mood);
    if (remarks) formData.set("remarks", remarks);
    // Default health indicators
    formData.set("diarrhea", "false");
    formData.set("cough", "false");
    formData.set("runnyNose", "false");
    formData.set("vomit", "false");
    formData.set("urinePotty", "0");
    formData.set("stoolPotty", "0");
    formData.set("urineDiaper", "0");
    formData.set("stoolDiaper", "0");
    formData.set("feverEntries", "[]");
    formData.set("milkEntries", "[]");

    startTransition(async () => {
      const result = await createDailyReport(formData);
      if (result.success) {
        toast.success(`Report saved for ${childName}`);
        onSaved();
      } else {
        toast.error(result.error ?? "Failed to save report");
      }
    });
  }

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Breakfast */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Breakfast</Label>
          <Select value={breakfastFoodId} onValueChange={setBreakfastFoodId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select food..." />
            </SelectTrigger>
            <SelectContent>
              {foods.breakfast.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={breakfastPortion} onValueChange={setBreakfastPortion}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {portionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lunch */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Lunch</Label>
          <Select value={lunchFoodId} onValueChange={setLunchFoodId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select food..." />
            </SelectTrigger>
            <SelectContent>
              {foods.lunch.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lunchPortion} onValueChange={setLunchPortion}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {portionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mood */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Mood</Label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {moodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sleep */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`sleep-${childId}`}
            checked={isSleep}
            onCheckedChange={(checked) => setIsSleep(checked === true)}
          />
          <Label htmlFor={`sleep-${childId}`} className="text-xs">
            Nap time
          </Label>
        </div>
        {isSleep && (
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={sleepFrom}
              onChange={(e) => setSleepFrom(e.target.value)}
              className="h-8 w-[100px] text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              value={sleepTo}
              onChange={(e) => setSleepTo(e.target.value)}
              className="h-8 w-[100px] text-xs"
            />
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notes (optional)</Label>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any additional notes..."
          rows={2}
          className="text-xs"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
          Save Draft
        </Button>
        {canSubmitDirectly && (
          <Button
            size="sm"
            onClick={() => handleSubmit("SUBMITTED")}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Save className="mr-1 size-3" />}
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}
