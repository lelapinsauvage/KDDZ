"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: implement password reset
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#364150" }}>
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="space-y-1 pb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1caf9a" }}>
            KiddzOnline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reset your password
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, you will receive a password reset email.
              </p>
              <a href="/login" className="text-sm hover:underline" style={{ color: "#1caf9a" }}>
                Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" style={{ background: "#1caf9a" }}>
                Send Reset Link
              </Button>
              <div className="text-center">
                <a href="/login" className="text-sm hover:underline" style={{ color: "#1caf9a" }}>
                  Back to login
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
