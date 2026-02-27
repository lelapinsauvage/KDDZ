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
    // TODO: implement password reset
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDF8F5] via-white to-[#F5F0EB] p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#C35A2C]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#B08968]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#C35A2C] text-white shadow-lg shadow-[#C35A2C]/10">
            <span className="text-2xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Kidd<span className="text-[#C35A2C]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-white/80 p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FDF8F5]">
                <svg className="size-6 text-[#C35A2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong className="text-foreground">{email}</strong>, you will receive a password reset email.
              </p>
              <a href="/login" className="text-sm font-medium text-[#C35A2C] hover:text-[#A8471E] hover:underline">
                Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@nursery.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 bg-stone-50/50 transition-colors focus:bg-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#C35A2C] text-white font-medium shadow-md shadow-[#C35A2C]/10 transition-all hover:shadow-lg hover:shadow-[#C35A2C]/10 hover:bg-[#A8471E]"
              >
                Send Reset Link
              </Button>
              <div className="text-center">
                <a href="/login" className="text-sm text-[#C35A2C] hover:text-[#A8471E] hover:underline">
                  Back to login
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
