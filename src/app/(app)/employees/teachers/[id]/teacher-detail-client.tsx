"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, GraduationCap, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

interface Address {
  id: string;
  street: string | null;
  city: string | null;
  region: string | null;
}

interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  type: string | null;
}

interface TeacherData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  hireDate: string | null;
  specialization: string | null;
  isActive: boolean;
  branch: { id: string; name: string };
  addresses: Address[];
  attachments: Attachment[];
}

interface TeacherDetailClientProps {
  teacher: TeacherData;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary shrink-0">
                {getInitials(teacher.firstName, teacher.lastName)}
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
          <TabsList variant="line">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
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

          {/* Attachments Tab */}
          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {teacher.attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{att.filename}</span>
                        {att.type && <Badge variant="outline" className="text-[10px]">{att.type}</Badge>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <MapPin className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      No attachments uploaded yet
                    </p>
                    <p className="text-xs text-[#a0a8b4] mb-4">
                      Upload documents such as CV, certificates, or ID copies.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      Upload File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
