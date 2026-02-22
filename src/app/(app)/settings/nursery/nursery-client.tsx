"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Upload,
  Building2,
  Clock,
  Settings2,
  Bell,
  Loader2,
} from "lucide-react";
import { updateNurserySettings } from "@/lib/actions/settings";
import {
  nurserySettingsSchema,
  type NurserySettingsValues,
} from "@/lib/validations/settings";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

interface NurseryClientProps {
  branchId: string;
  initialSettings: Record<string, string>;
}

function parseJsonArray(value: string | undefined): string[] {
  try {
    return JSON.parse(value ?? "[]");
  } catch {
    return [];
  }
}

export default function NurseryClient({ branchId, initialSettings }: NurseryClientProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NurserySettingsValues>({
    resolver: zodResolver(nurserySettingsSchema),
    defaultValues: {
      nursery_name: initialSettings["nursery_name"] ?? "",
      nursery_address: initialSettings["nursery_address"] ?? "",
      nursery_phone: initialSettings["nursery_phone"] ?? "",
      nursery_email: initialSettings["nursery_email"] ?? "",
      open_time: initialSettings["open_time"] ?? "07:00",
      close_time: initialSettings["close_time"] ?? "18:00",
      working_days: initialSettings["working_days"] ?? JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
      default_milk: initialSettings["default_milk"] ?? "",
      default_diaper: initialSettings["default_diaper"] ?? "",
      assessment_types: initialSettings["assessment_types"] ?? "[]",
      email_notifications: initialSettings["email_notifications"] ?? "false",
      sms_notifications: initialSettings["sms_notifications"] ?? "false",
      push_notifications: initialSettings["push_notifications"] ?? "false",
    },
  });

  const workingDays = parseJsonArray(watch("working_days"));
  const assessmentTypes = parseJsonArray(watch("assessment_types"));

  function toggleDay(day: string) {
    const current = workingDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setValue("working_days", JSON.stringify(next), { shouldDirty: true });
  }

  function toggleAssessment(t: string) {
    const current = assessmentTypes;
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    setValue("assessment_types", JSON.stringify(next), { shouldDirty: true });
  }

  function toggleCheckbox(field: "email_notifications" | "sms_notifications" | "push_notifications", checked: boolean) {
    setValue(field, String(checked), { shouldDirty: true });
  }

  function onSubmit(values: NurserySettingsValues) {
    startTransition(async () => {
      const result = await updateNurserySettings(branchId, values);
      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Nursery Configuration"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Nursery Configuration" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">General Information</CardTitle>
                <CardDescription>Basic details about your nursery</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nursery-name">Nursery Name</Label>
              <Input id="nursery-name" placeholder="e.g. Happy Kids Nursery" {...register("nursery_name")} />
              {errors.nursery_name && <p className="text-xs text-destructive">{errors.nursery_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-email">Email Address</Label>
              <Input id="nursery-email" type="email" placeholder="contact@nursery.com" {...register("nursery_email")} />
              {errors.nursery_email && <p className="text-xs text-destructive">{errors.nursery_email.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nursery-address">Address</Label>
              <Textarea id="nursery-address" placeholder="123 Main St, City" rows={2} {...register("nursery_address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-phone">Phone Number</Label>
              <Input id="nursery-phone" placeholder="+1 234 567 890" {...register("nursery_phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-muted-foreground">
                  <Upload className="size-6" />
                </div>
                <Button type="button" variant="outline" size="sm">
                  Upload Logo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Working Hours</CardTitle>
                <CardDescription>Set your nursery&apos;s operating schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="open-time">Opening Time</Label>
                <Input id="open-time" type="time" {...register("open_time")} />
                {errors.open_time && <p className="text-xs text-destructive">{errors.open_time.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close-time">Closing Time</Label>
                <Input id="close-time" type="time" {...register("close_time")} />
                {errors.close_time && <p className="text-xs text-destructive">{errors.close_time.message}</p>}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {DAY_SHORT[day]}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Settings2 className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Defaults &amp; Preferences</CardTitle>
                <CardDescription>Default values for daily care tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="default-milk">Default Milk Type</Label>
                <Input id="default-milk" placeholder="e.g. Formula, Breast milk" {...register("default_milk")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-diaper">Default Diaper Type</Label>
                <Input id="default-diaper" placeholder="e.g. Size 3, Pampers" {...register("default_diaper")} />
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Assessment Types Enabled</Label>
              <div className="flex flex-wrap gap-2">
                {["Developmental", "Behavioral", "Cognitive", "Social", "Language"].map((t) => {
                  const active = assessmentTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleAssessment(t)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-violet-300 bg-violet-100 text-violet-700"
                          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Bell className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Choose how parents and staff receive alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={watch("email_notifications") === "true"}
                onCheckedChange={(v) => toggleCheckbox("email_notifications", !!v)}
              />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Send alerts via email</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={watch("sms_notifications") === "true"}
                onCheckedChange={(v) => toggleCheckbox("sms_notifications", !!v)}
              />
              <div>
                <p className="text-sm font-medium">SMS Notifications</p>
                <p className="text-xs text-muted-foreground">Send text message alerts</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={watch("push_notifications") === "true"}
                onCheckedChange={(v) => toggleCheckbox("push_notifications", !!v)}
              />
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">In-app push notifications</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Save Button — sticky bar */}
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-end rounded-xl border bg-card px-5 py-3 shadow-lg">
            <Button
              type="submit"
              size="lg"
              className="text-white px-8"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
