"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Upload } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function NurseryInfoPage() {
  const [name, setName] = useState("Little Stars Nursery");
  const [address, setAddress] = useState("Jounieh, Keserwan, Mount Lebanon");
  const [phone, setPhone] = useState("+961 9 123 456");
  const [email, setEmail] = useState("info@littlestars.lb");

  const [openTime, setOpenTime] = useState("07:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);

  const [defaultMilk, setDefaultMilk] = useState("Formula");
  const [defaultDiaper, setDefaultDiaper] = useState("Pampers");
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>([
    "Developmental",
    "Behavioral",
    "Cognitive",
  ]);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const [saved, setSaved] = useState(false);

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <div className="space-y-6 p-6">
        {/* ── General Info ─────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nursery Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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

        {/* ── Working Hours ────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Opening Time</Label>
                <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Closing Time</Label>
                <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-2">Working Days</Label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={workingDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Defaults ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Default Milk Type</Label>
                <Input value={defaultMilk} onChange={(e) => setDefaultMilk(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Default Diaper Type</Label>
                <Input value={defaultDiaper} onChange={(e) => setDefaultDiaper(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-2">Assessment Types Enabled</Label>
              <div className="flex flex-wrap gap-3">
                {["Developmental", "Behavioral", "Cognitive", "Social", "Language"].map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={assessmentTypes.includes(t)}
                      onCheckedChange={(checked) => {
                        setAssessmentTypes((prev) =>
                          checked ? [...prev, t] : prev.filter((x) => x !== t)
                        );
                      }}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Notifications ────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={emailNotifications}
                onCheckedChange={(v) => setEmailNotifications(!!v)}
              />
              Email Notifications
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={smsNotifications}
                onCheckedChange={(v) => setSmsNotifications(!!v)}
              />
              SMS Notifications
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={pushNotifications}
                onCheckedChange={(v) => setPushNotifications(!!v)}
              />
              Push Notifications
            </label>
          </CardContent>
        </Card>

        {/* ── Save Button ──────────────────── */}
        <div className="flex items-center gap-3">
          <Button
            style={{ background: "#1caf9a" }}
            className="text-white"
            onClick={handleSave}
          >
            <Save className="mr-1 size-4" />
            Save Settings
          </Button>
          {saved && <span className="text-sm text-[#1caf9a] font-medium">Settings saved successfully!</span>}
        </div>
      </div>
    </>
  );
}
