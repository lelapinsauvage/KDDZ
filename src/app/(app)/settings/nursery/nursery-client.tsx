"use client";

import { useMemo, useTransition } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Upload,
  Building2,
  Clock,
  Settings2,
  Bell,
  Loader2,
  ShieldCheck,
  User,
  Languages,
  MapPin,
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

const ENTITY_TYPES = [
  { value: "company", label: "Company" },
  { value: "association", label: "Association" },
  { value: "organization", label: "Organization" },
  { value: "other", label: "Other" },
];

interface Province {
  id: string;
  name: string;
  districts: District[];
}

interface District {
  id: string;
  name: string;
  regions: Region[];
}

interface Region {
  id: string;
  name: string;
}

interface NurseryClientProps {
  branchId: string;
  initialSettings: Record<string, string>;
  provinces: Province[];
}

function parseJsonArray(value: string | undefined): string[] {
  try {
    return JSON.parse(value ?? "[]");
  } catch {
    return [];
  }
}

export default function NurseryClient({ branchId, initialSettings, provinces }: NurseryClientProps) {
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
      // Government Registration
      registration_number: initialSettings["registration_number"] ?? "",
      registration_date: initialSettings["registration_date"] ?? "",
      // Owner Information
      owner_type: initialSettings["owner_type"] ?? "person",
      owner_name: initialSettings["owner_name"] ?? "",
      owner_father_name: initialSettings["owner_father_name"] ?? "",
      owner_family_name: initialSettings["owner_family_name"] ?? "",
      owner_id_number: initialSettings["owner_id_number"] ?? "",
      owner_nationality: initialSettings["owner_nationality"] ?? "",
      owner_place_of_birth: initialSettings["owner_place_of_birth"] ?? "",
      owner_date_of_birth: initialSettings["owner_date_of_birth"] ?? "",
      entity_legal_name: initialSettings["entity_legal_name"] ?? "",
      entity_type: initialSettings["entity_type"] ?? "",
      entity_registration_number: initialSettings["entity_registration_number"] ?? "",
      entity_representative_name: initialSettings["entity_representative_name"] ?? "",
      // Nursery Identity
      nursery_name_ar: initialSettings["nursery_name_ar"] ?? "",
      nursery_name_latin: initialSettings["nursery_name_latin"] ?? "",
      // Location
      nursery_province_id: initialSettings["nursery_province_id"] ?? "",
      nursery_district_id: initialSettings["nursery_district_id"] ?? "",
      nursery_region_id: initialSettings["nursery_region_id"] ?? "",
    },
  });

  const workingDays = parseJsonArray(watch("working_days"));
  const assessmentTypes = parseJsonArray(watch("assessment_types"));
  const ownerType = watch("owner_type");
  const selectedProvinceId = watch("nursery_province_id");
  const selectedDistrictId = watch("nursery_district_id");

  const districts = useMemo(() => {
    const province = provinces.find((p) => p.id === selectedProvinceId);
    return province?.districts ?? [];
  }, [provinces, selectedProvinceId]);

  const regions = useMemo(() => {
    const district = districts.find((d) => d.id === selectedDistrictId);
    return district?.regions ?? [];
  }, [districts, selectedDistrictId]);

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
          { label: "Nursery" },
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

        {/* Government Registration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Government Registration</CardTitle>
                <CardDescription>Official registration details for compliance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input id="registration-number" placeholder="e.g. REG-2024-001" {...register("registration_number")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration-date">Registration Date</Label>
              <Input id="registration-date" type="date" {...register("registration_date")} />
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Owner Information</CardTitle>
                <CardDescription>Details about the nursery owner or legal entity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Owner Type Toggle */}
            <div>
              <Label className="mb-3 block">Owner Type</Label>
              <div className="flex gap-2">
                {[
                  { value: "person", label: "Natural Person" },
                  { value: "entity", label: "Legal Entity" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={ownerType === option.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setValue("owner_type", option.value, { shouldDirty: true })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Natural Person Fields */}
            {ownerType === "person" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">Full Name</Label>
                  <Input id="owner-name" placeholder="Full name" {...register("owner_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-father">Father&apos;s Name</Label>
                  <Input id="owner-father" placeholder="Father's name" {...register("owner_father_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-family">Family Name</Label>
                  <Input id="owner-family" placeholder="Family name" {...register("owner_family_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-id">ID Number</Label>
                  <Input id="owner-id" placeholder="National ID number" {...register("owner_id_number")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-nationality">Nationality</Label>
                  <Input id="owner-nationality" placeholder="e.g. Lebanese" {...register("owner_nationality")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-pob">Place of Birth</Label>
                  <Input id="owner-pob" placeholder="City / Town" {...register("owner_place_of_birth")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-dob">Date of Birth</Label>
                  <Input id="owner-dob" type="date" {...register("owner_date_of_birth")} />
                </div>
              </div>
            )}

            {/* Legal Entity Fields */}
            {ownerType === "entity" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="entity-legal-name">Legal Name</Label>
                  <Input id="entity-legal-name" placeholder="Registered legal name" {...register("entity_legal_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="entity-type">Entity Type</Label>
                  <Select
                    value={watch("entity_type")}
                    onValueChange={(v) => setValue("entity_type", v, { shouldDirty: true })}
                  >
                    <SelectTrigger id="entity-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="entity-reg-number">Registration Number</Label>
                  <Input id="entity-reg-number" placeholder="Entity registration number" {...register("entity_registration_number")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="entity-rep-name">Authorized Representative Name</Label>
                  <Input id="entity-rep-name" placeholder="Full name of authorized signatory" {...register("entity_representative_name")} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nursery Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <Languages className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Nursery Identity</CardTitle>
                <CardDescription>Official names in Arabic and Latin script</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nursery-name-ar">Arabic Name</Label>
              <Input id="nursery-name-ar" dir="rtl" placeholder="اسم الحضانة بالعربية" {...register("nursery_name_ar")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-name-latin">Latin Name</Label>
              <Input id="nursery-name-latin" placeholder="Nursery name in Latin script" {...register("nursery_name_latin")} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <MapPin className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Location</CardTitle>
                <CardDescription>Geographic hierarchy for official reporting</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="nursery-province">Governorate</Label>
              <Select
                value={selectedProvinceId}
                onValueChange={(v) => {
                  setValue("nursery_province_id", v, { shouldDirty: true });
                  setValue("nursery_district_id", "", { shouldDirty: true });
                  setValue("nursery_region_id", "", { shouldDirty: true });
                }}
              >
                <SelectTrigger id="nursery-province" className="w-full">
                  <SelectValue placeholder="Select governorate" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-district">District</Label>
              <Select
                value={selectedDistrictId}
                onValueChange={(v) => {
                  setValue("nursery_district_id", v, { shouldDirty: true });
                  setValue("nursery_region_id", "", { shouldDirty: true });
                }}
                disabled={!selectedProvinceId}
              >
                <SelectTrigger id="nursery-district" className="w-full">
                  <SelectValue placeholder={selectedProvinceId ? "Select district" : "Select governorate first"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-region">Region</Label>
              <Select
                value={watch("nursery_region_id")}
                onValueChange={(v) => setValue("nursery_region_id", v, { shouldDirty: true })}
                disabled={!selectedDistrictId}
              >
                <SelectTrigger id="nursery-region" className="w-full">
                  <SelectValue placeholder={selectedDistrictId ? "Select region" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Button
                      key={day}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleDay(day)}
                    >
                      {DAY_SHORT[day]}
                    </Button>
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
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                    <Button
                      key={t}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleAssessment(t)}
                    >
                      {t}
                    </Button>
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
              className="text-primary-foreground px-8"
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
