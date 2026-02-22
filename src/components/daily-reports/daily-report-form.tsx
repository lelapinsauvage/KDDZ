"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  dailyReportSchema,
  type DailyReportFormValues,
} from "@/lib/validations/daily-report";
import { createDailyReport, updateDailyReport } from "@/lib/actions/daily-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Thermometer,
  Baby,
  UtensilsCrossed,
  Moon,
  Heart,
  Smile,
  Loader2,
} from "lucide-react";

const portionOptions = [
  { value: "NONE", label: "None" },
  { value: "LITTLE", label: "A Little" },
  { value: "HALF", label: "Half" },
  { value: "MOST", label: "Most" },
  { value: "ALL", label: "All" },
];

const moodOptions = [
  { value: "HAPPY", label: "Happy", emoji: "😊" },
  { value: "CALM", label: "Calm", emoji: "😌" },
  { value: "FUSSY", label: "Fussy", emoji: "😤" },
  { value: "CRYING", label: "Crying", emoji: "😢" },
  { value: "SLEEPY", label: "Sleepy", emoji: "😴" },
];

interface ChildOption {
  id: string;
  name: string;
  className: string;
}

interface FoodOption {
  id: string;
  name: string;
}

interface DailyReportFormProps {
  childrenList: ChildOption[];
  foods: {
    breakfast: FoodOption[];
    lunch: FoodOption[];
    dessert: FoodOption[];
  };
  defaultValues?: Partial<DailyReportFormValues>;
  reportId?: string;
}

export function DailyReportForm({
  childrenList,
  foods,
  defaultValues,
  reportId,
}: DailyReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      reportDate: new Date().toISOString().split("T")[0],
      isSleep: false,
      diarrhea: false,
      cough: false,
      runnyNose: false,
      vomit: false,
      urinePotty: 0,
      stoolPotty: 0,
      urineDiaper: 0,
      stoolDiaper: 0,
      feverEntries: [],
      milkEntries: [],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const feverArray = useFieldArray({ control: form.control, name: "feverEntries" });
  const milkArray = useFieldArray({ control: form.control, name: "milkEntries" });

  const isSleep = watch("isSleep");

  function buildFormData(data: DailyReportFormValues, status: "DRAFT" | "SUBMITTED"): FormData {
    const fd = new FormData();
    fd.set("childId", data.childId);
    fd.set("reportDate", data.reportDate);
    fd.set("status", status);

    // Meals
    if (data.breakfastFoodId) fd.set("breakfastFoodId", data.breakfastFoodId);
    if (data.breakfastPortion) fd.set("breakfastPortion", data.breakfastPortion);
    if (data.breakfastTime) fd.set("breakfastTime", data.breakfastTime);
    if (data.lunchFoodId) fd.set("lunchFoodId", data.lunchFoodId);
    if (data.lunchPortion) fd.set("lunchPortion", data.lunchPortion);
    if (data.lunchTime) fd.set("lunchTime", data.lunchTime);
    if (data.dessert) fd.set("dessert", data.dessert);
    if (data.dessertPortion) fd.set("dessertPortion", data.dessertPortion);
    if (data.dessertTime) fd.set("dessertTime", data.dessertTime);

    // Sleep
    fd.set("isSleep", String(data.isSleep));
    if (data.sleepFrom) fd.set("sleepFrom", data.sleepFrom);
    if (data.sleepTo) fd.set("sleepTo", data.sleepTo);

    // Health
    fd.set("diarrhea", String(data.diarrhea));
    fd.set("urinePotty", String(data.urinePotty));
    fd.set("stoolPotty", String(data.stoolPotty));
    fd.set("urineDiaper", String(data.urineDiaper));
    fd.set("stoolDiaper", String(data.stoolDiaper));

    // Symptoms
    if (data.mood) fd.set("mood", data.mood);
    fd.set("cough", String(data.cough));
    fd.set("runnyNose", String(data.runnyNose));
    fd.set("vomit", String(data.vomit));

    // Dynamic entries
    fd.set("feverEntries", JSON.stringify(data.feverEntries));
    fd.set("milkEntries", JSON.stringify(data.milkEntries));

    // Remarks
    if (data.remarks) fd.set("remarks", data.remarks);

    return fd;
  }

  function submitReport(data: DailyReportFormValues, status: "DRAFT" | "SUBMITTED") {
    setError(null);
    const fd = buildFormData(data, status);

    startTransition(async () => {
      const result = reportId
        ? await updateDailyReport(reportId, fd)
        : await createDailyReport(fd);

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push(status === "DRAFT" ? "/daily-reports?status=DRAFT" : "/daily-reports");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit((data) => submitReport(data, "SUBMITTED"))}
      className="space-y-6 p-4 md:p-6"
    >
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Child & Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Baby className="size-4 text-primary" />
            Child &amp; Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="childId">Child *</Label>
              <Select
                value={watch("childId") || ""}
                onValueChange={(val) => setValue("childId", val)}
              >
                <SelectTrigger className={errors.childId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a child..." />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}{child.className ? ` — ${child.className}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.childId && (
                <p className="text-xs text-destructive">{errors.childId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDate">Report Date *</Label>
              <Input
                type="date"
                {...register("reportDate")}
                className={errors.reportDate ? "border-destructive" : ""}
              />
              {errors.reportDate && (
                <p className="text-xs text-destructive">{errors.reportDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4 text-primary" />
            Meals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Breakfast */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Breakfast
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Food Item</Label>
                <Select
                  value={watch("breakfastFoodId") || ""}
                  onValueChange={(val) => setValue("breakfastFoodId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {foods.breakfast.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Portion</Label>
                <Select
                  value={watch("breakfastPortion") || ""}
                  onValueChange={(val) => setValue("breakfastPortion", val as "NONE" | "LITTLE" | "HALF" | "MOST" | "ALL")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {portionOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" {...register("breakfastTime")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Lunch */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Lunch
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Food Item</Label>
                <Select
                  value={watch("lunchFoodId") || ""}
                  onValueChange={(val) => setValue("lunchFoodId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {foods.lunch.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Portion</Label>
                <Select
                  value={watch("lunchPortion") || ""}
                  onValueChange={(val) => setValue("lunchPortion", val as "NONE" | "LITTLE" | "HALF" | "MOST" | "ALL")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {portionOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" {...register("lunchTime")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dessert */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Dessert
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Dessert Item</Label>
                <Select
                  value={watch("dessert") || ""}
                  onValueChange={(val) => setValue("dessert", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {foods.dessert.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Portion</Label>
                <Select
                  value={watch("dessertPortion") || ""}
                  onValueChange={(val) => setValue("dessertPortion", val as "NONE" | "LITTLE" | "HALF" | "MOST" | "ALL")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {portionOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" {...register("dessertTime")} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sleep */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="size-4 text-primary" />
            Sleep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isSleep"
                checked={isSleep}
                onCheckedChange={(checked) => setValue("isSleep", !!checked)}
              />
              <Label htmlFor="isSleep">Child slept today</Label>
            </div>

            {isSleep && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input type="time" {...register("sleepFrom")} />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input type="time" {...register("sleepTo")} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health & Hygiene */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="size-4 text-primary" />
            Health &amp; Hygiene
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Bathroom
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Urine (Potty)</Label>
                <Input type="number" min="0" {...register("urinePotty")} />
              </div>
              <div className="space-y-2">
                <Label>Stool (Potty)</Label>
                <Input type="number" min="0" {...register("stoolPotty")} />
              </div>
              <div className="space-y-2">
                <Label>Urine (Diaper)</Label>
                <Input type="number" min="0" {...register("urineDiaper")} />
              </div>
              <div className="space-y-2">
                <Label>Stool (Diaper)</Label>
                <Input type="number" min="0" {...register("stoolDiaper")} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Symptoms
            </h4>
            <div className="flex flex-wrap gap-3 sm:gap-6">
              {[
                { key: "diarrhea" as const, label: "Diarrhea" },
                { key: "cough" as const, label: "Cough" },
                { key: "runnyNose" as const, label: "Runny Nose" },
                { key: "vomit" as const, label: "Vomit" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={watch(key)}
                    onCheckedChange={(checked) => setValue(key, !!checked)}
                  />
                  <Label htmlFor={key}>{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smile className="size-4 text-primary" />
            Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {moodOptions.map((mood) => {
              const isSelected = watch("mood") === mood.value;
              return (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setValue("mood", mood.value as "HAPPY" | "CALM" | "FUSSY" | "CRYING" | "SLEEPY")}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{mood.emoji}</span>
                  {mood.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fever Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="size-4 text-destructive" />
              Fever Log
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => feverArray.append({ temperature: "", time: "" })}
            >
              <Plus className="mr-1 size-3.5" />
              Add Reading
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feverArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fever readings. Click &ldquo;Add Reading&rdquo; to log temperature.
            </p>
          ) : (
            <div className="space-y-3">
              {feverArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Temperature (&deg;C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="37.5"
                      {...register(`feverEntries.${index}.temperature`)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Time</Label>
                    <Input type="time" {...register(`feverEntries.${index}.time`)} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => feverArray.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milk Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Baby className="size-4 text-sky-500" />
              Milk Intake
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => milkArray.append({ amountCc: "", time: "" })}
            >
              <Plus className="mr-1 size-3.5" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {milkArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No milk entries. Click &ldquo;Add Entry&rdquo; to log milk intake.
            </p>
          ) : (
            <div className="space-y-3">
              {milkArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Amount (cc)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      {...register(`milkEntries.${index}.amountCc`)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Time</Label>
                    <Input type="time" {...register(`milkEntries.${index}.time`)} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => milkArray.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional notes about the child's day..."
            rows={4}
            {...register("remarks")}
          />
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-card px-4 py-3 md:px-6 md:py-4">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleSubmit((data) => submitReport(data, "DRAFT"))}
        >
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {reportId ? "Update Report" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
