"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { createDailyReport } from "@/lib/actions/daily-reports";
import { toast } from "sonner";

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
  children: ChildData[];
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
}

export function BatchReportClient({
  children,
  classes,
  foods,
  todayMenu,
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

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header with filter and progress */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {stats.done} of {stats.total} done
          </span>
          <div className="h-2 w-32 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Child list */}
      <div className="space-y-2">
        {filteredChildren.map((child) => {
          const isCompleted = completedChildren.has(child.id);
          const isExpanded = expandedChild === child.id;

          return (
            <Card key={child.id} className={isCompleted ? "opacity-60" : ""}>
              <button
                type="button"
                className="w-full"
                onClick={() =>
                  setExpandedChild(isExpanded ? null : child.id)
                }
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {child.name.charAt(0)}
                    {child.name.split(" ")[1]?.charAt(0) ?? ""}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{child.name}</p>
                    {child.className && (
                      <p className="text-xs text-muted-foreground">{child.className}</p>
                    )}
                  </div>
                  {isCompleted ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="mr-1 size-3" />
                      Done
                    </Badge>
                  ) : child.reportStatus === "DRAFT" ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      <Clock className="mr-1 size-3" />
                      Draft
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <CircleDot className="mr-1 size-3" />
                      Pending
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </CardContent>
              </button>

              {isExpanded && !isCompleted && (
                <div className="border-t">
                  <InlineReportForm
                    childId={child.id}
                    childName={child.name}
                    foods={foods}
                    todayMenu={todayMenu}
                    onSaved={() => handleSaved(child.id)}
                  />
                </div>
              )}

              {isExpanded && isCompleted && (
                <div className="border-t px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Report already submitted.{" "}
                    {child.reportId && (
                      <Link
                        href={`/daily-reports/${child.reportId}`}
                        className="text-primary hover:underline"
                      >
                        View report
                      </Link>
                    )}
                  </p>
                </div>
              )}
            </Card>
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
  onSaved,
}: {
  childId: string;
  childName: string;
  foods: { breakfast: FoodOption[]; lunch: FoodOption[]; dessert: FoodOption[] };
  todayMenu: { breakfastFoodId: string; lunchFoodId: string };
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
          <Label className="text-xs">Breakfast</Label>
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
          <Label className="text-xs">Lunch</Label>
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
          <Label className="text-xs">Mood</Label>
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
        <Button
          size="sm"
          onClick={() => handleSubmit("SUBMITTED")}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : <Save className="mr-1 size-3" />}
          Submit
        </Button>
      </div>
    </div>
  );
}
