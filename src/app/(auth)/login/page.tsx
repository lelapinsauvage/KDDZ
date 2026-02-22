"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-60 w-60 rounded-full bg-rose-200/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-teal-200">
            <span className="text-2xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Kidd<span className="text-teal-500">z</span>Online
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daycare Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-white/80 p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-stone-200 bg-stone-50/50 transition-colors focus:bg-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium shadow-md shadow-teal-200 transition-all hover:shadow-lg hover:shadow-teal-200 hover:from-teal-600 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <a
                href="/forgot"
                className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* Dev credentials */}
          <div className="mt-6 rounded-xl bg-stone-50 border border-stone-100 p-3 text-center text-xs text-muted-foreground">
            <p className="font-medium text-stone-500">Demo credentials</p>
            <p className="mt-0.5">nassibsaab@lebarbar.com / changeme123</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} KiddzOnline. All rights reserved.
        </p>
      </div>
    </div>
  );
}
