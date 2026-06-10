"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Pill,
  Shield,
  ClipboardCheck,
  Syringe,
  ShieldCheck,
  LayoutTemplate,
  ScrollText,
  Save,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Calendar,
  AtSign,
  Database,
  DollarSign,
  FileText,
  History,
  KeyRound,
  ListTree,
  BellPlus,
  MailCheck,
  MailPlus,
  Mail,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  type LegacyNotificationLogRow,
  type LegacyNotificationNatureRow,
  type LegacyNotificationSettingRow,
  type LegacyEmailLevelRow,
  type TemplateRow,
  upsertNotificationTemplate,
  getSentNotifications,
  resendNotification,
  sendTestNotification,
  sendLegacyBulkEmail,
  updateLegacyAccountingReminderSetting,
  updateLegacyNotificationChannelSetting,
  updateLegacyNotificationNatureStatus,
  type SentNotificationRow,
} from "@/lib/actions/notification-templates";

type EmailDeliveryStatus = {
  configured: boolean;
  deliveredCount: number;
  skippedCount: number;
  failedCount: number;
  provider: string;
};

function externalEmailStatus(delivery?: EmailDeliveryStatus) {
  if (!delivery) return "";
  if (!delivery.configured) {
    return delivery.skippedCount > 0
      ? ` External email skipped for ${delivery.skippedCount} recipient${delivery.skippedCount === 1 ? "" : "s"}; provider is not configured.`
      : "";
  }
  if (delivery.failedCount > 0) {
    return ` External email sent to ${delivery.deliveredCount}, failed for ${delivery.failedCount}.`;
  }
  return ` External email sent to ${delivery.deliveredCount} via ${delivery.provider}.`;
}

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  BIRTHDAY: {
    label: "Birthday",
    icon: Cake,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-l-pink-500",
  },
  MISSING_REPORTS: {
    label: "Missing Reports",
    icon: ClipboardList,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-l-orange-500",
  },
  MEDICINE: {
    label: "Medicine",
    icon: Pill,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-l-purple-500",
  },
  INSURANCE: {
    label: "Insurance",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-l-blue-500",
  },
  ASSESSMENT: {
    label: "Assessment",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-l-amber-500",
  },
  VACCINATIONS: {
    label: "Vaccinations",
    icon: Syringe,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-l-sky-500",
  },
  PAYMENT: {
    label: "Payment",
    icon: DollarSign,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-l-amber-500",
  },
  PAYMENT_BEFORE: {
    label: "Payment Before",
    icon: DollarSign,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-l-yellow-500",
  },
  PAYMENT_AFTER: {
    label: "Payment After",
    icon: DollarSign,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-l-red-500",
  },
  CONTRACT: {
    label: "Contracts",
    icon: FileText,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-l-teal-500",
  },
  CONTROL: {
    label: "Control",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-l-emerald-500",
  },
  WELCOME: {
    label: "Welcome",
    icon: UserCheck,
    color: "text-lime-700",
    bg: "bg-lime-50",
    border: "border-l-lime-500",
  },
  NEW_USER_NOTIFICATION: {
    label: "New User Notice",
    icon: BellPlus,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-l-violet-500",
  },
  FORGOT_REQUEST: {
    label: "Recover Request",
    icon: KeyRound,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-l-orange-500",
  },
  FORGOT_SUCCESS: {
    label: "Recovered",
    icon: ShieldCheck,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-l-emerald-500",
  },
  ADD_USER: {
    label: "Add User",
    icon: UserPlus,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-l-indigo-500",
  },
  ACCOUNT_UPDATE_VERIFY: {
    label: "Verify Change",
    icon: AtSign,
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-l-slate-500",
  },
  ACCOUNT_UPDATE_SUCCESS: {
    label: "Account Updated",
    icon: MailCheck,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-l-green-500",
  },
  ACTIVATION_RESEND: {
    label: "Resend link",
    icon: MailPlus,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-l-cyan-500",
  },
  ACTIVATION_ACTIVATED: {
    label: "Activated",
    icon: MailCheck,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-l-teal-500",
  },
};

const VARIABLE_CHIPS = [
  { code: "{{child_name}}", label: "Child Name" },
  { code: "{{parent_name}}", label: "Parent Name" },
  { code: "{{date}}", label: "Date" },
  { code: "{{branch_name}}", label: "Branch Name" },
  { code: "{{class_name}}", label: "Class Name" },
  { code: "{{report_name}}", label: "Report Name" },
  { code: "{{med_name}}", label: "Medicine Name" },
  { code: "{{med_time}}", label: "Medicine Time" },
  { code: "{{expiry_date}}", label: "Expiry Date" },
  { code: "{{vaccination_name}}", label: "Vaccination Name" },
  { code: "{{x_days}}", label: "Days Until" },
  { code: "{{family_name}}", label: "Family Name" },
  { code: "{{fees}}", label: "Fees" },
  { code: "{{payment_date}}", label: "Payment Date" },
  { code: "{{person_name}}", label: "Person Name" },
  { code: "{{document_name}}", label: "Document Name" },
  { code: "{{site_address}}", label: "Site address" },
  { code: "{{full_name}}", label: "Full name" },
  { code: "{{username}}", label: "Username" },
  { code: "{{email}}", label: "Email" },
  { code: "{{password}}", label: "Password" },
  { code: "{{reset}}", label: "Reset link" },
  { code: "{{confirm}}", label: "Confirmation link" },
  { code: "{{activate}}", label: "Activation link" },
];

const LOG_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Calendar", label: "Calendar" },
  { value: "General", label: "General" },
  { value: "Assessment", label: "Assessment" },
  { value: "Reports", label: "Reports" },
  { value: "Medicine", label: "Medicine" },
  { value: "Birthdays", label: "Birthdays" },
  { value: "Events", label: "Events" },
  { value: "Insurance", label: "Insurance" },
  { value: "Payments", label: "Payments" },
  { value: "PAYMENT", label: "Payment" },
  { value: "PAYMENT_BEFORE", label: "Payment Before" },
  { value: "PAYMENT_AFTER", label: "Payment After" },
  { value: "CONTRACT", label: "Contracts" },
  { value: "WELCOME", label: "Welcome" },
  { value: "NEW_USER_NOTIFICATION", label: "New User Notice" },
  { value: "FORGOT_REQUEST", label: "Recover Request" },
  { value: "FORGOT_SUCCESS", label: "Recovered" },
  { value: "ADD_USER", label: "Add User" },
  { value: "ACCOUNT_UPDATE_VERIFY", label: "Verify Change" },
  { value: "ACCOUNT_UPDATE_SUCCESS", label: "Account Updated" },
  { value: "ACTIVATION_RESEND", label: "Resend link" },
  { value: "ACTIVATION_ACTIVATED", label: "Activated" },
  { value: "Messages", label: "Messages" },
  { value: "Contracts", label: "Contracts" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationSettingsClientProps {
  initialTemplates: TemplateRow[];
  initialLogs: SentNotificationRow[];
  initialLegacySettings: LegacyNotificationSettingRow[];
  initialLegacyNatures: LegacyNotificationNatureRow[];
  initialLegacyLogs: LegacyNotificationLogRow[];
  initialLegacyEmailLevels: LegacyEmailLevelRow[];
  initialTab?: string;
  initialTemplateCategory?: string;
}

type LegacyChannelKey = "alarms" | "email" | "whatsapp" | "sms";
type AccountingReminderKey =
  | "account-remind-before"
  | "account-remind-after"
  | "account-remind-paid";

const LEGACY_CHANNELS: Array<{ key: LegacyChannelKey; label: string }> = [
  { key: "alarms", label: "System Alerts" },
  { key: "email", label: "Emails" },
  { key: "whatsapp", label: "Whatsapp" },
  { key: "sms", label: "SMS" },
];

const NOTIFICATION_TABS = new Set(["templates", "logs", "bulk", "legacy"]);

const ACCOUNTING_REMINDER_META: Record<
  AccountingReminderKey,
  {
    label: string;
    description: string;
    editable: boolean;
    options: Array<{ value: string; label: string }>;
  }
> = {
  "account-remind-before": {
    label: "Before due date",
    description: "Legacy NotifyBeforePayment day offset",
    editable: true,
    options: [
      { value: "1", label: "1 Day" },
      { value: "3", label: "3 Days" },
      { value: "7", label: "7 Days" },
    ],
  },
  "account-remind-after": {
    label: "After missed payment",
    description: "Legacy NotifyAfterPayment day offset",
    editable: true,
    options: [
      { value: "1", label: "1 Day" },
      { value: "3", label: "3 Days" },
      { value: "7", label: "7 Days" },
      { value: "10", label: "10 Days" },
      { value: "15", label: "15 Days" },
    ],
  },
  "account-remind-paid": {
    label: "Payment confirmation",
    description: "Preserved legacy disabled selector",
    editable: false,
    options: [
      { value: "1", label: "1 Day" },
      { value: "3", label: "3 Days" },
      { value: "7", label: "7 Days" },
    ],
  },
};

function legacyMtypeChannel(data: Record<string, unknown> | null) {
  const mtype = Number(data?.mtype);
  if (mtype === 1) return "whatsapp";
  if (mtype === 2) return "sms";
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationSettingsClient({
  initialTemplates,
  initialLogs,
  initialLegacySettings,
  initialLegacyNatures,
  initialLegacyLogs,
  initialLegacyEmailLevels,
  initialTab,
  initialTemplateCategory,
}: NotificationSettingsClientProps) {
  const [tab, setTab] = useState(
    NOTIFICATION_TABS.has(initialTab ?? "") ? (initialTab as string) : "templates",
  );

  return (
    <>
      <PageHeader
        title="Notifications Hub"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications" },
        ]}
      />
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate className="size-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <ScrollText className="size-3.5" />
              Sent Logs
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5">
              <Mail className="size-3.5" />
              Bulk Email
            </TabsTrigger>
            <TabsTrigger value="legacy" className="gap-1.5">
              <Database className="size-3.5" />
              Legacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <TemplatesTab
              initialTemplates={initialTemplates}
              initialCategory={initialTemplateCategory}
            />
          </TabsContent>

          <TabsContent value="logs">
            <SentLogsTab initialLogs={initialLogs} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkEmailTab initialLevels={initialLegacyEmailLevels} />
          </TabsContent>

          <TabsContent value="legacy">
            <LegacyTab
              settings={initialLegacySettings}
              natures={initialLegacyNatures}
              logs={initialLegacyLogs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab A: Templates
// ═══════════════════════════════════════════════════════════════════════════

function TemplatesTab({
  initialTemplates,
  initialCategory,
}: {
  initialTemplates: TemplateRow[];
  initialCategory?: string;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isPending, startTransition] = useTransition();
  const [isTestingPending, startTestingTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{
    category: string;
    success: boolean;
    message: string;
  } | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const targetCategory = initialCategory?.trim().toUpperCase();

  useEffect(() => {
    if (!targetCategory) return;
    const element = document.getElementById(
      `template-${targetCategory.toLowerCase()}`,
    );
    element?.scrollIntoView({ block: "start" });
  }, [targetCategory]);

  const updateField = useCallback(
    (category: string, field: keyof TemplateRow, value: string | boolean) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.category === category ? { ...t, [field]: value } : t,
        ),
      );
      setSaved(false);
    },
    [],
  );

  function insertVariable(category: string, code: string) {
    const textarea = textareaRefs.current[category];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody =
      templates.find((t) => t.category === category)?.body ?? "";
    const newBody =
      currentBody.substring(0, start) + code + currentBody.substring(end);
    updateField(category, "body", newBody);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + code.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  function handleSaveAll() {
    startTransition(async () => {
      for (const t of templates) {
        await upsertNotificationTemplate(t.category, {
          enabled: t.enabled,
          subject: t.subject,
          body: t.body,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  function handleSendTest(template: TemplateRow) {
    setTestingCategory(template.category);
    setTestStatus(null);
    startTestingTransition(async () => {
      const result = await sendTestNotification(template.category, {
        enabled: template.enabled,
        subject: template.subject,
        body: template.body,
      });
      setTestingCategory(null);
      setTestStatus({
        category: template.category,
        success: result.success,
        message: result.success
          ? `Test sent to your notifications.${externalEmailStatus(result.data?.emailDelivery)}`
          : result.error ?? "Test send failed.",
      });
    });
  }

  return (
    <div className="space-y-4">
      {templates.map((t) => {
        const meta = CATEGORY_META[t.category];
        if (!meta) return null;
        const Icon = meta.icon;

        return (
          <Card
            key={t.category}
            id={`template-${t.category.toLowerCase()}`}
            className={`overflow-hidden border-l-4 transition-all ${meta.border} ${!t.enabled ? "opacity-50" : ""}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                  >
                    <Icon className={`size-4 ${meta.color}`} />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {meta.label}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTest(t)}
                    disabled={!t.enabled || isTestingPending}
                    className="h-8 gap-1.5"
                  >
                    <Send className="size-3.5" />
                    {testingCategory === t.category ? "Sending..." : "Test"}
                  </Button>
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={(val) =>
                      updateField(t.category, "enabled", val)
                    }
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Subject */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={t.subject}
                  onChange={(e) =>
                    updateField(t.category, "subject", e.target.value)
                  }
                  disabled={!t.enabled}
                  placeholder="Notification subject..."
                  className="h-9 text-sm"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Message Body
                </Label>
                <Textarea
                  ref={(el) => {
                    textareaRefs.current[t.category] = el;
                  }}
                  value={t.body}
                  onChange={(e) =>
                    updateField(t.category, "body", e.target.value)
                  }
                  disabled={!t.enabled}
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Notification body..."
                />
              </div>

              {/* Variable chips */}
              {t.enabled && (
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_CHIPS.map((v) => (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => insertVariable(t.category, v.code)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <code className="font-mono text-[10px]">{v.code}</code>
                    </button>
                  ))}
                </div>
              )}

              {testStatus?.category === t.category && (
                <p
                  className={`text-xs ${
                    testStatus.success ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {testStatus.message}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSaveAll} disabled={isPending}>
          <Save className="mr-2 size-4" />
          {isPending ? "Saving..." : "Save All Templates"}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600">
            Templates saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab B: Bulk Email
// ═══════════════════════════════════════════════════════════════════════════

function BulkEmailTab({
  initialLevels,
}: {
  initialLevels: LegacyEmailLevelRow[];
}) {
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleLevel(id: string, checked: boolean) {
    setSelectedLevels((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id),
    );
    setStatus(null);
  }

  function handleSend() {
    setStatus(null);
    startTransition(async () => {
      const result = await sendLegacyBulkEmail({
        levelIds: selectedLevels,
        subject,
        message,
      });

      if (result.success && result.data) {
        setStatus({
          success: true,
          text: `Sent ${result.data.sentCount} in-app notification${result.data.sentCount === 1 ? "" : "s"} across ${result.data.selectedLevels} group${result.data.selectedLevels === 1 ? "" : "s"}.${externalEmailStatus(result.data.emailDelivery)}`,
        });
        if (result.data.sentCount > 0) {
          setSubject("");
          setMessage("");
          setSelectedLevels([]);
        }
      } else {
        setStatus({
          success: false,
          text: result.error ?? "Send failed.",
        });
      }
    });
  }

  const activeLevels = initialLevels.filter((level) => !level.isDisabled);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {initialLevels.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No legacy levels found.
                </div>
              ) : (
                initialLevels.map((level) => {
                  const checked = selectedLevels.includes(level.id);
                  return (
                    <label
                      key={level.id}
                      className={`flex min-h-16 items-start gap-3 rounded-md border px-3 py-2 ${
                        level.isDisabled ? "opacity-50" : "cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={level.isDisabled || isPending}
                        onCheckedChange={(value) =>
                          toggleLevel(level.id, value === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {level.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {level.sourceDatabase} / {level.legacyTable} #{level.legacyId}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {activeLevels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLevels(activeLevels.map((level) => level.id))}
                  disabled={isPending}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLevels([])}
                  disabled={isPending || selectedLevels.length === 0}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={isPending}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isPending}
              rows={5}
              className="text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSend}
              disabled={isPending}
              className="gap-2"
            >
              <Send className="size-4" />
              {isPending ? "Sending..." : "Send now"}
            </Button>
            {status && (
              <span
                className={`text-sm ${
                  status.success ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {status.text}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab C: Sent Logs
// ═══════════════════════════════════════════════════════════════════════════

function SentLogsTab({
  initialLogs,
}: {
  initialLogs: SentNotificationRow[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [resendingId, setResendingId] = useState<string | null>(null);

  function handleFilter() {
    startTransition(async () => {
      const result = await getSentNotifications({
        category: category || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      if (result.success && result.data) {
        setLogs(result.data);
      }
    });
  }

  function handleResend(id: string) {
    setResendingId(id);
    startTransition(async () => {
      await resendNotification(id);
      setResendingId(null);
      // Refresh
      const result = await getSentNotifications({
        category: category || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      if (result.success && result.data) {
        setLogs(result.data);
      }
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={category || "_all"}
                onValueChange={(v) => setCategory(v === "_all" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_CATEGORIES.map((c) => (
                    <SelectItem key={c.value || "_all"} value={c.value || "_all"}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 w-[160px] pl-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 w-[160px] pl-8 text-sm"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilter}
              disabled={isPending}
              className="h-9"
            >
              {isPending ? "Loading..." : "Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                ID
              </TableHead>
              <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Content
              </TableHead>
              <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No notifications found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, idx) => (
                <TableRow
                  key={log.id}
                  className="transition-colors hover:bg-accent/50 even:bg-secondary/30"
                >
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium capitalize"
                    >
                      {log.type || log.category || "General"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate px-4 py-3 text-sm">
                    <span className="font-medium">{log.title}</span>
                    {log.body && (
                      <span className="ml-1 text-muted-foreground">
                        — {log.body.substring(0, 60)}
                        {log.body.length > 60 ? "..." : ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {log.isRead ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <Eye className="size-3" />
                        Seen
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-200 bg-amber-50 text-amber-700"
                      >
                        <EyeOff className="size-3" />
                        Unseen
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResend(log.id)}
                      disabled={resendingId === log.id}
                      className="h-7 gap-1 text-xs"
                    >
                      <RotateCcw className="size-3" />
                      {resendingId === log.id ? "Sending..." : "Resend"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {logs.length} notification{logs.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab C: Legacy
// ═══════════════════════════════════════════════════════════════════════════

function LegacyTab({
  settings,
  natures,
  logs,
}: {
  settings: LegacyNotificationSettingRow[];
  natures: LegacyNotificationNatureRow[];
  logs: LegacyNotificationLogRow[];
}) {
  const [legacySettings, setLegacySettings] = useState(settings);
  const [legacyNatures, setLegacyNatures] = useState(natures);
  const [channelMessage, setChannelMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [reminderMessage, setReminderMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [natureMessage, setNatureMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [pendingChannel, setPendingChannel] = useState<string | null>(null);
  const [pendingReminder, setPendingReminder] = useState<string | null>(null);
  const [pendingNature, setPendingNature] = useState<string | null>(null);
  const [isChannelPending, startChannelTransition] = useTransition();
  const [isReminderPending, startReminderTransition] = useTransition();
  const [isNaturePending, startNatureTransition] = useTransition();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function shortValue(value: string | null) {
    if (!value) return "-";
    return value.length > 90 ? `${value.slice(0, 90)}...` : value;
  }

  function statusLabel(status: number | null) {
    if (status === null) return "Unknown";
    if (status === 1) return "Enabled";
    if (status === 0) return "Disabled";
    return String(status);
  }

  function settingStatusLabel(value: string | null) {
    if (value === null || value.trim() === "") return "Unknown";
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? statusLabel(numericValue) : value;
  }

  function isNumericStatusValue(value: string | null) {
    if (value === null || value.trim() === "") return false;
    return Number.isFinite(Number(value));
  }

  function parseJsonObject(value: string | null) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  function settingData(setting: LegacyNotificationSettingRow) {
    const raw = setting.legacyData;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    return parseJsonObject(setting.settingValue);
  }

  function channelValue(
    setting: LegacyNotificationSettingRow,
    channel: LegacyChannelKey,
  ) {
    const data = settingData(setting);
    if (!data) return null;
    const value = Number(data[channel]);
    if (Number.isFinite(value)) return value;
    if (legacyMtypeChannel(data) !== channel) return null;
    const status = Number(data.status);
    return Number.isFinite(status) ? status : null;
  }

  function channelName(setting: LegacyNotificationSettingRow) {
    const data = settingData(setting);
    const name = data?.name;
    if (typeof name === "string" && name.trim() !== "") return name.trim();
    const mtypeChannel = legacyMtypeChannel(data);
    const channel = LEGACY_CHANNELS.find((item) => item.key === mtypeChannel);
    return channel?.label ?? setting.settingKey;
  }

  function hasChannelMatrix(setting: LegacyNotificationSettingRow) {
    return (
      setting.legacyTable === "t_notification_setting" &&
      LEGACY_CHANNELS.some(({ key }) => channelValue(setting, key) !== null)
    );
  }

  function isAccountingReminderKey(value: string): value is AccountingReminderKey {
    return value in ACCOUNTING_REMINDER_META;
  }

  function isAccountingReminderSetting(setting: LegacyNotificationSettingRow) {
    return (
      ["login_settings", "login_settings_man"].includes(setting.legacyTable) &&
      isAccountingReminderKey(setting.settingKey)
    );
  }

  function accountingReminderValue(setting: LegacyNotificationSettingRow) {
    return setting.settingValue?.trim() || "1";
  }

  function accountingReminderOptions(setting: LegacyNotificationSettingRow) {
    const key = setting.settingKey;
    if (!isAccountingReminderKey(key)) return [];
    const value = accountingReminderValue(setting);
    const base = ACCOUNTING_REMINDER_META[key].options;
    if (base.some((option) => option.value === value)) return base;
    return [...base, { value, label: `${value} Day${value === "1" ? "" : "s"}` }];
  }

  const channelSettings = legacySettings.filter(hasChannelMatrix);
  const accountingReminderSettings = legacySettings
    .filter(isAccountingReminderSetting)
    .sort((a, b) => {
      const sourceCompare = a.sourceDatabase.localeCompare(b.sourceDatabase);
      if (sourceCompare !== 0) return sourceCompare;
      const tableCompare = a.legacyTable.localeCompare(b.legacyTable);
      if (tableCompare !== 0) return tableCompare;
      return a.settingKey.localeCompare(b.settingKey);
    });

  function handleChannelToggle(
    setting: LegacyNotificationSettingRow,
    channel: LegacyChannelKey,
    enabled: boolean,
  ) {
    const pendingKey = `${setting.id}:${channel}`;
    setPendingChannel(pendingKey);
    setChannelMessage(null);
    startChannelTransition(async () => {
      const result = await updateLegacyNotificationChannelSetting(
        setting.id,
        channel,
        enabled,
      );
      if (result.success && result.data) {
        setLegacySettings((prev) =>
          prev.map((row) => (row.id === result.data!.id ? result.data! : row)),
        );
        setChannelMessage({
          success: true,
          text: "Legacy channel updated.",
        });
      } else {
        setChannelMessage({
          success: false,
          text: result.error ?? "Legacy channel update failed.",
        });
      }
      setPendingChannel(null);
    });
  }

  function handleAccountingReminderChange(
    setting: LegacyNotificationSettingRow,
    value: string,
  ) {
    const key = setting.settingKey;
    if (
      !isAccountingReminderKey(key) ||
      !ACCOUNTING_REMINDER_META[key].editable
    ) {
      return;
    }

    setPendingReminder(setting.id);
    setReminderMessage(null);
    startReminderTransition(async () => {
      const result = await updateLegacyAccountingReminderSetting(
        setting.id,
        value,
      );
      if (result.success && result.data) {
        setLegacySettings((prev) =>
          prev.map((row) => (row.id === result.data!.id ? result.data! : row)),
        );
        setReminderMessage({
          success: true,
          text: "Legacy accounting reminder updated.",
        });
      } else {
        setReminderMessage({
          success: false,
          text: result.error ?? "Legacy accounting reminder update failed.",
        });
      }
      setPendingReminder(null);
    });
  }

  function handleNatureToggle(
    nature: LegacyNotificationNatureRow,
    isActive: boolean,
  ) {
    setPendingNature(nature.id);
    setNatureMessage(null);
    startNatureTransition(async () => {
      const result = await updateLegacyNotificationNatureStatus(
        nature.id,
        isActive,
      );
      if (result.success && result.data) {
        setLegacyNatures((prev) =>
          prev.map((row) => (row.id === result.data!.id ? result.data! : row)),
        );
        setNatureMessage({
          success: true,
          text: "Legacy notification nature updated.",
        });
      } else {
        setNatureMessage({
          success: false,
          text: result.error ?? "Legacy notification nature update failed.",
        });
      }
      setPendingNature(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-normal">
                Settings
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {legacySettings.length}
              </div>
            </div>
            <Database className="size-5" />
          </div>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-violet-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-normal">
                Natures
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {legacyNatures.length}
              </div>
              <div className="mt-1 text-xs">
                {legacyNatures.filter((nature) => nature.isActive).length} active
              </div>
            </div>
            <ListTree className="size-5" />
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-normal">
                Logs
              </div>
              <div className="mt-1 text-2xl font-semibold">{logs.length}</div>
            </div>
            <History className="size-5" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-amber-600" />
            Accounting Reminder Days
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Source
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Table
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Reminder
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Days
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Legacy Key
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountingReminderSettings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No legacy accounting reminder settings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  accountingReminderSettings.map((setting) => {
                    const key = setting.settingKey;
                    if (!isAccountingReminderKey(key)) return null;
                    const meta = ACCOUNTING_REMINDER_META[key];
                    const value = accountingReminderValue(setting);
                    const options = accountingReminderOptions(setting);
                    const pending = pendingReminder === setting.id;

                    return (
                      <TableRow key={`accounting-reminder-${setting.id}`}>
                        <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                          {setting.sourceDatabase}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {setting.legacyTable}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm font-medium">{meta.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {meta.description}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {meta.editable ? (
                            <Select
                              value={value}
                              onValueChange={(nextValue) =>
                                handleAccountingReminderChange(
                                  setting,
                                  nextValue,
                                )
                              }
                              disabled={isReminderPending && pending}
                            >
                              <SelectTrigger className="h-9 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((option) => (
                                  <SelectItem
                                    key={`${setting.id}-${option.value}`}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {options.find((option) => option.value === value)
                                  ?.label ?? shortValue(value)}
                              </Badge>
                              <Badge variant="outline">Locked</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <code className="text-xs">{setting.settingKey}</code>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {reminderMessage && (
            <p
              className={`text-xs ${
                reminderMessage.success ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {reminderMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Legacy Notifications/Alerts Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Source
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Notification
                  </TableHead>
                  {LEGACY_CHANNELS.map((channel) => (
                    <TableHead
                      key={channel.key}
                      className="bg-secondary/40 px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground"
                    >
                      {channel.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelSettings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No legacy channel controls found.
                    </TableCell>
                  </TableRow>
                ) : (
                  channelSettings.map((setting) => (
                    <TableRow key={`channels-${setting.id}`}>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                        {setting.sourceDatabase}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        {channelName(setting)}
                      </TableCell>
                      {LEGACY_CHANNELS.map((channel) => {
                        const value = channelValue(setting, channel.key);
                        const isLocked = value === -1 || value === null;
                        const pendingKey = `${setting.id}:${channel.key}`;
                        return (
                          <TableCell
                            key={channel.key}
                            className="px-4 py-3 text-center"
                          >
                            {isLocked ? (
                              <Badge variant="outline">Unavailable</Badge>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <Switch
                                  checked={value === 1}
                                  disabled={
                                    isChannelPending &&
                                    pendingChannel === pendingKey
                                  }
                                  onCheckedChange={(checked) =>
                                    handleChannelToggle(
                                      setting,
                                      channel.key,
                                      checked,
                                    )
                                  }
                                />
                                <span className="min-w-14 text-left text-xs text-muted-foreground">
                                  {value === 1 ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {channelMessage && (
            <p
              className={`text-xs ${
                channelMessage.success ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {channelMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Source
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Table
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Key
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legacySettings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No legacy settings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  legacySettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                        {setting.sourceDatabase}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {setting.legacyTable}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        {setting.settingKey}
                      </TableCell>
                      <TableCell className="max-w-[360px] px-4 py-3 text-sm text-muted-foreground">
                        {setting.legacyTable === "t_notification_setting" &&
                        isNumericStatusValue(setting.settingValue) ? (
                          <Badge variant="secondary">
                            {settingStatusLabel(setting.settingValue)}
                          </Badge>
                        ) : (
                          shortValue(setting.settingValue)
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy Notification Natures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Content
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Delivery
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Parent
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legacyNatures.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No legacy notification natures found.
                    </TableCell>
                  </TableRow>
                ) : (
                  legacyNatures.map((nature) => (
                    <TableRow key={nature.id}>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium">{nature.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {nature.sourceDatabase} #{nature.legacyId}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {nature.contentTable ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {nature.deliveryTable ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {nature.parentDeliveryTable ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={nature.isActive}
                            disabled={
                              isNaturePending && pendingNature === nature.id
                            }
                            onCheckedChange={(checked) =>
                              handleNatureToggle(nature, checked)
                            }
                          />
                          <Badge
                            variant="outline"
                            className={
                              nature.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }
                          >
                            {nature.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {natureMessage && (
            <p
              className={`mt-3 text-xs ${
                natureMessage.success ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {natureMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy Send Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[780px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Child
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Expiry
                  </TableHead>
                  <TableHead className="bg-secondary/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No legacy notification logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        {log.name ?? `Legacy #${log.legacyId}`}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {log.childName ??
                          (log.legacyChildId ? `Legacy child #${log.legacyChildId}` : "-")}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {log.expiryDate ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="secondary">{statusLabel(log.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
