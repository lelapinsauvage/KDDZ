"use client";

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
import { Mail, Phone, MapPin, Heart, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

interface Address {
  id: string;
  street: string | null;
  city: string | null;
  region: string | null;
}

interface MedicalActivity {
  id: string;
  date: string;
  childName: string;
  formType: string;
  status: string;
}

interface NurseData {
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
}

interface NurseDetailClientProps {
  nurse: NurseData;
  recentActivities: MedicalActivity[];
}

const typeColors: Record<string, string> = {
  GENERAL: "bg-blue-100 text-blue-700",
  CONDITIONS: "bg-yellow-100 text-yellow-700",
  VISITS: "bg-green-100 text-green-700",
  VACCINATIONS: "bg-purple-100 text-purple-700",
  ACCIDENTS: "bg-orange-100 text-orange-700",
};

export function NurseDetailClient({ nurse, recentActivities }: NurseDetailClientProps) {
  const address = nurse.addresses[0] ?? null;

  return (
    <>
      <PageHeader
        title="Nurse Details"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Employees" },
          { label: "Nurses", href: "/employees/nurses" },
          { label: `${nurse.firstName} ${nurse.lastName}` },
        ]}
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
              {nurse.firstName.charAt(0)}{nurse.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{nurse.firstName} {nurse.lastName}</h2>
                <Badge className={nurse.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {nurse.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{nurse.specialization ?? "—"}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {nurse.email && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{nurse.email}</span>
                )}
                {nurse.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{nurse.phone}</span>
                )}
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{nurse.branch.name}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Date of Birth", value: nurse.dateOfBirth ? format(new Date(nurse.dateOfBirth), "MMM d, yyyy") : "—" },
                    { label: "Nationality", value: nurse.nationality ?? "—" },
                    { label: "Mobile", value: nurse.mobile ?? "—" },
                    { label: "Specialization", value: nurse.specialization ?? "—" },
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
                    { label: "Branch", value: nurse.branch.name },
                    { label: "Hire Date", value: nurse.hireDate ? format(new Date(nurse.hireDate), "MMM d, yyyy") : "—" },
                    { label: "Status", value: nurse.isActive ? "Active" : "Inactive" },
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

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4" /> Recent Medical Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                        <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Child</TableHead>
                        <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Status</TableHead>
                        <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivities.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">
                            {format(new Date(a.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{a.childName}</TableCell>
                          <TableCell className="text-sm">{a.status}</TableCell>
                          <TableCell>
                            <Badge className={typeColors[a.formType] ?? "bg-gray-100 text-gray-700"}>
                              {a.formType}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent medical activities found.
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
