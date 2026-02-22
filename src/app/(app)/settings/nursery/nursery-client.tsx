"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Upload,
  Building2,
  Clock,
  Settings2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { setSetting } from "@/lib/actions/settings";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

interface NurseryClientProps {
  branchId: string;
  initialSettings: Record<string, string>;
}

export default function NurseryClient({ branchId, initialSettings }: NurseryClientProps) {
  const [name, setName] = useState(initialSettings["nursery_name"] ?? "");
  const [address, setAddress] = useState(initialSettings["nursery_address"] ?? "");
  const [phone, setPhone] = useState(initialSettings["nursery_phone"] ?? "");
  const [email, setEmail] = useState(initialSettings["nursery_email"] ?? "");

  const [openTime, setOpenTime] = useState(initialSettings["open_time"] ?? "07:00");
  const [closeTime, setCloseTime] = useState(initialSettings["close_time"] ?? "18:00");
  const [workingDays, setWorkingDays] = useState<string[]>(() => {
    try {
      return JSON.parse(initialSettings["working_days"] ?? "[]");
    } catch {
      return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }
  });

  const [defaultMilk, setDefaultMilk] = useState(initialSettings["default_milk"] ?? "");
  const [defaultDiaper, setDefaultDiaper] = useState(initialSettings["default_diaper"] ?? "");
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>(() => {
    try {
      return JSON.parse(initialSettings["assessment_types"] ?? "[]");
    } catch {
      return [];
    }
  });

  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings["email_notifications"] === "true"
  );
  const [smsNotifications, setSmsNotifications] = useState(
    initialSettings["sms_notifications"] === "true"
  );
  const [pushNotifications, setPushNotifications] = useState(
    initialSettings["push_notifications"] === "true"
  );

  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSave() {
    startTransition(async () => {
      const settings: Record<string, string> = {
        nursery_name: name,
        nursery_address: address,
        nursery_phone: phone,
        nursery_email: email,
        open_time: openTime,
        close_time: closeTime,
        working_days: JSON.stringify(workingDays),
        default_milk: defaultMilk,
        default_diaper: defaultDiaper,
        assessment_types: JSON.stringify(assessmentTypes),
        email_notifications: String(emailNotifications),
        sms_notifications: String(smsNotifications),
        push_notifications: String(pushNotifications),
      };

      for (const [key, value] of Object.entries(settings)) {
        await setSetting(branchId, key, value);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

      <div className="space-y-6 p-4 md:p-6">
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
              <Input id="nursery-name" placeholder="e.g. Happy Kids Nursery" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-email">Email Address</Label>
              <Input id="nursery-email" type="email" placeholder="contact@nursery.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-address">Address</Label>
              <Input id="nursery-address" placeholder="123 Main St, City" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nursery-phone">Phone Number</Label>
              <Input id="nursery-phone" placeholder="+1 234 567 890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-muted-foreground">
                  <Upload className="size-6" />
                </div>
                <Button variant="outline" size="sm">
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
                <Input id="open-time" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close-time">Closing Time</Label>
                <Input id="close-time" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
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
                <Input id="default-milk" placeholder="e.g. Formula, Breast milk" value={defaultMilk} onChange={(e) => setDefaultMilk(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-diaper">Default Diaper Type</Label>
                <Input id="default-diaper" placeholder="e.g. Size 3, Pampers" value={defaultDiaper} onChange={(e) => setDefaultDiaper(e.target.value)} />
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
                      onClick={() => {
                        setAssessmentTypes((prev) =>
                          active ? prev.filter((x) => x !== t) : [...prev, t]
                        );
                      }}
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
                checked={emailNotifications}
                onCheckedChange={(v) => setEmailNotifications(!!v)}
              />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Send alerts via email</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={smsNotifications}
                onCheckedChange={(v) => setSmsNotifications(!!v)}
              />
              <div>
                <p className="text-sm font-medium">SMS Notifications</p>
                <p className="text-xs text-muted-foreground">Send text message alerts</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={pushNotifications}
                onCheckedChange={(v) => setPushNotifications(!!v)}
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
          <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              {saved && (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">Settings saved successfully!</span>
                </>
              )}
            </div>
            <Button
              size="lg"
              className="text-white px-8"
              onClick={handleSave}
              disabled={isPending}
            >
              <Save className="mr-2 size-4" />
              {isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
