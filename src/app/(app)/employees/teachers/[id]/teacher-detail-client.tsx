"use client";

import Link from "next/link";
import { getInitials } from "@/components/children/children-columns";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, GraduationCap, Building2, Pencil } from "lucide-react";
import {
  StaffAttachmentsSection,
  type StaffAttachment,
  type StaffDocumentFile,
  staffFilesFromRows,
} from "@/components/employees/staff-attachments-section";
import {
  LegacyStaffSnapshot,
  type LegacyStaffSnapshotStaff,
} from "@/components/employees/legacy-staff-snapshot";
import { format } from "date-fns";

interface TeacherData extends LegacyStaffSnapshotStaff {
  attachments: StaffAttachment[];
  documents?: StaffDocumentFile[];
}

interface TeacherDetailClientProps {
  teacher: TeacherData;
}

export function TeacherDetailClient({ teacher }: TeacherDetailClientProps) {
  const address = teacher.addresses[0] ?? null;

  return (
    <>
      <PageHeader
        title="Teacher Details"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Teachers", href: "/employees/teachers" },
          { label: `${teacher.firstName} ${teacher.lastName}` },
        ]}
      />
      <div className="p-4 md:p-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary">
                {teacher.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacher.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  getInitials(teacher.firstName, teacher.lastName)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    {teacher.firstName} {teacher.lastName}
                  </h2>
                  <Badge
                    className={
                      teacher.isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-red-50 text-red-600 border-red-200"
                    }
                  >
                    {teacher.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4 shrink-0" />
                      <span>{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4 shrink-0" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4 shrink-0" />
                    <span>{teacher.branch.name}</span>
                  </div>
                  {teacher.specialization && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="size-4 shrink-0" />
                      <span>{teacher.specialization}</span>
                    </div>
                  )}
                  {teacher.hireDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 shrink-0" />
                      <span>Hired {format(new Date(teacher.hireDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/employees/teachers/${teacher.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList variant="line" className="!h-auto !w-full flex-wrap justify-start">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Profile</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      First Name
                    </p>
                    <p className="text-sm text-foreground">{teacher.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Last Name
                    </p>
                    <p className="text-sm text-foreground">{teacher.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Email Address
                    </p>
                    <p className="text-sm text-foreground">{teacher.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Phone Number
                    </p>
                    <p className="text-sm text-foreground">{teacher.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Date of Birth
                    </p>
                    <p className="text-sm text-foreground">
                      {teacher.dateOfBirth
                        ? format(new Date(teacher.dateOfBirth), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Nationality
                    </p>
                    <p className="text-sm text-foreground">{teacher.nationality ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Mobile
                    </p>
                    <p className="text-sm text-foreground">{teacher.mobile ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Branch
                    </p>
                    <p className="text-sm text-foreground">{teacher.branch.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Specialization
                    </p>
                    <p className="text-sm text-foreground">{teacher.specialization ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Hire Date
                    </p>
                    <p className="text-sm text-foreground">
                      {teacher.hireDate
                        ? format(new Date(teacher.hireDate), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address Information</CardTitle>
              </CardHeader>
              <CardContent>
                {address ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                        Street Address
                      </p>
                      <p className="text-sm text-foreground">{address.street ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                        City
                      </p>
                      <p className="text-sm text-foreground">{address.city ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                        Region
                      </p>
                      <p className="text-sm text-foreground">{address.region ?? "—"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address on file.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legacy">
            <LegacyStaffSnapshot role="Teacher" staff={teacher} />
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments">
            <StaffAttachmentsSection
              attachments={staffFilesFromRows(teacher.attachments, teacher.documents)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
