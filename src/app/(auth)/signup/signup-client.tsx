"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  LegacySignupPageData,
  LegacySignupProfileField,
  LegacySignupResult,
} from "@/lib/actions/legacy-signup";
import { createLegacySignup } from "@/lib/actions/legacy-signup";

type SignupStatus =
  | { type: "idle" }
  | { type: "success"; data: LegacySignupResult }
  | { type: "error"; message: string };

type LegacySignupClientProps = {
  data: LegacySignupPageData;
  error?: string | null;
};

const legacySignupCopy = {
  title: "Create a new account",
  body:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris cursus rhoncus tristique. Mauris ornare ipsum a leo molestie id porttitor justo bibendum. Pellentesque magna augue, sollicitudin ut ornare pretium, mattis imperdiet augue. Morbi semper sapien sit amet velit interdum eu commodo erat fringilla. Nulla et ipsum orci, ac varius nulla. Nam vehicula, mi quis euismod consectetur, magna dui porttitor sem, vel venenatis felis nunc eu diam. Integer vitae est at nunc varius viverra sit amet at magna. Vestibulum mi diam, pharetra id malesuada ac, venenatis nec turpis. Vestibulum metus nisl, pharetra non laoreet eu, laoreet a eros. Suspendisse ut arcu in mauris dapibus sodales. Vestibulum commodo congue elit at mollis. Fusce semper auctor odio, ut pharetra justo faucibus blandit. Fusce in pellentesque elit. Nunc adipiscing neque eu odio tincidunt ac mollis erat porta.",
  featuresTitle: "Features",
  features:
    "Cras placerat scelerisque vehicula. Fusce eu ipsum vel mi convallis dapibus. Cras ut nibh metus, quis malesuada augue. Aenean a nisi nec sem accumsan gravida in in turpis. Nulla euismod lorem non sem imperdiet vestibulum. Donec blandit aliquet turpis sed dapibus. Duis fermentum facilisis diam, sit amet ultrices neque dictum eget.",
};

function internalRedirect(value: string) {
  if (!value.trim()) return "/dashboard";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return value.startsWith("/") ? value : "/dashboard";
  }
}

function fieldStateKey(field: LegacySignupProfileField) {
  return String(field.legacyId);
}

function initialProfileState(fields: LegacySignupProfileField[]) {
  return Object.fromEntries(
    fields.map((field) => [
      fieldStateKey(field),
      field.fieldType === "checkbox" ? false : "",
    ]),
  ) as Record<string, string | boolean>;
}

export function LegacySignupClient({ data, error }: LegacySignupClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profileValues, setProfileValues] = useState(() =>
    initialProfileState(data.profileFields),
  );
  const [status, setStatus] = useState<SignupStatus>(
    error
      ? { type: "error", message: error }
      : data.registrationsDisabled
        ? { type: "error", message: "Registrations disabled." }
        : { type: "idle" },
  );

  const groupedFields = useMemo(() => {
    const groups = new Map<string, LegacySignupProfileField[]>();
    for (const field of data.profileFields) {
      const section = field.section || "Profile";
      groups.set(section, [...(groups.get(section) ?? []), field]);
    }
    return Array.from(groups.entries());
  }, [data.profileFields]);

  const canSubmit =
    Boolean(data.sourceDatabase) &&
    !data.registrationsDisabled &&
    status.type !== "success";

  function updateProfileValue(field: LegacySignupProfileField, value: string | boolean) {
    setProfileValues((current) => ({
      ...current,
      [fieldStateKey(field)]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const sourceDatabase = data.sourceDatabase;
    if (!sourceDatabase || data.registrationsDisabled) return;

    setStatus({ type: "idle" });
    startTransition(async () => {
      const result = await createLegacySignup({
        sourceDatabase,
        name,
        username,
        email,
        password,
        passwordConfirm,
        profileValues: data.profileFields.map((field) => ({
          fieldLegacyId: field.legacyId,
          value: profileValues[fieldStateKey(field)] ?? null,
        })),
      });

      if (!result.success || !result.data) {
        setStatus({
          type: "error",
          message: result.error ?? "Failed to create your account.",
        });
        return;
      }

      setStatus({ type: "success", data: result.data });
      if (!result.data.requiresActivation) {
        const signInResult = await signIn("credentials", {
          email: result.data.email,
          password,
          redirect: false,
        });
        if (!signInResult?.error) {
          router.push(internalRedirect(result.data.redirectTo));
          router.refresh();
        }
      }
    });
  }

  return (
    <AuthShell
      subtitle={
        data.requireActivation
          ? "Activation required after registration"
          : "Create your KiddzOnline account"
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)] lg:items-start">
        <div className="rounded-sm border border-[#E2E5E9] bg-white p-6 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] sm:p-8">
          <div className="mb-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-sm bg-[#EFFCF8] text-[#0B7464]">
              <UserPlus className="size-5" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-[#1A1D23]">
              Create a new account
            </h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              {data.useEmailAsUsername
                ? "Your email will be used as your username."
                : "Choose a username and password."}
            </p>
          </div>

          <StatusMessage status={status} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                value={name}
                placeholder="Full name"
                onChange={(event) => setName(event.target.value)}
                disabled={!canSubmit || pending}
                required
              />
            </div>

            {!data.useEmailAsUsername ? (
              <div className="space-y-1.5">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  value={username}
                  maxLength={15}
                  placeholder="Choose your username"
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={!canSubmit || pending}
                  required
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                placeholder="Email"
                onChange={(event) => setEmail(event.target.value)}
                disabled={!canSubmit || pending}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  placeholder="Create a password"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!canSubmit || pending}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password-confirm">Password again</Label>
                <Input
                  id="signup-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  placeholder="Confirm your password"
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  disabled={!canSubmit || pending}
                  required
                />
              </div>
            </div>

            {groupedFields.map(([section, fields]) => (
              <div key={section} className="space-y-3 rounded-sm border border-[#E2E5E9] p-3">
                <div className="text-sm font-semibold text-[#1A1D23]">{section}</div>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <ProfileFieldControl
                      key={field.legacyId}
                      field={field}
                      value={profileValues[fieldStateKey(field)] ?? ""}
                      disabled={!canSubmit || pending}
                      onChange={(value) => updateProfileValue(field, value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <Button type="submit" className="h-11 w-full" disabled={!canSubmit || pending}>
              <UserPlus className="size-4" />
              {pending ? "Creating..." : "Create my account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0B7464] transition-colors hover:text-[#0D5C50] hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to login
            </Link>
          </div>
        </div>
        <aside className="space-y-5 rounded-sm border border-[#E2E5E9] bg-white p-6 text-[#374151] shadow-[0_4px_6px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold text-[#1A1D23]">
              {legacySignupCopy.title}
            </h2>
            <p className="text-sm leading-6">{legacySignupCopy.body}</p>
          </div>
          <div className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-[#1A1D23]">
              {legacySignupCopy.featuresTitle}
            </h3>
            <p className="text-sm leading-6">{legacySignupCopy.features}</p>
          </div>
        </aside>
      </div>
    </AuthShell>
  );
}

function ProfileFieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: LegacySignupProfileField;
  value: string | boolean;
  disabled: boolean;
  onChange: (value: string | boolean) => void;
}) {
  const id = `legacy-profile-${field.legacyId}`;
  const required = field.signup === "require";

  if (field.fieldType === "checkbox") {
    return (
      <div className="flex items-start gap-2">
        <Checkbox
          id={id}
          checked={value === true || value === "1"}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
        />
        <Label htmlFor={id} className="pt-0.5 text-sm font-medium">
          {field.label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      </div>
    );
  }

  if (field.fieldType === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>
          {field.label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        <Textarea
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}

function StatusMessage({ status }: { status: SignupStatus }) {
  if (status.type === "idle") return null;

  if (status.type === "success") {
    return (
      <div className="mb-4 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">
              {status.data.requiresActivation
                ? status.data.welcomeDeliveryConfigured
                  ? "Account created. Check your email to activate it."
                  : "Account created. Activation email delivery is not configured."
                : "Account created."}
            </p>
            {status.data.requiresActivation && status.data.activationUrl ? (
              <Link
                href={status.data.activationUrl}
                className="mt-2 block break-all font-medium text-[#0B7464] hover:underline"
              >
                {status.data.activationUrl}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p className="font-medium">{status.message}</p>
      </div>
    </div>
  );
}

function AuthShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      <div className="relative w-full max-w-[980px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-sm bg-primary shadow-sm shadow-[#0B9178]/25">
            <span className="font-heading text-[1.375rem] font-bold text-white">K</span>
          </div>
          <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-[#1A1D23]">
            Kidd<span className="text-[#0B9178]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
        </div>

        {children}

        <p className="mt-3 text-center text-xs text-[#6B7280]">
          &copy; {new Date().getFullYear()} KiddzOnline. All rights reserved.
        </p>
      </div>
    </div>
  );
}
