"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitLegacyDisabledContact,
  type LegacyDisabledContactResult,
} from "@/lib/actions/legacy-login";

type Status =
  | { type: "idle" }
  | { type: "success"; data: LegacyDisabledContactResult; name: string }
  | { type: "error"; message: string };

type LegacyDisabledPageProps = {
  initialName?: string;
  initialEmail?: string;
};

export function LegacyDisabledPage({
  initialName = "",
  initialEmail = "",
}: LegacyDisabledPageProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState("User / Group Disabled");
  const [comments, setComments] = useState("");
  const [verify, setVerify] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ type: "idle" });
    startTransition(async () => {
      const result = await submitLegacyDisabledContact({
        name,
        email,
        subject,
        comments,
        verify,
      });

      if (!result.success || !result.data) {
        setStatus({
          type: "error",
          message: result.error ?? "Unable to submit your message.",
        });
        return;
      }

      setStatus({ type: "success", data: result.data, name });
      setComments("");
      setVerify("");
    });
  }

  return (
    <AuthShell>
      <div className="rounded-sm border border-[#E2E5E9] bg-white p-6 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="mb-6">
          <div className="mb-3 flex size-10 items-center justify-center rounded-sm bg-red-50 text-red-700">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[#1A1D23]">
            Oops, Access Denied
          </h2>
          <p className="mt-1 text-sm font-medium text-[#4B5262]">
            Sorry, your username or user group has been disabled!
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            We have detected that your username or user group has been disabled;
            so you cannot view internal pages.
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Fill out this form if you feel this is in error.
          </p>
        </div>

        <StatusMessage status={status} />

        {status.type === "success" ? null : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="disabled-name">Name</Label>
                <Input
                  id="disabled-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={pending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="disabled-email">Email</Label>
                <Input
                  id="disabled-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disabled-subject">Subject</Label>
              <select
                id="disabled-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none hover:border-border-strong focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
              >
                <option value="User / Group Disabled">Disabled Message</option>
                <option value="a Bug fix">Report a bug</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disabled-comments">Your comments</Label>
              <Textarea
                id="disabled-comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={4}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disabled-verify">What colour is the sky?</Label>
              <Input
                id="disabled-verify"
                value={verify}
                onChange={(event) => setVerify(event.target.value)}
                disabled={pending}
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-[#0B7464]/20 transition-all hover:bg-[#0D5C50] hover:shadow-sm hover:shadow-[#0B7464]/25"
              disabled={pending}
            >
              <Send className="mr-2 size-4" />
              {pending ? "Submitting..." : "Submit"}
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
      <div className="relative w-full max-w-[560px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-sm bg-primary shadow-sm shadow-[#0B9178]/25">
            <span className="font-heading text-[1.375rem] font-bold text-white">
              K
            </span>
          </div>
          <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-[#1A1D23]">
            Kidd<span className="text-[#0B9178]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">Account access</p>
        </div>

        {children}

        <p className="mt-3 text-center text-xs text-[#6B7280]">
          &copy; {new Date().getFullYear()} KiddzOnline. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  if (status.type === "idle") return null;
  const isSuccess = status.type === "success";
  const message = isSuccess
    ? "Email Sent Successfully"
    : status.message;

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
          <p className="font-medium">{message}</p>
          {status.type === "success" ? (
            <p className="mt-1">
              Thank you <strong>{status.name}</strong>, your message has been
              submitted to us.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
