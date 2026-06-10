"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type LegacyAuthGeneralSettingsInput,
  type LegacyAuthDeniedSettingsInput,
  type LegacyAuthIntegrationSettingsInput,
  type LegacyAuthLevelOption,
  type LegacyAuthSettingsData,
  type LegacyAuthSettingsSource,
  type LegacyAuthUpdateSettingsInput,
  updateLegacyAuthDeniedSettings,
  updateLegacyAuthGeneralSettings,
  updateLegacyAuthIntegrationSettings,
  updateLegacyAuthUpdateSettings,
} from "@/lib/actions/legacy-auth-settings";
import { cn } from "@/lib/utils";
import { ArrowLeft, Info, KeyRound, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type LegacyAuthSettingsClientProps = {
  initialData: LegacyAuthSettingsData;
  initialError?: string | null;
  initialTab?: string;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

type GeneralFormState = Omit<
  LegacyAuthGeneralSettingsInput,
  "restrictSignupDomains"
> & {
  restrictSignupDomainsText: string;
};

type DeniedFormState = LegacyAuthDeniedSettingsInput;
type IntegrationFormState = LegacyAuthIntegrationSettingsInput;
type UpdateFormState = LegacyAuthUpdateSettingsInput;

function settingValue(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
  key: string,
) {
  if (!source) return "";
  return (
    data.settings.find(
      (setting) =>
        setting.sourceDatabase === source.sourceDatabase &&
        setting.legacyTable === source.legacyTable &&
        setting.settingKey === key,
    )?.settingValue ?? ""
  );
}

function isEnabled(value: string) {
  return value === "1" || value.toLowerCase() === "true";
}

function parsePhpStringArray(value: string | null | undefined) {
  if (!value) return [];
  const matches = Array.from(value.matchAll(/s:\d+:"([^"]*)"/g)).map(
    (match) => match[1],
  );
  if (matches.length) return matches;

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parsePhpNumberArray(value: string | null | undefined) {
  const serialized = parsePhpStringArray(value)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isInteger(part) && part > 0);
  if (serialized.length) return serialized;

  const direct = Number.parseInt(value ?? "", 10);
  return Number.isInteger(direct) && direct > 0 ? [direct] : [];
}

function splitDomains(value: string) {
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function createGeneralForm(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
): GeneralFormState {
  const key = source?.key ?? "";
  const get = (setting: string) => settingValue(data, source, setting);

  return {
    sourceKey: key,
    adminEmail: get("admin_email"),
    siteAddress: get("site_address"),
    defaultSession: get("default_session") || "0",
    defaultLevelIds: parsePhpNumberArray(get("default-level")),
    customAvatarEnabled: isEnabled(get("custom-avatar-enable")),
    emailAsUsernameEnabled: isEnabled(get("email-as-username-enable")),
    disableRegistrationsEnabled: isEnabled(get("disable-registrations-enable")),
    disableLoginsEnabled: isEnabled(get("disable-logins-enable")),
    userActivationEnabled: isEnabled(get("user-activation-enable")),
    emailWelcomeDisabled: isEnabled(get("email-welcome-disable")),
    notifyNewUserEnabled: isEnabled(get("notify-new-user-enable")),
    notifyNewUserLevelIds: parsePhpNumberArray(get("notify-new-users")),
    restrictSignupDomainsText: parsePhpStringArray(
      get("restrict-signups-by-email"),
    ).join(", "),
    passwordEncryptForceEnabled: isEnabled(get("pw-encrypt-force-enable")),
    passwordEncryption: get("pw-encryption") === "SHA256" ? "SHA256" : "MD5",
    guestRedirect: get("guest-redirect"),
    newUserRedirect: get("new-user-redirect"),
    signoutRedirectReferrerEnabled: isEnabled(
      get("signout-redirect-referrer-enable"),
    ),
    signoutRedirectUrl: get("signout-redirect-url"),
    signinRedirectReferrerEnabled: isEnabled(
      get("signin-redirect-referrer-enable"),
    ),
    signinRedirectUrl: get("signin-redirect-url"),
  };
}

function createDeniedForm(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
): DeniedFormState {
  const key = source?.key ?? "";
  const get = (setting: string) => settingValue(data, source, setting);

  return {
    sourceKey: key,
    blockMessageEnabled: isEnabled(get("block-msg-enable")),
    blockMessage: get("block-msg"),
    guestBlockMessageEnabled: isEnabled(get("block-msg-out-enable")),
    guestBlockMessage: get("block-msg-out"),
  };
}

function createIntegrationForm(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
): IntegrationFormState {
  const key = source?.key ?? "";
  const get = (setting: string) => settingValue(data, source, setting);
  const captchaProvider = get("integration-captcha");

  return {
    sourceKey: key,
    twitterEnabled: isEnabled(get("integration-twitter-enable")),
    twitterKey: get("twitter-key"),
    twitterSecret: get("twitter-secret"),
    facebookEnabled: isEnabled(get("integration-facebook-enable")),
    facebookAppId: get("facebook-app-id"),
    facebookAppSecret: get("facebook-app-secret"),
    googleEnabled: isEnabled(get("integration-google-enable")),
    googleId: get("google-id"),
    googleSecret: get("google-secret"),
    yahooEnabled: isEnabled(get("integration-yahoo-enable")),
    captchaProvider:
      captchaProvider === "reCAPTCHA" || captchaProvider === "playThru"
        ? captchaProvider
        : "disableCaptcha",
    recaptchaPublicKey: get("reCAPTCHA-public-key"),
    recaptchaPrivateKey: get("reCAPTCHA-private-key"),
    playThruPublisherKey: get("playThru-publisher-key"),
    playThruScoringKey: get("playThru-scoring-key"),
  };
}

function createUpdateForm(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
): UpdateFormState {
  const key = source?.key ?? "";

  return {
    sourceKey: key,
    updateCheckEnabled: isEnabled(
      settingValue(data, source, "update-check-enable"),
    ),
  };
}

function levelOptionsForSource(
  data: LegacyAuthSettingsData,
  source: LegacyAuthSettingsSource | null,
) {
  if (!source) return [];
  return data.levels.filter(
    (level) =>
      level.sourceDatabase === source.sourceDatabase &&
      level.recordType === source.levelRecordType,
  );
}

function messageClass(message: MessageState) {
  if (!message) return "";
  return message.type === "success"
    ? "border-[#b8dfd6] bg-[#eefaf7] text-[#0f6f61]"
    : "border-[#f0c2bc] bg-[#fff3f1] text-[#9b2f24]";
}

export function LegacyAuthSettingsClient({
  initialData,
  initialError,
  initialTab,
}: LegacyAuthSettingsClientProps) {
  const [data, setData] = useState(initialData);
  const [sourceKey, setSourceKey] = useState(initialData.sources[0]?.key ?? "");
  const selectedSource = useMemo(
    () => data.sources.find((source) => source.key === sourceKey) ?? null,
    [data.sources, sourceKey],
  );
  const [activeTab, setActiveTab] = useState(
    ["denied", "integration", "update"].includes(initialTab ?? "")
      ? (initialTab as string)
      : "general",
  );
  const [message, setMessage] = useState<MessageState>(
    initialError ? { type: "error", text: initialError } : null,
  );
  const [generalForm, setGeneralForm] = useState<GeneralFormState>(() =>
    createGeneralForm(initialData, initialData.sources[0] ?? null),
  );
  const [deniedForm, setDeniedForm] = useState<DeniedFormState>(() =>
    createDeniedForm(initialData, initialData.sources[0] ?? null),
  );
  const [integrationForm, setIntegrationForm] =
    useState<IntegrationFormState>(() =>
      createIntegrationForm(initialData, initialData.sources[0] ?? null),
    );
  const [updateForm, setUpdateForm] = useState<UpdateFormState>(() =>
    createUpdateForm(initialData, initialData.sources[0] ?? null),
  );
  const [isPending, startTransition] = useTransition();

  const levels = useMemo(
    () => levelOptionsForSource(data, selectedSource),
    [data, selectedSource],
  );

  function handleSourceChange(nextSourceKey: string) {
    const source =
      data.sources.find((candidate) => candidate.key === nextSourceKey) ?? null;
    setSourceKey(nextSourceKey);
    setGeneralForm(createGeneralForm(data, source));
    setDeniedForm(createDeniedForm(data, source));
    setIntegrationForm(createIntegrationForm(data, source));
    setUpdateForm(createUpdateForm(data, source));
    setMessage(null);
  }

  function syncForms(nextData: LegacyAuthSettingsData, nextSourceKey = sourceKey) {
    const source =
      nextData.sources.find((candidate) => candidate.key === nextSourceKey) ??
      null;
    setData(nextData);
    setSourceKey(source?.key ?? "");
    setGeneralForm(createGeneralForm(nextData, source));
    setDeniedForm(createDeniedForm(nextData, source));
    setIntegrationForm(createIntegrationForm(nextData, source));
    setUpdateForm(createUpdateForm(nextData, source));
  }

  function updateGeneral<K extends keyof GeneralFormState>(
    key: K,
    value: GeneralFormState[K],
  ) {
    setGeneralForm((current) => ({ ...current, [key]: value }));
  }

  function updateDenied<K extends keyof DeniedFormState>(
    key: K,
    value: DeniedFormState[K],
  ) {
    setDeniedForm((current) => ({ ...current, [key]: value }));
  }

  function updateIntegration<K extends keyof IntegrationFormState>(
    key: K,
    value: IntegrationFormState[K],
  ) {
    setIntegrationForm((current) => ({ ...current, [key]: value }));
  }

  function updateUpdateForm<K extends keyof UpdateFormState>(
    key: K,
    value: UpdateFormState[K],
  ) {
    setUpdateForm((current) => ({ ...current, [key]: value }));
  }

  function toggleId(values: number[], id: number) {
    return values.includes(id)
      ? values.filter((value) => value !== id)
      : [...values, id].sort((a, b) => a - b);
  }

  function saveGeneral() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLegacyAuthGeneralSettings({
        ...generalForm,
        sourceKey,
        restrictSignupDomains: splitDomains(
          generalForm.restrictSignupDomainsText,
        ),
      });
      if (result.success && result.data) {
        syncForms(result.data);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to update general options";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function saveDenied() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLegacyAuthDeniedSettings({
        ...deniedForm,
        sourceKey,
      });
      if (result.success && result.data) {
        syncForms(result.data);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to update denied messages";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function saveIntegration() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLegacyAuthIntegrationSettings({
        ...integrationForm,
        sourceKey,
      });
      if (result.success && result.data) {
        syncForms(result.data);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to update integration settings";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  function saveUpdateSettings() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLegacyAuthUpdateSettings({
        ...updateForm,
        sourceKey,
      });
      if (result.success && result.data) {
        syncForms(result.data);
        setMessage({ type: "success", text: "Settings updated." });
        toast.success("Settings updated.");
        return;
      }

      const error = result.error ?? "Failed to update update settings";
      setMessage({ type: "error", text: error });
      toast.error(error);
    });
  }

  if (!data.sources.length) {
    return (
      <>
        <PageHeader
          title="Legacy Auth Settings"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Legacy Auth Settings" },
          ]}
        />
        <div className="p-4 md:p-6">
          <div className="rounded-sm border border-border bg-background p-6 text-sm text-muted-foreground">
            No legacy login settings found.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Legacy Auth Settings"
        description="Migrated PHP login settings for sessions, access-denied copy, redirects, and new-user defaults"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Legacy Auth Settings" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/settings">
              <ArrowLeft className="size-4" />
              Settings
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {message ? (
          <div
            className={cn(
              "rounded-sm border px-3 py-2 text-sm",
              messageClass(message),
            )}
          >
            {message.text}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4" />
              Source
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedSource?.sourceDatabase} / {selectedSource?.legacyTable}
            </div>
          </div>
          <Select value={sourceKey} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-full md:w-[320px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.sources.map((source) => (
                <SelectItem key={source.key} value={source.key}>
                  {source.sourceDatabase} / {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">General Options</TabsTrigger>
            <TabsTrigger value="denied">Denied</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="update">Update</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="space-y-6 rounded-sm border border-border bg-background p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Admin email" htmlFor="legacy-admin-email">
                  <Input
                    id="legacy-admin-email"
                    type="email"
                    value={generalForm.adminEmail}
                    onChange={(event) =>
                      updateGeneral("adminEmail", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field label="Site address" htmlFor="legacy-site-address">
                  <Input
                    id="legacy-site-address"
                    value={generalForm.siteAddress}
                    onChange={(event) =>
                      updateGeneral("siteAddress", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field label="Default session" htmlFor="legacy-default-session">
                  <Input
                    id="legacy-default-session"
                    type="number"
                    min={0}
                    value={generalForm.defaultSession}
                    onChange={(event) =>
                      updateGeneral("defaultSession", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
              </div>

              <LevelChecklist
                label="Default level"
                levels={levels}
                selectedIds={generalForm.defaultLevelIds}
                disabled={isPending}
                onToggle={(id) =>
                  updateGeneral(
                    "defaultLevelIds",
                    toggleId(generalForm.defaultLevelIds, id),
                  )
                }
              />

              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxField
                  label="Allow custom avatar uploads"
                  checked={generalForm.customAvatarEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("customAvatarEnabled", checked)
                  }
                />
                <CheckboxField
                  label="Use email addresses instead of usernames"
                  checked={generalForm.emailAsUsernameEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("emailAsUsernameEnabled", checked)
                  }
                />
                <CheckboxField
                  label="Disable registrations"
                  checked={generalForm.disableRegistrationsEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("disableRegistrationsEnabled", checked)
                  }
                />
                <CheckboxField
                  label="Disable logins"
                  checked={generalForm.disableLoginsEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("disableLoginsEnabled", checked)
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">New users</div>
                  <CheckboxField
                    label="Require email activation for new users"
                    checked={generalForm.userActivationEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateGeneral("userActivationEnabled", checked)
                    }
                  />
                  <CheckboxField
                    label="Do not send the welcome email when a new user registers"
                    checked={generalForm.emailWelcomeDisabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateGeneral("emailWelcomeDisabled", checked)
                    }
                  />
                  <CheckboxField
                    label="Notify a user group on new registrations"
                    checked={generalForm.notifyNewUserEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateGeneral("notifyNewUserEnabled", checked)
                    }
                  />
                  <LevelChecklist
                    label="Notify levels"
                    levels={levels}
                    selectedIds={generalForm.notifyNewUserLevelIds}
                    disabled={isPending}
                    compact
                    onToggle={(id) =>
                      updateGeneral(
                        "notifyNewUserLevelIds",
                        toggleId(generalForm.notifyNewUserLevelIds, id),
                      )
                    }
                  />
                </div>

                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">Password encryption</div>
                  <CheckboxField
                    label="Force user to update password if not using selected encryption method"
                    checked={generalForm.passwordEncryptForceEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateGeneral("passwordEncryptForceEnabled", checked)
                    }
                  />
                  <Select
                    value={generalForm.passwordEncryption}
                    onValueChange={(value) =>
                      updateGeneral(
                        "passwordEncryption",
                        value === "SHA256" ? "SHA256" : "MD5",
                      )
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MD5">MD5</SelectItem>
                      <SelectItem value="SHA256">SHA256</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Field
                label="Restrict email domains"
                htmlFor="legacy-restrict-domains"
              >
                <Input
                  id="legacy-restrict-domains"
                  value={generalForm.restrictSignupDomainsText}
                  onChange={(event) =>
                    updateGeneral(
                      "restrictSignupDomainsText",
                      event.target.value,
                    )
                  }
                  disabled={isPending}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Guests redirect" htmlFor="legacy-guest-redirect">
                  <Input
                    id="legacy-guest-redirect"
                    value={generalForm.guestRedirect}
                    onChange={(event) =>
                      updateGeneral("guestRedirect", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field
                  label="New users redirect"
                  htmlFor="legacy-new-user-redirect"
                >
                  <Input
                    id="legacy-new-user-redirect"
                    value={generalForm.newUserRedirect}
                    onChange={(event) =>
                      updateGeneral("newUserRedirect", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RedirectBlock
                  label="Sign out"
                  checked={generalForm.signoutRedirectReferrerEnabled}
                  url={generalForm.signoutRedirectUrl}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("signoutRedirectReferrerEnabled", checked)
                  }
                  onUrlChange={(value) =>
                    updateGeneral("signoutRedirectUrl", value)
                  }
                />
                <RedirectBlock
                  label="Sign in"
                  checked={generalForm.signinRedirectReferrerEnabled}
                  url={generalForm.signinRedirectUrl}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateGeneral("signinRedirectReferrerEnabled", checked)
                  }
                  onUrlChange={(value) =>
                    updateGeneral("signinRedirectUrl", value)
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveGeneral} disabled={isPending}>
                  <Save className="size-4" />
                  {isPending ? "Saving..." : "Save General Options"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="denied" className="mt-4">
            <div className="space-y-4 rounded-sm border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="size-4" />
                Denied
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <CheckboxField
                    label="Display message for registered users"
                    checked={deniedForm.blockMessageEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateDenied("blockMessageEnabled", checked)
                    }
                  />
                  <Textarea
                    value={deniedForm.blockMessage}
                    onChange={(event) =>
                      updateDenied("blockMessage", event.target.value)
                    }
                    rows={6}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <CheckboxField
                    label="Display message for guests"
                    checked={deniedForm.guestBlockMessageEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateDenied("guestBlockMessageEnabled", checked)
                    }
                  />
                  <Textarea
                    value={deniedForm.guestBlockMessage}
                    onChange={(event) =>
                      updateDenied("guestBlockMessage", event.target.value)
                    }
                    rows={6}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveDenied} disabled={isPending}>
                  <Save className="size-4" />
                  {isPending ? "Saving..." : "Save Denied"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integration" className="mt-4">
            <div className="space-y-6 rounded-sm border border-border bg-background p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">Twitter</div>
                  <CheckboxField
                    label="Enable"
                    checked={integrationForm.twitterEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateIntegration("twitterEnabled", checked)
                    }
                  />
                  <Field label="Consumer key" htmlFor="legacy-twitter-key">
                    <Input
                      id="legacy-twitter-key"
                      value={integrationForm.twitterKey}
                      onChange={(event) =>
                        updateIntegration("twitterKey", event.target.value)
                      }
                      disabled={isPending}
                    />
                  </Field>
                  <Field
                    label="Consumer secret"
                    htmlFor="legacy-twitter-secret"
                  >
                    <Input
                      id="legacy-twitter-secret"
                      value={integrationForm.twitterSecret}
                      onChange={(event) =>
                        updateIntegration("twitterSecret", event.target.value)
                      }
                      disabled={isPending}
                    />
                  </Field>
                </div>

                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">Facebook</div>
                  <CheckboxField
                    label="Enable"
                    checked={integrationForm.facebookEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateIntegration("facebookEnabled", checked)
                    }
                  />
                  <Field label="App ID" htmlFor="legacy-facebook-app-id">
                    <Input
                      id="legacy-facebook-app-id"
                      value={integrationForm.facebookAppId}
                      onChange={(event) =>
                        updateIntegration("facebookAppId", event.target.value)
                      }
                      disabled={isPending}
                    />
                  </Field>
                  <Field
                    label="App Secret"
                    htmlFor="legacy-facebook-app-secret"
                  >
                    <Input
                      id="legacy-facebook-app-secret"
                      value={integrationForm.facebookAppSecret}
                      onChange={(event) =>
                        updateIntegration(
                          "facebookAppSecret",
                          event.target.value,
                        )
                      }
                      disabled={isPending}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">OpenID Networks</div>
                  <CheckboxField
                    label="Google"
                    checked={integrationForm.googleEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateIntegration("googleEnabled", checked)
                    }
                  />
                  <Field label="Google App ID" htmlFor="legacy-google-id">
                    <Input
                      id="legacy-google-id"
                      value={integrationForm.googleId}
                      onChange={(event) =>
                        updateIntegration("googleId", event.target.value)
                      }
                      disabled={isPending}
                    />
                  </Field>
                  <Field label="Google App Secret" htmlFor="legacy-google-secret">
                    <Input
                      id="legacy-google-secret"
                      value={integrationForm.googleSecret}
                      onChange={(event) =>
                        updateIntegration("googleSecret", event.target.value)
                      }
                      disabled={isPending}
                    />
                  </Field>
                  <CheckboxField
                    label={
                      <span className="flex flex-wrap items-center gap-2">
                        Yahoo
                        <Badge variant="outline">Archived runtime</Badge>
                      </span>
                    }
                    checked={integrationForm.yahooEnabled}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      updateIntegration("yahooEnabled", checked)
                    }
                  />
                </div>

                <div className="space-y-3 rounded-sm border border-border/70 p-3">
                  <div className="text-sm font-semibold">Captcha signup</div>
                  <Select
                    value={integrationForm.captchaProvider}
                    onValueChange={(value) =>
                      updateIntegration(
                        "captchaProvider",
                        value === "reCAPTCHA" || value === "playThru"
                          ? value
                          : "disableCaptcha",
                      )
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disableCaptcha">
                        Disable captcha
                      </SelectItem>
                      <SelectItem value="reCAPTCHA">reCAPTCHA</SelectItem>
                      <SelectItem value="playThru">PlayThru archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Yahoo OpenID and PlayThru keys are preserved for legacy audit;
                    modern runtime uses Facebook, Google, Twitter, and reCAPTCHA.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="reCAPTCHA public key"
                      htmlFor="legacy-recaptcha-public"
                    >
                      <Input
                        id="legacy-recaptcha-public"
                        value={integrationForm.recaptchaPublicKey}
                        onChange={(event) =>
                          updateIntegration(
                            "recaptchaPublicKey",
                            event.target.value,
                          )
                        }
                        disabled={isPending}
                      />
                    </Field>
                    <Field
                      label="reCAPTCHA private key"
                      htmlFor="legacy-recaptcha-private"
                    >
                      <Input
                        id="legacy-recaptcha-private"
                        value={integrationForm.recaptchaPrivateKey}
                        onChange={(event) =>
                          updateIntegration(
                            "recaptchaPrivateKey",
                            event.target.value,
                          )
                        }
                        disabled={isPending}
                      />
                    </Field>
                    <Field
                      label="PlayThru publisher key"
                      htmlFor="legacy-playthru-publisher"
                    >
                      <Input
                        id="legacy-playthru-publisher"
                        value={integrationForm.playThruPublisherKey}
                        onChange={(event) =>
                          updateIntegration(
                            "playThruPublisherKey",
                            event.target.value,
                          )
                        }
                        disabled={isPending}
                      />
                    </Field>
                    <Field
                      label="PlayThru scoring key"
                      htmlFor="legacy-playthru-scoring"
                    >
                      <Input
                        id="legacy-playthru-scoring"
                        value={integrationForm.playThruScoringKey}
                        onChange={(event) =>
                          updateIntegration(
                            "playThruScoringKey",
                            event.target.value,
                          )
                        }
                        disabled={isPending}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveIntegration} disabled={isPending}>
                  <Save className="size-4" />
                  {isPending ? "Saving..." : "Save Integration"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="update" className="mt-4">
            <div className="space-y-4 rounded-sm border border-border bg-background p-4">
              <div className="space-y-3 rounded-sm border border-border/70 p-3">
                <div className="text-sm font-semibold">Update</div>
                <div
                  className={cn(
                    "flex gap-3 rounded-sm border p-3 text-sm",
                    updateForm.updateCheckEnabled
                      ? "border-blue-200 bg-blue-50 text-blue-950"
                      : "border-amber-200 bg-amber-50 text-amber-950",
                  )}
                >
                  {updateForm.updateCheckEnabled ? (
                    <Info className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {updateForm.updateCheckEnabled
                        ? "Archived provider check"
                        : "Updates disabled"}
                    </div>
                    {updateForm.updateCheckEnabled ? (
                      <p>
                        The legacy CodeCanyon update feed is retired; release
                        history now lives in Git and deployment records.
                      </p>
                    ) : (
                      <div>
                        <p>Two things may have happened:</p>
                        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                          <li>Update checking is disabled.</li>
                          <li>
                            The old provider endpoint is archived and no longer
                            queried by the modern app.
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
                <CheckboxField
                  label="Enable to automatically check for updates each time you load this page"
                  checked={updateForm.updateCheckEnabled}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateUpdateForm("updateCheckEnabled", checked)
                  }
                />
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-sm bg-muted/60 px-3 py-2">
                    <div className="text-xs text-muted-foreground">
                      Current version
                    </div>
                    <div className="font-medium">Legacy PHP Login</div>
                  </div>
                  <div className="rounded-sm bg-muted/60 px-3 py-2">
                    <div className="text-xs text-muted-foreground">
                      Latest version
                    </div>
                    <div className="font-medium">Provider archived</div>
                  </div>
                </div>
                <Field label="Latest changelog" htmlFor="legacy-update-changelog">
                  <Textarea
                    id="legacy-update-changelog"
                    rows={5}
                    value={
                      updateForm.updateCheckEnabled
                        ? "Legacy CodeCanyon changelog provider archived. Modern release notes are tracked through Git commits, pull requests, and deployment history."
                        : "Update checking is disabled."
                    }
                    disabled
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveUpdateSettings} disabled={isPending}>
                  <Save className="size-4" />
                  {isPending ? "Saving..." : "Save Update"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-sm border border-border/70 px-3 py-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function LevelChecklist({
  label,
  levels,
  selectedIds,
  disabled,
  compact,
  onToggle,
}: {
  label: string;
  levels: LegacyAuthLevelOption[];
  selectedIds: number[];
  disabled?: boolean;
  compact?: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div
        className={cn(
          "grid gap-2 rounded-sm border border-border/70 p-2",
          compact ? "md:grid-cols-1" : "md:grid-cols-3",
        )}
      >
        {levels.length ? (
          levels.map((level) => (
            <label
              key={level.id}
              className="flex min-h-9 items-center gap-2 rounded-sm px-2 text-sm hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.includes(level.legacyId)}
                disabled={disabled || level.isDisabled}
                onCheckedChange={() => onToggle(level.legacyId)}
              />
              <span className="min-w-0 flex-1 truncate">{level.label}</span>
              {level.isDisabled ? (
                <Badge variant="outline" className="text-[10px]">
                  Disabled
                </Badge>
              ) : null}
            </label>
          ))
        ) : (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No legacy levels found.
          </div>
        )}
      </div>
    </div>
  );
}

function RedirectBlock({
  label,
  checked,
  url,
  disabled,
  onCheckedChange,
  onUrlChange,
}: {
  label: string;
  checked: boolean;
  url: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  onUrlChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-sm border border-border/70 p-3">
      <CheckboxField
        label={`${label}: Redirect to referring page`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <Input
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
