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
import { Plus, MoreHorizontal, FileText, Trash2, AlertTriangle } from "lucide-react";
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoAccidents = [
  {
    id: "acc1",
    date: "2025-02-15",
    time: "10:30",
    location: "Playground",
    description: "Fell off the small slide and scraped knee",
    severity: "MINOR",
    firstAid: "Cleaned wound, applied bandage",
    parentNotified: true,
  },
  {
    id: "acc2",
    date: "2025-01-22",
    time: "14:15",
    location: "Classroom",
    description: "Bumped head on table corner while playing",
    severity: "MODERATE",
    firstAid: "Applied ice pack, monitored for 30 minutes",
    parentNotified: true,
  },
  {
    id: "acc3",
    date: "2024-12-10",
    time: "11:00",
    location: "Dining Area",
    description: "Bit tongue while eating lunch",
    severity: "MINOR",
    firstAid: "Rinsed with water, given cold drink",
    parentNotified: false,
  },
];

const severityColors: Record<string, string> = {
  MINOR: "bg-yellow-100 text-yellow-700",
  MODERATE: "bg-orange-100 text-orange-700",
  SEVERE: "bg-red-100 text-red-700",
};

export default function ChildAccidentsPage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Accident Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Accidents" },
        ]}
      />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{demoAccidents.length} accident(s) on record</span>
          </div>
          <Button size="sm" style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 h-4 w-4" />
            Report Accident
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accident History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date & Time</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Location</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Description</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Severity</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">First Aid</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Parent</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a] w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoAccidents.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{row.date}</div>
                      <div className="text-xs text-muted-foreground">{row.time}</div>
                    </TableCell>
                    <TableCell className="text-sm">{row.location}</TableCell>
                    <TableCell className="max-w-[250px] text-sm">{row.description}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[row.severity]}>{row.severity}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] text-sm text-muted-foreground">{row.firstAid}</TableCell>
                    <TableCell>
                      <Badge variant={row.parentNotified ? "default" : "outline"} className={row.parentNotified ? "bg-green-100 text-green-700" : ""}>
                        {row.parentNotified ? "Notified" : "Not Notified"}
                      </Badge>
                    </TableCell>
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
