"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Building2, Pencil, BarChart3 } from "lucide-react";

const manager = {
  id: "m1",
  firstName: "Omar",
  lastName: "Gemayel",
  email: "omar.gemayel@garderie.lb",
  phone: "+961 1 345 678",
  mobile: "+961 70 345 678",
  branch: "Main Branch",
  specialization: "Operations Management",
  hireDate: "2018-01-15",
  status: "Active" as const,
  dateOfBirth: "1985-07-10",
  nationality: "Lebanese",
  address: {
    street: "Achrafieh, St. Nicolas Street, Building 8",
    city: "Beirut",
    region: "Beirut",
  },
};

const branchStats = [
  { label: "Total Children", value: "45" },
  { label: "Active Classes", value: "6" },
  { label: "Teachers", value: "8" },
  { label: "Nurses", value: "2" },
  { label: "Attendance Rate", value: "94%" },
  { label: "Reports This Month", value: "128" },
];

export default function ManagerDetailsPage() {
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

      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-start gap-6 pt-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{manager.firstName} {manager.lastName}</h2>
                <Badge className="bg-green-100 text-green-700">{manager.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{manager.specialization}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{manager.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{manager.phone}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{manager.branch}</span>
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
                    { label: "Date of Birth", value: manager.dateOfBirth },
                    { label: "Nationality", value: manager.nationality },
                    { label: "Mobile", value: manager.mobile },
                    { label: "Specialization", value: manager.specialization },
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
                    { label: "Branch", value: manager.branch },
                    { label: "Hire Date", value: manager.hireDate },
                    { label: "Status", value: manager.status },
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
                  <p className="text-sm">{manager.address.street}</p>
                  <p className="text-sm text-muted-foreground">{manager.address.city}, {manager.address.region}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" /> {manager.branch} — Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {branchStats.map((stat) => (
                    <div key={stat.label} className="rounded-md border p-4 text-center">
                      <p className="text-2xl font-bold text-[#1caf9a]">{stat.value}</p>
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
