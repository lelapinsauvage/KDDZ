"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import {
  StaffAttachmentsSection,
  type StaffAttachment,
} from "@/components/employees/staff-attachments-section";
import {
  LegacyStaffSnapshot,
  type LegacyStaffSnapshotStaff,
} from "@/components/employees/legacy-staff-snapshot";
import { format } from "date-fns";

interface BranchStat {
  label: string;
  value: string;
}

interface ManagerData extends LegacyStaffSnapshotStaff {
  attachments: StaffAttachment[];
}

interface ManagerDetailClientProps {
  manager: ManagerData;
  branchStats: BranchStat[];
}

export function ManagerDetailClient({ manager, branchStats }: ManagerDetailClientProps) {
  const address = manager.addresses[0] ?? null;

  return (
    <>
      <PageHeader
        title="Manager Details"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Employees" },
          { label: "Managers", href: "/employees/managers" },
          { label: `${manager.firstName} ${manager.lastName}` },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <Card>
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              {manager.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manager.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <>
                  {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
                </>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{manager.firstName} {manager.lastName}</h2>
                <Badge className={manager.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {manager.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{manager.specialization ?? "—"}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {manager.email && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{manager.email}</span>
                )}
                {manager.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{manager.phone}</span>
                )}
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{manager.branch.name}</span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/employees/managers/${manager.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList className="!h-auto !w-full flex-wrap justify-start">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Profile</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="branch">Branch Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Date of Birth", value: manager.dateOfBirth ? format(new Date(manager.dateOfBirth), "MMM d, yyyy") : "—" },
                    { label: "Nationality", value: manager.nationality ?? "—" },
                    { label: "Mobile", value: manager.mobile ?? "—" },
                    { label: "Specialization", value: manager.specialization ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Branch", value: manager.branch.name },
                    { label: "Hire Date", value: manager.hireDate ? format(new Date(manager.hireDate), "MMM d, yyyy") : "—" },
                    { label: "Status", value: manager.isActive ? "Active" : "Inactive" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" /> Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {address ? (
                    <>
                      <p className="text-sm">{address.street ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {[address.city, address.region].filter(Boolean).join(", ") || "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address on file.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="legacy">
            <LegacyStaffSnapshot role="Manager" staff={manager} />
          </TabsContent>

          <TabsContent value="attachments">
            <StaffAttachmentsSection attachments={manager.attachments} />
          </TabsContent>

          <TabsContent value="branch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" /> {manager.branch.name} — Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {branchStats.map((stat) => (
                    <div key={stat.label} className="rounded-md border p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
