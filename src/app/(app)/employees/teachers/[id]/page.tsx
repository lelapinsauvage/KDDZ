"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, GraduationCap, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

// Demo data for one teacher (Sara Khalil)
const teacher = {
  id: "t1",
  firstName: "Sara",
  lastName: "Khalil",
  email: "sara.khalil@garderie.lb",
  phone: "+961 3 123 456",
  branch: "Beirut Central",
  specialization: "Early Childhood Education",
  hireDate: "2021-09-01",
  status: "Active" as const,
  type: "teacher" as const,
  dateOfBirth: "1992-05-14",
  nationality: "Lebanese",
  gender: "Female",
  emergencyContact: "+961 1 987 654",
  emergencyContactName: "Mariam Khalil",
  address: {
    street: "Rue Hamra, Building 45, 3rd Floor",
    city: "Beirut",
    country: "Lebanon",
    postalCode: "1103",
  },
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function TeacherDetailsPage() {
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
      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex size-20 items-center justify-center rounded-full bg-[#1caf9a]/10 text-xl font-bold text-[#1caf9a] shrink-0">
                {getInitials(teacher.firstName, teacher.lastName)}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[#333]">
                    {teacher.firstName} {teacher.lastName}
                  </h2>
                  <Badge
                    className={
                      teacher.status === "Active"
                        ? "bg-[#1caf9a]/10 text-[#1caf9a] border-[#1caf9a]/20"
                        : "bg-red-50 text-red-600 border-red-200"
                    }
                  >
                    {teacher.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-[#6f7b8a]">
                    <Mail className="size-4 shrink-0" />
                    <span>{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6f7b8a]">
                    <Phone className="size-4 shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6f7b8a]">
                    <Building2 className="size-4 shrink-0" />
                    <span>{teacher.branch}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6f7b8a]">
                    <GraduationCap className="size-4 shrink-0" />
                    <span>{teacher.specialization}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6f7b8a]">
                    <Calendar className="size-4 shrink-0" />
                    <span>Hired {format(new Date(teacher.hireDate), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <Button variant="outline" size="sm" className="shrink-0">
                <Pencil className="size-4" />
                Edit Profile
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
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      First Name
                    </p>
                    <p className="text-sm text-[#333]">{teacher.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Last Name
                    </p>
                    <p className="text-sm text-[#333]">{teacher.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Email Address
                    </p>
                    <p className="text-sm text-[#333]">{teacher.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Phone Number
                    </p>
                    <p className="text-sm text-[#333]">{teacher.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Date of Birth
                    </p>
                    <p className="text-sm text-[#333]">
                      {format(new Date(teacher.dateOfBirth), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Nationality
                    </p>
                    <p className="text-sm text-[#333]">{teacher.nationality}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Gender
                    </p>
                    <p className="text-sm text-[#333]">{teacher.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Branch
                    </p>
                    <p className="text-sm text-[#333]">{teacher.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Specialization
                    </p>
                    <p className="text-sm text-[#333]">{teacher.specialization}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Hire Date
                    </p>
                    <p className="text-sm text-[#333]">
                      {format(new Date(teacher.hireDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Emergency Contact Name
                    </p>
                    <p className="text-sm text-[#333]">
                      {teacher.emergencyContactName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Emergency Contact Phone
                    </p>
                    <p className="text-sm text-[#333]">
                      {teacher.emergencyContact}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Street Address
                    </p>
                    <p className="text-sm text-[#333]">{teacher.address.street}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      City
                    </p>
                    <p className="text-sm text-[#333]">{teacher.address.city}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Country
                    </p>
                    <p className="text-sm text-[#333]">{teacher.address.country}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-[#6f7b8a] mb-1">
                      Postal Code
                    </p>
                    <p className="text-sm text-[#333]">{teacher.address.postalCode}</p>
                  </div>
                </div>
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-[#f1f3f6] flex items-center justify-center mb-3">
                    <MapPin className="size-5 text-[#6f7b8a]" />
                  </div>
                  <p className="text-sm text-[#6f7b8a] mb-1">
                    No attachments uploaded yet
                  </p>
                  <p className="text-xs text-[#a0a8b4] mb-4">
                    Upload documents such as CV, certificates, or ID copies.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#1caf9a] text-[#1caf9a] hover:bg-[#1caf9a]/5"
                  >
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
