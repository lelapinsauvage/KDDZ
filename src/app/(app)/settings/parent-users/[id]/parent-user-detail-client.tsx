"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, KeyRound, Clock, Loader2 } from "lucide-react";
import {
  updateParentUser,
  resetParentPassword,
} from "@/lib/actions/parent-users";

interface ChildOption {
  id: string;
  name: string;
}

interface ParentUserDetailClientProps {
  parentUser: {
    id: string;
    username: string;
    childId: string;
    childName: string;
    isActive: boolean;
    createdAt: string;
  };
  childrenList: ChildOption[];
}

export function ParentUserDetailClient({ parentUser, childrenList }: ParentUserDetailClientProps) {
  const [username, setUsername] = useState(parentUser.username);
  const [childId, setChildId] = useState(parentUser.childId);
  const [isActive, setIsActive] = useState(parentUser.isActive);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateParentUser(parentUser.id, {
        username,
        childId,
        isActive,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleResetPassword() {
    const newPw = prompt("Enter new password:");
    if (!newPw) return;

    startTransition(async () => {
      await resetParentPassword(parentUser.id, newPw);
      alert("Password has been reset.");
    });
  }

  return (
    <>
      <PageHeader
        title="Parent User Detail"
        breadcrumbs={[
          { label: "Settings", href: "/settings/parent-users" },
          { label: "Parent Users", href: "/settings/parent-users" },
          { label: username },
        ]}
      />

      <div className="space-y-4 p-4 md:space-y-6 md:p-6">
        {/* ── Account Form ────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Linked Child</Label>
                <Select value={childId} onValueChange={setChildId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {childrenList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label>Password</Label>
              <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={isPending}>
                <KeyRound className="mr-1 size-3.5" />
                Reset Password
              </Button>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={isActive}
                onCheckedChange={(v) => setIsActive(!!v)}
              />
              Account Active
            </label>

            <div className="flex items-center gap-3 pt-2">
              <Button
               
                className="text-white"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1 size-4" />
                )}
                Save Changes
              </Button>
              {saved && (
                <span className="text-sm font-medium text-primary">
                  Saved successfully!
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Info Card ─────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created:</span>
                <Badge variant="secondary">{parentUser.createdAt}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Status:</span>
                <Badge
                  className={
                    parentUser.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {parentUser.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
