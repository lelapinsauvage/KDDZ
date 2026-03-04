"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  GitBranch,
  CalendarDays,
  Plus,
  KeyRound,
  Pencil,
  Copy,
  Check,
  Power,
} from "lucide-react";
import {
  updateOrganization,
  toggleOrganizationStatus,
  createOrgUser,
  resetUserPassword,
} from "@/lib/actions/organizations";
import type { OrgDetail } from "./page";

interface Props {
  organization: OrgDetail;
}

export function OrgDetailClient({ organization: org }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit org
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(org.name);
  const [editSlug, setEditSlug] = useState(org.slug);
  const [editPlan, setEditPlan] = useState(org.plan);

  // Add user
  const [showAddUser, setShowAddUser] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("TEACHER");
  const [userBranchId, setUserBranchId] = useState<string>("");

  // Credentials reveal
  const [creds, setCreds] = useState<{
    email?: string;
    password: string;
    label: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleEditOrg() {
    startTransition(async () => {
      const result = await updateOrganization(org.id, {
        name: editName,
        slug: editSlug,
        plan: editPlan,
      });
      if (result.success) {
        setShowEdit(false);
        router.refresh();
        toast.success("Organization updated");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleOrganizationStatus(org.id);
      if (result.success) {
        router.refresh();
        toast.success("Status toggled");
      } else {
        toast.error(result.error ?? "Failed to toggle status");
      }
    });
  }

  function handleAddUser() {
    if (!userName || !userEmail) {
      toast.error("Name and email are required");
      return;
    }
    startTransition(async () => {
      const result = await createOrgUser(org.id, {
        email: userEmail,
        name: userName,
        role: userRole as "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER",
        branchId: userBranchId || undefined,
      });
      if (result.success) {
        const { tempPassword } = result.data as {
          user: unknown;
          tempPassword: string;
        };
        setShowAddUser(false);
        setUserName("");
        setUserEmail("");
        setUserRole("TEACHER");
        setUserBranchId("");
        router.refresh();
        setCreds({
          email: userEmail,
          password: tempPassword,
          label: "User created",
        });
      } else {
        toast.error(result.error ?? "Failed to create user");
      }
    });
  }

  function handleResetPassword(userId: string, email: string) {
    startTransition(async () => {
      const result = await resetUserPassword(userId);
      if (result.success) {
        const { tempPassword } = result.data as { tempPassword: string };
        setCreds({
          email,
          password: tempPassword,
          label: "Password reset",
        });
      } else {
        toast.error(result.error ?? "Failed to reset password");
      }
    });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const kpis = [
    {
      label: "Branches",
      value: org._count.branches,
      icon: GitBranch,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Users",
      value: org._count.users,
      icon: Users,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "School Years",
      value: org._count.schoolYears,
      icon: CalendarDays,
      color: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <>
      <PageHeader
        title={org.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Organizations", href: "/settings/organizations" },
          { label: org.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEdit(true)}
            >
              <Pencil className="mr-1.5 size-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant={org.isActive ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={isPending}
            >
              <Power className="mr-1.5 size-4" />
              {org.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="py-4">
                <CardContent className="flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${kpi.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <Card className="py-4">
          <CardContent>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Slug:</span>{" "}
                <span className="font-medium">{org.slug}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plan:</span>{" "}
                <Badge variant="secondary">{org.plan}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge variant={org.isActive ? "default" : "destructive"}>
                  {org.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branches */}
        <div>
          <h2 className="mb-3 text-base font-semibold">Branches</h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Children</TableHead>
                  <TableHead className="text-center">Teachers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-center">
                      {b._count.children}
                    </TableCell>
                    <TableCell className="text-center">
                      {b._count.teachers}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={b.isActive ? "default" : "destructive"}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {org.branches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No branches
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Users */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Users</h2>
            <Button size="sm" onClick={() => setShowAddUser(true)}>
              <Plus className="mr-1.5 size-4" />
              Add User
            </Button>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.branch?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.isActive ? "default" : "destructive"}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isPending}
                        onClick={() =>
                          handleResetPassword(u.id, u.email)
                        }
                        title="Reset password"
                      >
                        <KeyRound className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {org.users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No users
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Organization Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Plan</label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOrg} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to {org.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Jane Smith"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="jane@nursery.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="NURSE">Nurse</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {org.branches.length > 0 && (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Branch</label>
                <Select
                  value={userBranchId}
                  onValueChange={setUserBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {org.branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isPending}>
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!creds} onOpenChange={() => setCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creds?.label}</DialogTitle>
          </DialogHeader>
          {creds && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Share these credentials with the user:
              </p>
              <div className="rounded-md bg-muted p-3 font-mono text-sm">
                {creds.email && (
                  <div>
                    Email: <strong>{creds.email}</strong>
                  </div>
                )}
                <div>
                  Password: <strong>{creds.password}</strong>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy(
                    creds.email
                      ? `Email: ${creds.email}\nPassword: ${creds.password}`
                      : `Password: ${creds.password}`,
                  )
                }
              >
                {copied ? (
                  <Check className="mr-1.5 size-4" />
                ) : (
                  <Copy className="mr-1.5 size-4" />
                )}
                {copied ? "Copied!" : "Copy credentials"}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
