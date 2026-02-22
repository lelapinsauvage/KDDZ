"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Phone, MapPin, Stethoscope, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

interface Address {
  id: string;
  street: string | null;
  city: string | null;
  region: string | null;
}

interface RecentVisit {
  id: string;
  date: string;
  childName: string;
  formType: string;
  status: string;
}

interface DoctorData {
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
  licenseNumber: string | null;
  isActive: boolean;
  branch: { id: string; name: string };
  addresses: Address[];
}

interface DoctorDetailClientProps {
  doctor: DoctorData;
  recentVisits: RecentVisit[];
}

export function DoctorDetailClient({ doctor, recentVisits }: DoctorDetailClientProps) {
  const address = doctor.addresses[0] ?? null;

  return (
    <>
      <PageHeader
        title="Doctor Details"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Employees" },
          { label: "Doctors", href: "/employees/doctors" },
          { label: `Dr. ${doctor.firstName} ${doctor.lastName}` },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <Card>
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h2>
                <Badge className={doctor.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {doctor.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {doctor.specialization ?? "—"}
                {doctor.licenseNumber ? ` · License: ${doctor.licenseNumber}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {doctor.email && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{doctor.email}</span>
                )}
                {doctor.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{doctor.phone}</span>
                )}
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{doctor.branch.name}</span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/employees/doctors/${doctor.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Date of Birth", value: doctor.dateOfBirth ? format(new Date(doctor.dateOfBirth), "MMM d, yyyy") : "—" },
                    { label: "Nationality", value: doctor.nationality ?? "—" },
                    { label: "Mobile", value: doctor.mobile ?? "—" },
                    { label: "Specialization", value: doctor.specialization ?? "—" },
                    { label: "License Number", value: doctor.licenseNumber ?? "—" },
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
                    { label: "Branch", value: doctor.branch.name },
                    { label: "Hire Date", value: doctor.hireDate ? format(new Date(doctor.hireDate), "MMM d, yyyy") : "—" },
                    { label: "Status", value: doctor.isActive ? "Active" : "Inactive" },
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

          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Stethoscope className="h-4 w-4" /> Recent Patient Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentVisits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">Date</TableHead>
                        <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">Child</TableHead>
                        <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">Type</TableHead>
                        <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentVisits.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-sm">
                            {format(new Date(v.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{v.childName}</TableCell>
                          <TableCell className="text-sm">{v.formType}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{v.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent visits found.
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
