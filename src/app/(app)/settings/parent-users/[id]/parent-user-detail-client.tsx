"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Save, KeyRound, Clock, Loader2, Phone, Mail, MessageCircle, User, Users, ExternalLink, Shield } from "lucide-react";
import {
  updateParentUser,
  resetParentPassword,
} from "@/lib/actions/parent-users";
import { getAvatarColor, getInitials } from "@/components/children/children-columns";

interface ParentContact {
  type: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface RelativeContact {
  name: string;
  relation: string | null;
  phone: string | null;
  isAuthorized: boolean;
}

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
    childFirstName: string;
    childLastName: string;
    childClassName: string | null;
    childBranchName: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    parents: ParentContact[];
    relatives: RelativeContact[];
  };
  childrenList: ChildOption[];
}

function formatWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.+]/g, "");
  return `https://wa.me/${cleaned}`;
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

  const initials = getInitials(parentUser.childFirstName || "?", parentUser.childLastName || "?");
  const avatarBg = getAvatarColor(parentUser.childName);

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
        {/* Linked Child Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Linked Child
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/children/${parentUser.childId}/dashboard`} className="flex items-center gap-3 group">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarBg}`}>
                {initials}
              </div>
              <div>
                <p className="font-medium group-hover:underline">{parentUser.childName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {parentUser.childClassName && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{parentUser.childClassName}</Badge>}
                  {parentUser.childBranchName && <span>{parentUser.childBranchName}</span>}
                </div>
              </div>
              <ExternalLink className="ml-auto size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        {parentUser.parents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parentUser.parents.map((p, i) => (
                <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name ?? "Unknown"}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.type}</Badge>
                      </div>
                      {p.phone && <p className="text-sm text-muted-foreground mt-0.5">{p.phone}</p>}
                      {p.email && <p className="text-sm text-muted-foreground">{p.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.phone && (
                      <>
                        <a
                          href={`tel:${p.phone}`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Call"
                        >
                          <Phone className="size-4" />
                        </a>
                        <a
                          href={formatWhatsAppUrl(p.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-8 items-center justify-center rounded-md text-green-600 hover:bg-green-50 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      </>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-[#8B7355] hover:bg-[#8B7355]/10 transition-colors"
                        title="Email"
                      >
                        <Mail className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Relatives Card */}
        {parentUser.relatives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4" />
                Relatives & Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentUser.relatives.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.name}</span>
                      {r.relation && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.relation}</Badge>}
                      {r.isAuthorized && <Badge className="bg-[#6B8F71]/15 text-[#6B8F71] text-[10px] px-1.5 py-0">Authorized Pickup</Badge>}
                    </div>
                  </div>
                  {r.phone && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">{r.phone}</span>
                      <a
                        href={`tel:${r.phone}`}
                        className="inline-flex size-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Call"
                      >
                        <Phone className="size-3.5" />
                      </a>
                      <a
                        href={formatWhatsAppUrl(r.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-7 items-center justify-center rounded-md text-green-600 hover:bg-green-50 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="size-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Account Form */}
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

        {/* Info Card */}
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
                <span>Last Updated:</span>
                <Badge variant="secondary">{parentUser.updatedAt}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Status:</span>
                <Badge
                  className={
                    parentUser.isActive
                      ? "bg-[#6B8F71]/15 text-[#6B8F71]"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  <span className={`mr-1.5 inline-block size-1.5 rounded-full ${parentUser.isActive ? "bg-[#6B8F71]" : "bg-gray-400"}`} />
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
