"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
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
  Plus,
  Eye,
  Power,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import {
  createOrganization,
  toggleOrganizationStatus,
} from "@/lib/actions/organizations";
import type { OrganizationRow } from "./page";

interface Props {
  organizations: OrganizationRow[];
}

export function OrganizationsClient({ organizations }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
    orgName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("free");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");

  function resetForm() {
    setName("");
    setSlug("");
    setPlan("free");
    setAdminEmail("");
    setAdminName("");
  }

  function handleCreate() {
    if (!name || !slug || !adminEmail || !adminName) {
      toast.error("All fields are required");
      return;
    }
    startTransition(async () => {
      const result = await createOrganization({
        name,
        slug,
        plan,
        adminEmail,
        adminName,
      });
      if (result.success) {
        const { tempPassword } = result.data as {
          organization: unknown;
          tempPassword: string;
        };
        setShowCreate(false);
        resetForm();
        setCreatedCreds({
          email: adminEmail,
          password: tempPassword,
          orgName: name,
        });
        router.refresh();
        toast.success("Organization created");
      } else {
        toast.error(result.error ?? "Failed to create organization");
      }
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleOrganizationStatus(id);
      if (result.success) {
        router.refresh();
        toast.success("Status updated");
      } else {
        toast.error(result.error ?? "Failed to toggle status");
      }
    });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Organizations" },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 size-4" />
            New Organization
          </Button>
        }
      />

      <div className="p-4 md:p-6">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <Building2 className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No organizations yet
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-1.5 size-4" />
              Create first organization
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Branches</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{org.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {org._count.branches}
                    </TableCell>
                    <TableCell className="text-center">
                      {org._count.users}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={org.isActive ? "default" : "destructive"}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="size-8"
                        >
                          <Link
                            href={`/settings/organizations/${org.id}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isPending}
                          onClick={() => handleToggle(org.id)}
                        >
                          <Power className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Organization</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Organization Name</label>
              <Input
                placeholder="Happy Kids Nursery"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                    );
                  }
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Slug</label>
              <Input
                placeholder="happy-kids"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Plan</label>
              <Select value={plan} onValueChange={setPlan}>
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
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Admin Name</label>
              <Input
                placeholder="John Doe"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Admin Email</label>
              <Input
                type="email"
                placeholder="admin@nursery.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog
        open={!!createdCreds}
        onOpenChange={() => setCreatedCreds(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organization Created</DialogTitle>
          </DialogHeader>
          {createdCreds && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                <strong>{createdCreds.orgName}</strong> has been created.
                Share these credentials with the org admin:
              </p>
              <div className="rounded-md bg-muted p-3 font-mono text-sm">
                <div>
                  Email: <strong>{createdCreds.email}</strong>
                </div>
                <div>
                  Password: <strong>{createdCreds.password}</strong>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy(
                    `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`,
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
            <Button onClick={() => setCreatedCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
