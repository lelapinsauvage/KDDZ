"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getLegacySocialLoginMethods,
  getLegacyLoginFailureRedirect,
  getLegacyLoginSuccessRedirect,
} from "@/lib/actions/legacy-login";

type LegacySocialMethod = {
  key: string;
  label: string;
  href: string;
  authProviderId: string | null;
  isConfigured: boolean;
  isSupported: boolean;
};

const legacySocialClasses: Record<string, string> = {
  facebook: "border-[#3B5998]/30 bg-[#3B5998] text-white hover:bg-[#314a7f]",
  google: "border-[#F23437]/30 bg-[#F23437] text-white hover:bg-[#d9292c]",
  twitter: "border-[#0088CC]/30 bg-[#0088CC] text-white hover:bg-[#0077b3]",
  yahoo: "border-[#670D6D]/30 bg-[#670D6D] text-white hover:bg-[#530957]",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialMethods, setSocialMethods] = useState<LegacySocialMethod[]>([]);

  useEffect(() => {
    let mounted = true;
    getLegacySocialLoginMethods().then((result) => {
      if (mounted && result.success) {
        setSocialMethods(result.data ?? []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        remember: remember ? "1" : "0",
        redirect: false,
      });

      if (result?.error) {
        const redirectResult = await getLegacyLoginFailureRedirect(email);
        if (redirectResult.success && redirectResult.data?.redirectTo) {
          router.push(redirectResult.data.redirectTo);
          return;
        }
        setError(
          redirectResult.success && redirectResult.data?.message
            ? redirectResult.data.message
            : "Invalid username/email or password",
        );
      } else {
        const redirectResult = await getLegacyLoginSuccessRedirect({
          callbackUrl,
        });
        router.push(redirectResult.data?.redirectTo ?? "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSocialSignIn(method: LegacySocialMethod) {
    if (!method.authProviderId || !method.isConfigured) return;
    void signIn(method.authProviderId, {
      callbackUrl: callbackUrl ?? "/dashboard",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      {/* Warm meadow gradient background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#EFFCF8] via-[#F7F8FA] to-[#D1F7EC]/30" />
      {/* Soft decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#36CCA8]/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo & branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-sm bg-primary shadow-sm shadow-[#0B9178]/25">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="16" y="23" textAnchor="middle" fontFamily="'Nunito', system-ui, sans-serif" fontWeight="700" fontSize="22" fill="white">K</text>
            </svg>
          </div>
          <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-[#1A1D23]">
            Kidd<span className="text-[#0B9178]">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Daycare Management Platform
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-sm border border-[#E2E5E9] bg-white p-8 shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]">
          <div className="mb-6">
            <h2 className="font-heading text-xl font-semibold text-[#1A1D23]">Welcome back</h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-[#DC2626]/20 bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">
                <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#1A1D23]">Username or email address</Label>
              <Input
                id="email"
                type="text"
                placeholder="Username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#1A1D23]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg border-[#E2E5E9] bg-white text-[#1A1D23] placeholder:text-[#6B7280] transition-all hover:border-[#C9CED4] focus:border-[#0B7464] focus:ring-[3px] focus:ring-[#0B7464]/15"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium text-[#4B5262]"
              >
                Stay signed in
              </Label>
            </div>

            {socialMethods.length > 0 && (
              <div className="grid gap-2">
                {socialMethods.map((method) => (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => handleSocialSignIn(method)}
                    disabled={!method.authProviderId || !method.isConfigured}
                    title={
                      method.isConfigured
                        ? `Sign in with ${method.label}`
                        : `${method.label} sign-in is not configured`
                    }
                    className={`flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      legacySocialClasses[method.key] ??
                      "border-[#E2E5E9] bg-[#F7F8FA] text-[#1A1D23] hover:bg-[#ECEFF3]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold tracking-wide text-white shadow-md shadow-[#0B7464]/20 transition-all hover:bg-[#0D5C50] hover:shadow-sm hover:shadow-[#0B7464]/25 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Signing in\u2026" : "Sign In"}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot"
                className="text-sm font-medium text-[#0B7464] transition-colors hover:text-[#0D5C50] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/signup"
                className="text-sm font-medium text-[#0B7464] transition-colors hover:text-[#0D5C50] hover:underline"
              >
                Create a new account
              </Link>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-lg border border-[#E2E5E9] bg-[#F7F8FA] p-3 text-center text-xs text-[#6B7280]">
            <p className="font-medium text-[#4B5262]">Demo credentials</p>
            <p className="mt-0.5">nassibsaab@lebarbar.com / changeme123</p>
          </div>
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
