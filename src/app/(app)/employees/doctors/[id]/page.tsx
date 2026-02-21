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
import { Mail, Phone, MapPin, Stethoscope, Building2, Pencil } from "lucide-react";

const doctor = {
  id: "d1",
  firstName: "Fadi",
  lastName: "Karam",
  email: "dr.karam@garderie.lb",
  phone: "+961 1 789 012",
  mobile: "+961 70 789 012",
  branch: "Main Branch",
  specialization: "Pediatrics",
  licenseNumber: "LB-PED-2015-4521",
  hireDate: "2019-06-01",
  status: "Active" as const,
  dateOfBirth: "1980-03-22",
  nationality: "Lebanese",
  address: {
    street: "Sin el Fil, Medical Center Building, 5th Floor",
    city: "Sin el Fil",
    region: "Metn",
  },
};

const recentVisits = [
  { date: "2025-02-20", child: "Adam Khoury", reason: "Routine checkup", diagnosis: "Healthy", followUp: "2025-05-20" },
  { date: "2025-02-18", child: "Lara Haddad", reason: "Ear infection", diagnosis: "Otitis media", followUp: "2025-02-25" },
  { date: "2025-02-15", child: "Jad Nassar", reason: "Allergy evaluation", diagnosis: "Mild dust allergy", followUp: "2025-03-15" },
  { date: "2025-02-10", child: "Tia Daher", reason: "Vaccination", diagnosis: "DTP booster given", followUp: "—" },
  { date: "2025-02-05", child: "Mia Gemayel", reason: "Growth assessment", diagnosis: "Normal development", followUp: "2025-05-05" },
];

export default function DoctorDetailsPage() {
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

      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1caf9a]/10 text-2xl font-bold text-[#1caf9a]">
              {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h2>
                <Badge className="bg-green-100 text-green-700">{doctor.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{doctor.specialization} · License: {doctor.licenseNumber}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{doctor.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{doctor.phone}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{doctor.branch}</span>
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
                    { label: "Date of Birth", value: doctor.dateOfBirth },
                    { label: "Nationality", value: doctor.nationality },
                    { label: "Mobile", value: doctor.mobile },
                    { label: "Specialization", value: doctor.specialization },
                    { label: "License Number", value: doctor.licenseNumber },
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
                    { label: "Branch", value: doctor.branch },
                    { label: "Hire Date", value: doctor.hireDate },
                    { label: "Status", value: doctor.status },
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
                  <p className="text-sm">{doctor.address.street}</p>
                  <p className="text-sm text-muted-foreground">{doctor.address.city}, {doctor.address.region}</p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Child</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Reason</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Diagnosis</TableHead>
                      <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVisits.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{v.date}</TableCell>
                        <TableCell className="text-sm font-medium">{v.child}</TableCell>
                        <TableCell className="text-sm">{v.reason}</TableCell>
                        <TableCell className="text-sm">{v.diagnosis}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.followUp}</TableCell>
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
