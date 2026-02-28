"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      {/* Warm meadow gradient background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EFFCF8] via-[#F7F8FA] to-[#D1F7EC]/30" />
      {/* Soft decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#0B9178]/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#36CCA8]/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo & branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#0B9178] shadow-lg shadow-[#0B9178]/25">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="16" y="23" textAnchor="middle" fontFamily="'Nunito', system-ui, sans-serif" fontWeight="700" fontSize="22" fill="white">K</text>
            </svg>
          </div>
          <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-[#1A1D23]">
            Kidd<span className="text-[#0B9178]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#E2E5E9] bg-white p-8 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EFFCF8]">
                <svg className="size-6 text-[#0B9178]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-[#1A1D23]">Check your email</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  If an account exists for <strong className="font-medium text-[#1A1D23]">{email}</strong>, you&apos;ll receive a password reset link.
                </p>
              </div>
              <a
                href="/login"
                className="inline-block text-sm font-medium text-[#0B7464] transition-colors hover:text-[#0D5C50] hover:underline"
              >
                &larr; Back to login
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-heading text-xl font-semibold text-[#1A1D23]">Forgot password?</h2>
                <p className="mt-0.5 text-sm text-[#6B7280]">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-[#1A1D23]">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@nursery.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-[#0B7464] text-sm font-semibold tracking-wide text-white shadow-md shadow-[#0B7464]/20 transition-all hover:bg-[#0D5C50] hover:shadow-lg hover:shadow-[#0B7464]/25 active:scale-[0.98]"
                >
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <a
                    href="/login"
                    className="text-sm font-medium text-[#0B7464] transition-colors hover:text-[#0D5C50] hover:underline"
                  >
                    &larr; Back to login
                  </a>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Playful sprout illustration */}
        <div className="mt-5 flex justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#36CCA8] opacity-60">
            <path d="M20 36V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 26c-4-2-8-1-10 2 3 1 7 0 10-2z" fill="currentColor" opacity="0.5" />
            <path d="M20 22c4-3 9-3 12 0-4 1-8 1-12 0z" fill="currentColor" opacity="0.7" />
            <path d="M20 18c-2-5-1-10 3-13-1 5 0 9-3 13z" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        <p className="mt-3 text-center text-xs text-[#6B7280]">
          &copy; {new Date().getFullYear()} KiddzOnline. All rights reserved.
        </p>
      </div>
    </div>
  );
}
