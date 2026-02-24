"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield } from "lucide-react";

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

export function ProfileClient({ user }: { user: ProfileUser }) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <PageHeader
        title="Profile"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Profile" },
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

        <Card className="rounded-2xl">
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
      </div>
    </>
  );
}
