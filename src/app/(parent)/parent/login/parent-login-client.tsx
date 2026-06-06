"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Baby, Eye, EyeOff, Loader2, Lock, LogIn, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOKEN_KEY = "kiddzonline_parent_token";
const CHILD_ID_KEY = "kiddzonline_parent_child_id";
const CHILD_NAME_KEY = "kiddzonline_parent_child_name";

type LoginResponse = {
  id?: string | number;
  usites?: string | number;
  childId?: string;
  status?: boolean;
  fname?: string;
  lname?: string;
  feedback?: string;
  token?: string;
  error?: string;
};

export function ParentLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const childId = window.localStorage.getItem(CHILD_ID_KEY);
    if (token && childId) {
      router.replace("/parent");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/parent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username.trim(), pass: password }),
      });

      const data = (await response.json()) as LoginResponse;
      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      const childId = data.childId || data.usites;
      if (!data.status || !data.token || !childId) {
        setError(data.feedback || "Invalid username or password.");
        return;
      }

      const childName = [data.fname, data.lname].filter(Boolean).join(" ");
      window.localStorage.setItem(TOKEN_KEY, data.token);
      window.localStorage.setItem(CHILD_ID_KEY, String(childId));
      window.localStorage.setItem(CHILD_NAME_KEY, childName);
      router.replace("/parent");
    } catch {
      setError("Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] items-center justify-center px-4 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <section className="hidden border-l-4 border-primary bg-white px-8 py-10 shadow-xs lg:block">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Baby className="size-6" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-[#333333]">KiddzOnline Parents</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daily reports, messages, payments, calendars, and reminders for your child.
                </p>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
              {["Daily report", "Payments", "Messages", "Food calendar"].map((label) => (
                <div key={label} className="border border-border bg-[#fafafa] px-4 py-3 font-medium">
                  {label}
                </div>
              ))}
            </div>
          </section>

          <Card className="mx-auto w-full max-w-[420px]">
            <CardHeader className="gap-1">
              <div className="mb-2 flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground lg:hidden">
                <Baby className="size-5" />
              </div>
              <CardTitle className="text-xl">Parent login</CardTitle>
              <p className="text-sm text-muted-foreground">KiddzOnline parent access</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="parent-username">Username</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="parent-username"
                      autoComplete="username"
                      className="pl-9"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="parent-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="px-9"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
