"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#364150" }}>
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="space-y-1 pb-4 text-center">
          <div className="mx-auto mb-4">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "#1caf9a" }}
            >
              KiddzOnline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daycare Management System
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              style={{ background: "#1caf9a" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <a
                href="/forgot"
                className="text-sm hover:underline"
                style={{ color: "#1caf9a" }}
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
            <p className="font-medium">Demo credentials:</p>
            <p>admin@garderie.com / password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
