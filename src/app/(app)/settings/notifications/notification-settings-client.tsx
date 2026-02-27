"use client";

import { useState, useTransition, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardList,
  FileWarning,
  ClipboardCheck,
  Pill,
  Shield,
  FileText,
  Syringe,
  CalendarDays,
  DollarSign,
  Save,
  Info,
  type LucideIcon,
} from "lucide-react";
import { getSettings, setSetting } from "@/lib/actions/settings";

interface NotificationConfig {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  settingKeyEnabled: string;
  settingKeyDaysBefore: string;
  settingKeyTemplate: string;
  defaultDaysBefore: string;
  defaultTemplate: string;
}

const NOTIFICATION_CONFIGS: NotificationConfig[] = [
  {
    type: "BIRTHDAY",
    label: "Birthday Greetings",
    description: "Send birthday wishes to children and their parents",
    icon: Cake,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50",
    borderColor: "border-l-pink-500",
    settingKeyEnabled: "notif.birthday.enabled",
    settingKeyDaysBefore: "notif.birthday.daysBefore",
    settingKeyTemplate: "notif.birthday.template",
    defaultDaysBefore: "0",
    defaultTemplate:
      "Happy Birthday, {{child_name}}! Wishing you a wonderful day from everyone at {{branch_name}}.",
  },
  {
    type: "MISSING_DAILY_REPORT",
    label: "Missing Daily Reports",
    description: "Alert when daily reports are not submitted",
    icon: ClipboardList,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    borderColor: "border-l-orange-500",
    settingKeyEnabled: "notif.missingDailyReport.enabled",
    settingKeyDaysBefore: "notif.missingDailyReport.daysBefore",
    settingKeyTemplate: "notif.missingDailyReport.template",
    defaultDaysBefore: "1",
    defaultTemplate:
      "Daily report for {{child_name}} on {{date}} has not been submitted yet.",
  },
  {
    type: "MISSING_ABSENCE_REPORT",
    label: "Missing Absence Reports",
    description: "Alert when absences are not reported",
    icon: FileWarning,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    borderColor: "border-l-red-500",
    settingKeyEnabled: "notif.missingAbsence.enabled",
    settingKeyDaysBefore: "notif.missingAbsence.daysBefore",
    settingKeyTemplate: "notif.missingAbsence.template",
    defaultDaysBefore: "1",
    defaultTemplate:
      "{{child_name}} was absent on {{date}} but no absence report was filed.",
  },
  {
    type: "ASSESSMENT_DUE",
    label: "Assessment Due",
    description: "Reminder when assessments are approaching",
    icon: ClipboardCheck,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    borderColor: "border-l-teal-500",
    settingKeyEnabled: "notif.assessmentDue.enabled",
    settingKeyDaysBefore: "notif.assessmentDue.daysBefore",
    settingKeyTemplate: "notif.assessmentDue.template",
    defaultDaysBefore: "7",
    defaultTemplate:
      "Assessment for {{child_name}} is due on {{date}}. Please complete it before the deadline.",
  },
  {
    type: "MEDICINE_REMINDER",
    label: "Medicine Reminders",
    description: "Remind staff about medication schedules",
    icon: Pill,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    borderColor: "border-l-purple-500",
    settingKeyEnabled: "notif.medicine.enabled",
    settingKeyDaysBefore: "notif.medicine.daysBefore",
    settingKeyTemplate: "notif.medicine.template",
    defaultDaysBefore: "0",
    defaultTemplate:
      "Reminder: {{child_name}} needs medication today. Please check the medical records.",
  },
  {
    type: "INSURANCE_EXPIRING",
    label: "Insurance Expiring",
    description: "Warn when a child's insurance is about to expire",
    icon: Shield,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderColor: "border-l-blue-500",
    settingKeyEnabled: "notif.insurance.enabled",
    settingKeyDaysBefore: "notif.insurance.daysBefore",
    settingKeyTemplate: "notif.insurance.template",
    defaultDaysBefore: "30",
    defaultTemplate:
      "Insurance for {{child_name}} expires on {{date}}. Please notify {{parent_name}} to renew.",
  },
  {
    type: "CONTRACT_EXPIRING",
    label: "Contract Expiring",
    description: "Warn when a child's contract is about to expire",
    icon: FileText,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    borderColor: "border-l-indigo-500",
    settingKeyEnabled: "notif.contract.enabled",
    settingKeyDaysBefore: "notif.contract.daysBefore",
    settingKeyTemplate: "notif.contract.template",
    defaultDaysBefore: "30",
    defaultTemplate:
      "Contract for {{child_name}} at {{branch_name}} expires on {{date}}. Contact {{parent_name}} for renewal.",
  },
  {
    type: "VACCINATION_DUE",
    label: "Vaccination Due",
    description: "Remind when vaccinations are coming up",
    icon: Syringe,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50",
    borderColor: "border-l-sky-500",
    settingKeyEnabled: "notif.vaccination.enabled",
    settingKeyDaysBefore: "notif.vaccination.daysBefore",
    settingKeyTemplate: "notif.vaccination.template",
    defaultDaysBefore: "14",
    defaultTemplate:
      "Vaccination for {{child_name}} is due on {{date}}. Please remind {{parent_name}}.",
  },
  {
    type: "HOLIDAY_ANNOUNCEMENT",
    label: "Holiday Announcements",
    description: "Notify about upcoming holidays and closures",
    icon: CalendarDays,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
    settingKeyEnabled: "notif.holiday.enabled",
    settingKeyDaysBefore: "notif.holiday.daysBefore",
    settingKeyTemplate: "notif.holiday.template",
    defaultDaysBefore: "3",
    defaultTemplate:
      "Reminder: {{branch_name}} will be closed on {{date}} for a holiday.",
  },
  {
    type: "PAYMENT_OVERDUE",
    label: "Payment Overdue",
    description: "Alert when payments are past due",
    icon: DollarSign,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    borderColor: "border-l-amber-500",
    settingKeyEnabled: "notif.payment.enabled",
    settingKeyDaysBefore: "notif.payment.daysBefore",
    settingKeyTemplate: "notif.payment.template",
    defaultDaysBefore: "7",
    defaultTemplate:
      "Payment of {{amount}} for {{child_name}} is overdue. Please follow up with {{parent_name}}.",
  },
];

const SHORTCODES = [
  { code: "{{child_name}}", desc: "Child's full name" },
  { code: "{{parent_name}}", desc: "Parent's full name" },
  { code: "{{date}}", desc: "Relevant date" },
  { code: "{{branch_name}}", desc: "Branch / nursery name" },
  { code: "{{amount}}", desc: "Amount (for payments)" },
];

interface NotificationSettingsClientProps {
  branchId: string;
  branches: { id: string; name: string }[];
  initialSettings: Record<string, string>;
}

export function NotificationSettingsClient({
  branchId: initialBranchId,
  branches,
  initialSettings,
}: NotificationSettingsClientProps) {
  const [branchId, setBranchId] = useState(initialBranchId);
  const [settings, setSettings] = useState(initialSettings);
  const [expandedType, setExpandedType] = useState<string | null>(null);
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

  function getEnabled(config: NotificationConfig): boolean {
    const val = settings[config.settingKeyEnabled];
    return val === undefined ? true : val === "true";
  }

  function getDaysBefore(config: NotificationConfig): string {
    return settings[config.settingKeyDaysBefore] ?? config.defaultDaysBefore;
  }

  function getTemplate(config: NotificationConfig): string {
    return settings[config.settingKeyTemplate] ?? config.defaultTemplate;
  }

  function toggleEnabled(config: NotificationConfig) {
    const newVal = !getEnabled(config);
    setSettings((prev) => ({
      ...prev,
      [config.settingKeyEnabled]: String(newVal),
    }));
    setSaved(false);
  }

  function setDaysBefore(config: NotificationConfig, value: string) {
    setSettings((prev) => ({
      ...prev,
      [config.settingKeyDaysBefore]: value,
    }));
    setSaved(false);
  }

  function setTemplate(config: NotificationConfig, value: string) {
    setSettings((prev) => ({
      ...prev,
      [config.settingKeyTemplate]: value,
    }));
    setSaved(false);
  }

  function handleSave() {
    if (!branchId) return;

    startTransition(async () => {
      for (const config of NOTIFICATION_CONFIGS) {
        await setSetting(
          branchId,
          config.settingKeyEnabled,
          String(getEnabled(config)),
        );
        await setSetting(
          branchId,
          config.settingKeyDaysBefore,
          getDaysBefore(config),
        );
        await setSetting(
          branchId,
          config.settingKeyTemplate,
          getTemplate(config),
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <>
      <PageHeader
        title="Notification Settings"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications" },
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

        {/* Shortcode reference */}
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Info className="size-4 text-muted-foreground" />
              Template Shortcodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SHORTCODES.map((s) => (
                <span
                  key={s.code}
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  <code className="font-mono text-primary">{s.code}</code>
                  <span className="text-muted-foreground">{s.desc}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification type cards */}
        <div className="space-y-3">
          {NOTIFICATION_CONFIGS.map((config) => {
            const Icon = config.icon;
            const enabled = getEnabled(config);
            const daysBefore = getDaysBefore(config);
            const template = getTemplate(config);
            const isExpanded = expandedType === config.type;

            return (
              <Card
                key={config.type}
                className={`overflow-hidden border-l-4 transition-all ${config.borderColor} ${
                  !enabled ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-3 text-left"
                      onClick={() =>
                        setExpandedType(isExpanded ? null : config.type)
                      }
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}
                      >
                        <Icon className={`size-4 ${config.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </button>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleEnabled(config)}
                    />
                  </div>
                </CardHeader>

                {/* Always show days-before row */}
                <CardContent className="pt-3">
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 text-xs text-muted-foreground">
                      Days before
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={daysBefore}
                      onChange={(e) => setDaysBefore(config, e.target.value)}
                      disabled={!enabled}
                      className="h-8 w-20 text-sm"
                    />
                  </div>

                  {/* Expandable template editor */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Message Template
                      </Label>
                      <Textarea
                        value={template}
                        onChange={(e) => setTemplate(config, e.target.value)}
                        disabled={!enabled}
                        rows={3}
                        className="resize-none text-sm"
                        placeholder="Enter notification template..."
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Use shortcodes like{" "}
                        <code className="font-mono text-primary">
                          {"{{child_name}}"}
                        </code>{" "}
                        to personalize messages.
                      </p>
                    </div>
                  )}

                  {!isExpanded && enabled && (
                    <button
                      type="button"
                      onClick={() => setExpandedType(config.type)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Edit template...
                    </button>
                  )}
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
