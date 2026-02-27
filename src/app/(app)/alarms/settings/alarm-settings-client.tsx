"use client";

import { useState, useTransition, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cake,
  ClipboardCheck,
  Syringe,
  Stethoscope,
  Pill,
  CalendarDays,
  Shield,
  DollarSign,
  MessageSquare,
  FileText,
  Bell,
  Save,
  type LucideIcon,
} from "lucide-react";
import { getSettings, setSetting } from "@/lib/actions/settings";

interface AlarmConfig {
  type: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  settingKeyEnabled: string;
  settingKeyThreshold: string;
  defaultThreshold: string;
  thresholdLabel: string;
}

const ALARM_CONFIGS: AlarmConfig[] = [
  {
    type: "BIRTHDAY",
    label: "Birthdays",
    icon: Cake,
    iconColor: "text-pink-500",
    settingKeyEnabled: "alarm.birthday.enabled",
    settingKeyThreshold: "alarm.birthday.threshold",
    defaultThreshold: "7",
    thresholdLabel: "Days before birthday to notify",
  },
  {
    type: "ASSESSMENT",
    label: "Assessments",
    icon: ClipboardCheck,
    iconColor: "text-teal-500",
    settingKeyEnabled: "alarm.assessment.enabled",
    settingKeyThreshold: "alarm.assessment.threshold",
    defaultThreshold: "7",
    thresholdLabel: "Days before assessment to notify",
  },
  {
    type: "VACCINATION",
    label: "Vaccinations",
    icon: Syringe,
    iconColor: "text-blue-500",
    settingKeyEnabled: "alarm.vaccination.enabled",
    settingKeyThreshold: "alarm.vaccination.threshold",
    defaultThreshold: "14",
    thresholdLabel: "Days before due date to notify",
  },
  {
    type: "MEDICAL",
    label: "Medical",
    icon: Stethoscope,
    iconColor: "text-red-500",
    settingKeyEnabled: "alarm.medical.enabled",
    settingKeyThreshold: "alarm.medical.threshold",
    defaultThreshold: "7",
    thresholdLabel: "Days before follow-up to notify",
  },
  {
    type: "MEDICINE",
    label: "Medicine",
    icon: Pill,
    iconColor: "text-purple-500",
    settingKeyEnabled: "alarm.medicine.enabled",
    settingKeyThreshold: "alarm.medicine.threshold",
    defaultThreshold: "1",
    thresholdLabel: "Days before reminder to notify",
  },
  {
    type: "EVENT",
    label: "Events",
    icon: CalendarDays,
    iconColor: "text-teal-500",
    settingKeyEnabled: "alarm.event.enabled",
    settingKeyThreshold: "alarm.event.threshold",
    defaultThreshold: "3",
    thresholdLabel: "Days before event to notify",
  },
  {
    type: "INSURANCE",
    label: "Insurance",
    icon: Shield,
    iconColor: "text-blue-500",
    settingKeyEnabled: "alarm.insurance.enabled",
    settingKeyThreshold: "alarm.insurance.threshold",
    defaultThreshold: "30",
    thresholdLabel: "Days before expiry to notify",
  },
  {
    type: "PAYMENT",
    label: "Payments",
    icon: DollarSign,
    iconColor: "text-amber-500",
    settingKeyEnabled: "alarm.payment.enabled",
    settingKeyThreshold: "alarm.payment.threshold",
    defaultThreshold: "7",
    thresholdLabel: "Days before due date to notify",
  },
  {
    type: "REQUEST",
    label: "Requests",
    icon: MessageSquare,
    iconColor: "text-blue-500",
    settingKeyEnabled: "alarm.request.enabled",
    settingKeyThreshold: "alarm.request.threshold",
    defaultThreshold: "1",
    thresholdLabel: "Days to wait before reminder",
  },
  {
    type: "CONTRACT",
    label: "Contracts",
    icon: FileText,
    iconColor: "text-teal-500",
    settingKeyEnabled: "alarm.contract.enabled",
    settingKeyThreshold: "alarm.contract.threshold",
    defaultThreshold: "30",
    thresholdLabel: "Days before expiry to notify",
  },
  {
    type: "OTHER",
    label: "Others",
    icon: Bell,
    iconColor: "text-orange-500",
    settingKeyEnabled: "alarm.other.enabled",
    settingKeyThreshold: "alarm.other.threshold",
    defaultThreshold: "7",
    thresholdLabel: "Days before due date to notify",
  },
];

interface AlarmSettingsClientProps {
  branchId: string;
  branches: { id: string; name: string }[];
  initialSettings: Record<string, string>;
}

export function AlarmSettingsClient({
  branchId: initialBranchId,
  branches,
  initialSettings,
}: AlarmSettingsClientProps) {
  const [branchId, setBranchId] = useState(initialBranchId);
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Refetch settings when branch changes
  useEffect(() => {
    if (branchId === initialBranchId) return;
    startTransition(async () => {
      const result = await getSettings(branchId);
      if (result.success && result.data) {
        setSettings(result.data);
      }
    });
  }, [branchId, initialBranchId]);

  function getEnabled(config: AlarmConfig): boolean {
    const val = settings[config.settingKeyEnabled];
    return val === undefined ? true : val === "true";
  }

  function getThreshold(config: AlarmConfig): string {
    return settings[config.settingKeyThreshold] ?? config.defaultThreshold;
  }

  function toggleEnabled(config: AlarmConfig) {
    const newVal = !getEnabled(config);
    setSettings((prev) => ({
      ...prev,
      [config.settingKeyEnabled]: String(newVal),
    }));
    setSaved(false);
  }

  function setThreshold(config: AlarmConfig, value: string) {
    setSettings((prev) => ({
      ...prev,
      [config.settingKeyThreshold]: value,
    }));
    setSaved(false);
  }

  function handleSave() {
    if (!branchId) return;

    startTransition(async () => {
      for (const config of ALARM_CONFIGS) {
        await setSetting(
          branchId,
          config.settingKeyEnabled,
          String(getEnabled(config)),
        );
        await setSetting(
          branchId,
          config.settingKeyThreshold,
          getThreshold(config),
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <>
      <PageHeader
        title="Alarm Settings"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Settings" },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        {/* Branch selector */}
        {branches.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm text-muted-foreground">Branch:</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Alarm type settings */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ALARM_CONFIGS.map((config) => {
            const Icon = config.icon;
            const enabled = getEnabled(config);
            const threshold = getThreshold(config);

            return (
              <Card key={config.type} className={!enabled ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${config.iconColor}`} />
                      {config.label}
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleEnabled(config)}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 text-sm text-muted-foreground">
                      {config.thresholdLabel}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={threshold}
                      onChange={(e) => setThreshold(config, e.target.value)}
                      disabled={!enabled}
                      className="w-20"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isPending || !branchId}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 size-4" />
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600">
              Settings saved successfully!
            </span>
          )}
        </div>
      </div>
    </>
  );
}
