"use client";

import { useState, useTransition, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Check,
  Droplets,
  Users,
  Shirt,
  Paperclip,
  Upload,
} from "lucide-react";

type PortionValue = "NONE" | "LITTLE" | "HALF" | "MOST" | "ALL";

const portionOptions: { value: PortionValue; label: string }[] = [
  { value: "ALL", label: "Well" },
  { value: "HALF", label: "Half" },
  { value: "LITTLE", label: "Little" },
  { value: "NONE", label: "None" },
];

const moodOptions = [
  { value: "HAPPY", label: "Happy", emoji: "\u{1F60A}" },
  { value: "CALM", label: "Calm", emoji: "\u{1F60C}" },
  { value: "FUSSY", label: "Fussy", emoji: "\u{1F624}" },
  { value: "CRYING", label: "Crying", emoji: "\u{1F622}" },
  { value: "SLEEPY", label: "Sleepy", emoji: "\u{1F634}" },
];

const hygieneRows = [
  { label: "Diaper", urineKey: "urineDiaper" as const, stoolKey: "stoolDiaper" as const },
  { label: "Pot", urineKey: "urinePotty" as const, stoolKey: "stoolPotty" as const },
] as const;

const clothesItems = [
  { key: "clothesPants" as const, label: "Pants" },
  { key: "clothesSweater" as const, label: "Sweater / Long-sleeve" },
  { key: "clothesTshirt" as const, label: "T-shirt" },
  { key: "clothesUnderwear" as const, label: "Underwear" },
  { key: "clothesSocks" as const, label: "Socks" },
] as const;

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

/* ── Portion radio pills ── */
function PortionRadio({
  value,
  onChange,
}: {
  value?: string;
  onChange: (val: PortionValue | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {portionOptions.map((p) => {
        const isSelected = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(isSelected ? undefined : p.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              isSelected
                ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                : "border-gray-200 bg-white hover:border-amber-300 text-gray-600"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Hygiene tally checkboxes (rounded, rating-style) ── */
function HygieneCheckRow({
  count,
  maxChecks = 5,
  onChange,
  activeClass,
}: {
  count: number;
  maxChecks?: number;
  onChange: (n: number) => void;
  activeClass: string;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: maxChecks }, (_, i) => i + 1).map((n) => {
        const isChecked = n <= count;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === count ? n - 1 : n)}
            className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${
              isChecked
                ? `${activeClass} text-white`
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {isChecked && <Check className="size-3.5" />}
          </button>
        );
      })}
    </div>
  );
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
      attendanceMode: "PRESENT",
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
      applyFoodForAll: false,
      feverEntries: [],
      milkEntries: [],
      clothesPants: false,
      clothesSweater: false,
      clothesTshirt: false,
      clothesUnderwear: false,
      clothesSocks: false,
      attachments: [],
      hospitalAttend: false,
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
  const attachmentsArray = useFieldArray({ control: form.control, name: "attachments" });

  const attendanceMode = watch("attendanceMode");

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        attachmentsArray.append({ title: "", fileName: file.name });
      }
    },
    [attachmentsArray],
  );

  function buildFormData(data: DailyReportFormValues, status: "DRAFT" | "SUBMITTED"): FormData {
    const fd = new FormData();
    fd.set("childId", data.childId);
    fd.set("reportDate", data.reportDate);
    fd.set("status", status);
    fd.set("attendanceMode", data.attendanceMode ?? "PRESENT");

    if (data.attendanceMode === "ABSENT") {
      if (data.absentReason) fd.set("absentReason", data.absentReason);
      if (data.absentFrom) fd.set("absentFrom", data.absentFrom);
      if (data.absentTo) fd.set("absentTo", data.absentTo);
      fd.set("hospitalAttend", String(data.hospitalAttend));
      return fd;
    }

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

    // Batch action
    fd.set("applyFoodForAll", String(data.applyFoodForAll));

    // Sleep (auto-derive isSleep from time fields)
    const hasSleep = !!(data.sleepFrom || data.sleepTo);
    fd.set("isSleep", String(hasSleep));
    if (data.sleepFrom) fd.set("sleepFrom", data.sleepFrom);
    if (data.sleepTo) fd.set("sleepTo", data.sleepTo);

    // Hygiene
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

    // Health notes
    if (data.healthNotes) fd.set("healthNotes", data.healthNotes);

    // Extra clothes
    fd.set("clothesPants", String(data.clothesPants));
    fd.set("clothesSweater", String(data.clothesSweater));
    fd.set("clothesTshirt", String(data.clothesTshirt));
    fd.set("clothesUnderwear", String(data.clothesUnderwear));
    fd.set("clothesSocks", String(data.clothesSocks));

    // Attachments
    fd.set("attachments", JSON.stringify(data.attachments));

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
        <div className="rounded-md bg-[#B07070]/10 border border-[#B07070]/30 p-3 text-sm text-[#B07070]">
          {error}
        </div>
      )}

      {/* ── ATTENDANCE MODE TOGGLE ── */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-emerald-50 to-rose-50 p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <span className="text-sm font-medium text-muted-foreground">Attendance Status</span>
          <div className="flex rounded-xl bg-white p-1 shadow-sm border">
            <button
              type="button"
              onClick={() => setValue("attendanceMode", "PRESENT")}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                attendanceMode === "PRESENT"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Check className="size-4" />
              Present
            </button>
            <button
              type="button"
              onClick={() => setValue("attendanceMode", "ABSENT")}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                attendanceMode === "ABSENT"
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Trash2 className="size-4" />
              Absent
            </button>
          </div>
        </div>
      </div>

      {/* ── Child & Date (always shown) ── */}
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
                      {child.name}{child.className ? ` \u2014 ${child.className}` : ""}
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

      {/* ══════════════════════════════════════════ */}
      {/*  ABSENT FLOW                              */}
      {/* ══════════════════════════════════════════ */}
      {attendanceMode === "ABSENT" && (
        <>
          <Card className="border-rose-200 bg-rose-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-rose-900">
                <Heart className="size-4 text-rose-500" />
                Absence Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reason of Absence</Label>
                <Textarea
                  placeholder="Reason for absence..."
                  rows={3}
                  {...register("absentReason")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Absent From</Label>
                  <Input type="date" {...register("absentFrom")} />
                </div>
                <div className="space-y-2">
                  <Label>Absent To</Label>
                  <Input type="date" {...register("absentTo")} />
                </div>
              </div>

              <Separator className="bg-rose-200" />

              <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-white p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Hospital Visit</Label>
                  <p className="text-xs text-muted-foreground">
                    Does the child attend hospital?
                  </p>
                </div>
                <Switch
                  checked={watch("hospitalAttend")}
                  onCheckedChange={(checked) => setValue("hospitalAttend", !!checked)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════ */}
      {/*  PRESENT FLOW                             */}
      {/* ══════════════════════════════════════════ */}
      {attendanceMode === "PRESENT" && (
        <>
          {/* ── MEALS ISLAND ── */}
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                <UtensilsCrossed className="size-4 text-amber-600" />
                Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Breakfast */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-amber-700 uppercase tracking-wider">
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
                    <PortionRadio
                      value={watch("breakfastPortion")}
                      onChange={(val) => setValue("breakfastPortion", val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" {...register("breakfastTime")} />
                  </div>
                </div>
              </div>

              <Separator className="bg-amber-200" />

              {/* Lunch */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-amber-700 uppercase tracking-wider">
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
                    <PortionRadio
                      value={watch("lunchPortion")}
                      onChange={(val) => setValue("lunchPortion", val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" {...register("lunchTime")} />
                  </div>
                </div>
              </div>

              <Separator className="bg-amber-200" />

              {/* Dessert */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-amber-700 uppercase tracking-wider">
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
                    <PortionRadio
                      value={watch("dessertPortion")}
                      onChange={(val) => setValue("dessertPortion", val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" {...register("dessertTime")} />
                  </div>
                </div>
              </div>

              <Separator className="bg-amber-200" />

              {/* ── Batch Action ── */}
              <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-100/80 p-4 flex items-start gap-3">
                <Checkbox
                  id="applyFoodForAll"
                  checked={watch("applyFoodForAll")}
                  onCheckedChange={(checked) => setValue("applyFoodForAll", !!checked)}
                  className="mt-0.5 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="applyFoodForAll" className="cursor-pointer">
                  <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <Users className="size-4" />
                    Apply Food For All Class Members
                  </span>
                  <span className="text-xs text-amber-700 mt-0.5 block">
                    Food type &amp; time should be filled first
                  </span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* ── MILK ISLAND ── */}
          <Card className="border-sky-200 bg-sky-50/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-sky-900">
                  <Baby className="size-4 text-sky-600" />
                  Milk Intake
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sky-300 text-sky-700 hover:bg-sky-100"
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

          {/* ── SLEEP ISLAND ── */}
          <Card className="border-indigo-200 bg-indigo-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
                <Moon className="size-4 text-indigo-500" />
                Nap Time
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* ── HYGIENE ISLAND ── */}
          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                <Droplets className="size-4 text-emerald-600" />
                Hygiene
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-20" />
                      <th className="text-center px-2 pb-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                          Urine
                        </span>
                      </th>
                      <th className="text-center px-2 pb-2">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                          Stool
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hygieneRows.map((row) => (
                      <tr key={row.label} className="border-t border-emerald-100">
                        <td className="py-3 pr-4 text-sm font-medium">{row.label}</td>
                        <td className="py-3 px-2">
                          <HygieneCheckRow
                            count={Number(watch(row.urineKey)) || 0}
                            onChange={(n) => setValue(row.urineKey, n)}
                            activeClass="border-amber-400 bg-amber-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <HygieneCheckRow
                            count={Number(watch(row.stoolKey)) || 0}
                            onChange={(n) => setValue(row.stoolKey, n)}
                            activeClass="border-emerald-500 bg-emerald-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── HEALTH ISLAND (Symptoms + Fever + Notes) ── */}
          <Card className="border-rose-200 bg-rose-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-rose-900">
                <Heart className="size-4 text-rose-500" />
                Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Symptom checkboxes */}
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

              <Separator className="bg-rose-200" />

              {/* Fever entries */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                    <Thermometer className="size-4" />
                    Fever Tracking
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-100"
                    onClick={() => feverArray.append({ temperature: "", time: "" })}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Add Reading
                  </Button>
                </div>
                {feverArray.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fever readings. Click &ldquo;Add Reading&rdquo; to log temperature.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {feverArray.fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Temp (&deg;C)</Label>
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
              </div>

              <Separator className="bg-rose-200" />

              {/* Health Notes */}
              <div className="space-y-2">
                <Label>Health Notes</Label>
                <Textarea
                  placeholder="Additional health observations..."
                  rows={3}
                  {...register("healthNotes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Mood ── */}
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

          {/* ── XTRA CLOTHES ISLAND ── */}
          <Card className="border-violet-200 bg-violet-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-violet-900">
                <Shirt className="size-4 text-violet-500" />
                Extra Clothes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {clothesItems.map(({ key, label }) => {
                  const isActive = watch(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue(key, !isActive)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                          : "border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── ATTACHMENTS ISLAND ── */}
          <Card className="border-slate-200 bg-slate-50/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Paperclip className="size-4 text-slate-500" />
                  Attachments
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => attachmentsArray.append({ title: "", fileName: "" })}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Attachment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                <Upload className="size-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">
                  Drag &amp; drop files here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click &ldquo;Add Attachment&rdquo; above
                </p>
              </div>

              {/* Attachment entries */}
              {attachmentsArray.fields.length > 0 && (
                <div className="space-y-3">
                  {attachmentsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g. Photo, Document..."
                          {...register(`attachments.${index}.title`)}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>File</Label>
                        <Input
                          placeholder="File name"
                          {...register(`attachments.${index}.fileName`)}
                          readOnly={!!field.fileName}
                          className={field.fileName ? "bg-muted" : ""}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => attachmentsArray.remove(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Remarks ── */}
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
        </>
      )}

      {/* ── Action Bar ── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border/40 bg-card px-4 py-3 md:px-6 md:py-4">
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
