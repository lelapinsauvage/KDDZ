"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Trash2 } from "lucide-react";
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoAbsences = [
  { id: "a1", date: "2025-02-19", reason: "Doctor's appointment", status: "APPROVED", createdBy: "Sara Khalil" },
  { id: "a2", date: "2025-02-11", reason: "Sick — fever and cough", status: "APPROVED", createdBy: "Maya Nassar (Parent)" },
  { id: "a3", date: "2025-01-28", reason: "Family trip", status: "APPROVED", createdBy: "Maya Nassar (Parent)" },
  { id: "a4", date: "2025-01-15", reason: "Not feeling well", status: "REJECTED", createdBy: "Sara Khalil" },
  { id: "a5", date: "2025-03-05", reason: "Dentist visit", status: "PENDING", createdBy: "Maya Nassar (Parent)" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ChildAbsencePage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Absence Records`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Absence" },
        ]}
      />

      <div className="space-y-6 p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{demoAbsences.length}</p>
              <p className="text-xs text-muted-foreground">Total Absences</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">
                {demoAbsences.filter((a) => a.status === "APPROVED").length}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-amber-500">
                {demoAbsences.filter((a) => a.status === "PENDING").length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button size="sm" style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 h-4 w-4" />
            Report Absence
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Absence History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Reason</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Status</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Reported By</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a] w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoAbsences.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium">{row.date}</TableCell>
                    <TableCell className="text-sm">{row.reason}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.createdBy}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
