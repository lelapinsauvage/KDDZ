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

const nurse = {
  id: "n1",
  firstName: "Hala",
  lastName: "Daher",
  email: "hala.daher@garderie.lb",
  phone: "+961 71 456 789",
  mobile: "+961 3 456 789",
  branch: "Main Branch",
  specialization: "Pediatric Nursing",
  hireDate: "2020-03-15",
  status: "Active" as const,
  dateOfBirth: "1988-11-20",
  nationality: "Lebanese",
  address: {
    street: "Jounieh, Main Road, Building 12",
    city: "Jounieh",
    region: "Keserwan",
  },
};

const recentActivities = [
  { date: "2025-02-21", child: "Adam Khoury", action: "Fever check — 37.8°C", type: "MEDICAL" },
  { date: "2025-02-21", child: "Lara Haddad", action: "Administered vitamin drops", type: "MEDICINE" },
  { date: "2025-02-20", child: "Jad Nassar", action: "Allergy reaction — monitored", type: "MEDICAL" },
  { date: "2025-02-19", child: "Mia Gemayel", action: "Weight/height measurement", type: "CHECKUP" },
  { date: "2025-02-18", child: "Lea Boustany", action: "Minor scrape — first aid", type: "ACCIDENT" },
];

const typeColors: Record<string, string> = {
  MEDICAL: "bg-red-100 text-red-700",
  MEDICINE: "bg-purple-100 text-purple-700",
  CHECKUP: "bg-blue-100 text-blue-700",
  ACCIDENT: "bg-orange-100 text-orange-700",
};

export default function NurseDetailsPage() {
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
                <Badge className="bg-green-100 text-green-700">{nurse.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{nurse.specialization}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{nurse.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{nurse.phone}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{nurse.branch}</span>
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
                    { label: "Date of Birth", value: nurse.dateOfBirth },
                    { label: "Nationality", value: nurse.nationality },
                    { label: "Mobile", value: nurse.mobile },
                    { label: "Specialization", value: nurse.specialization },
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
                    { label: "Branch", value: nurse.branch },
                    { label: "Hire Date", value: nurse.hireDate },
                    { label: "Status", value: nurse.status },
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
                  <p className="text-sm">{nurse.address.street}</p>
                  <p className="text-sm text-muted-foreground">{nurse.address.city}, {nurse.address.region}</p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Child</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Action</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{a.date}</TableCell>
                        <TableCell className="text-sm font-medium">{a.child}</TableCell>
                        <TableCell className="text-sm">{a.action}</TableCell>
                        <TableCell>
                          <Badge className={typeColors[a.type]}>{a.type}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
