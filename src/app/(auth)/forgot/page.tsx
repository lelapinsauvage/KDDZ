"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordReset,
  resetForgottenPassword,
} from "@/lib/actions/password-recovery";

type Status =
  | { type: "idle" }
  | { type: "success"; message: string; resetUrl?: string }
  | { type: "error"; message: string };

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="h-52 animate-pulse rounded-sm border border-[#E2E5E9] bg-white" />
        </AuthShell>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key")?.trim() ?? "";
  const isResetMode = key.length > 0;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [pending, startTransition] = useTransition();

  function handleRequestSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ type: "idle" });
    startTransition(async () => {
      const result = await requestPasswordReset(identifier);
      if (!result.success) {
        setStatus({
          type: "error",
          message: result.error ?? "Unable to create recovery link.",
        });
        return;
      }
      setStatus({
        type: "success",
        message: "We've emailed you password reset instructions. Check your email.",
        resetUrl: result.data?.resetUrl,
      });
    });
  }

  function handleResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ type: "idle" });
    startTransition(async () => {
      const result = await resetForgottenPassword({
        key,
        password,
        password2,
      });
      if (!result.success) {
        setStatus({
          type: "error",
          message: result.error ?? "Verification failed.",
        });
        return;
      }
      setPassword("");
      setPassword2("");
      setStatus({
        type: "success",
        message: "Successfully reset your password.",
      });
    });
  }

  return (
    <AuthShell>
      <div className="rounded-sm border border-[#E2E5E9] bg-white p-8 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]">
        <div className="mb-6">
          <div className="mb-3 flex size-10 items-center justify-center rounded-sm bg-[#EFFCF8] text-[#0B7464]">
            {isResetMode ? <KeyRound className="size-5" /> : <Mail className="size-5" />}
          </div>
          <h2 className="font-heading text-xl font-semibold text-[#1A1D23]">
            {isResetMode ? "Account Recovery" : "Forgot password?"}
          </h2>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {isResetMode
              ? "Enter and confirm your new password."
              : "Enter your username or email address."}
          </p>
        </div>

        {status.type !== "idle" ? <StatusMessage status={status} /> : null}

        {isResetMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#1A1D23]">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password2" className="text-sm font-medium text-[#1A1D23]">
                Confirm password
              </Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(event) => setPassword2(event.target.value)}
                className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                required
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-[#0B7464]/20 transition-all hover:bg-[#0D5C50] hover:shadow-sm hover:shadow-[#0B7464]/25"
              disabled={pending}
            >
              <KeyRound className="mr-2 size-4" />
              {pending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="usernamemail"
                className="text-sm font-medium text-[#1A1D23]"
              >
                Username or email address
              </Label>
              <Input
                id="usernamemail"
                name="usernamemail"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                required
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-[#0B7464]/20 transition-all hover:bg-[#0D5C50] hover:shadow-sm hover:shadow-[#0B7464]/25"
              disabled={pending}
            >
              <Mail className="mr-2 size-4" />
              {pending ? "Sending..." : "Submit"}
            </Button>
          </form>
        )}

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
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-sm bg-primary shadow-sm shadow-[#0B9178]/25">
            <span className="font-heading text-[1.375rem] font-bold text-white">K</span>
          </div>
          <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-[#1A1D23]">
            Kidd<span className="text-[#0B9178]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">Reset your password</p>
        </div>

        {children}

        <p className="mt-3 text-center text-xs text-[#6B7280]">
          &copy; {new Date().getFullYear()} KiddzOnline. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: Exclude<Status, { type: "idle" }> }) {
  const isSuccess = status.type === "success";
  return (
    <div
      className={
        isSuccess
          ? "mb-4 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          : "mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      }
    >
      <div className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        ) : (
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-medium">{status.message}</p>
          {status.type === "success" && status.resetUrl ? (
            <Link
              href={status.resetUrl}
              className="mt-2 block break-all font-medium text-[#0B7464] hover:underline"
            >
              {status.resetUrl}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
