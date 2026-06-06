"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeCurrentUserPassword } from "@/lib/actions/profile";
import { Eye, EyeOff, KeyRound, Loader2, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface ProfileUser {
  name: string;
  email: string;
  role: string;
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    TEACHER: "Teacher",
    NURSE: "Nurse",
    DOCTOR: "Doctor",
  };
  return map[role] ?? role;
}

export function ProfileClient({
  user,
  legacySettings = false,
}: {
  user: ProfileUser;
  legacySettings?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  function handlePasswordSave() {
    if (!password) {
      toast.error("No Change !");
      return;
    }
    if (password.length < 5) {
      toast.error("Password must be at least 5 characters");
      return;
    }

    startTransition(async () => {
      const result = await changeCurrentUserPassword(password);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update password");
        return;
      }

      setPassword("");
      setShowPassword(false);
      toast.success("Password updated successfully");
    });
  }

  return (
    <>
      <PageHeader
        title={legacySettings ? "Settings" : "Profile"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: legacySettings ? "Settings" : "Profile" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user.name || "Unnamed"}</h2>
            {user.role && (
              <Badge variant="secondary">{formatRole(user.role)}</Badge>
            )}
          </div>
        </div>

        <Card className="rounded-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Name</dt>
                  <dd className="text-foreground">{user.name || "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Email</dt>
                  <dd className="text-foreground">{user.email || "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Role</dt>
                  <dd className="text-foreground">{user.role ? formatRole(user.role) : "—"}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-primary" />
              Change your password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New Password"
                  autoComplete="new-password"
                  className="pr-10"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handlePasswordSave();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1 top-1"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <Button
                type="button"
                onClick={handlePasswordSave}
                disabled={isPending}
                className="sm:w-32"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
