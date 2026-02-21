"use client";

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

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface AccidentRecord {
  id: string;
  date: string;
  time: string;
  location: string;
  description: string;
  severity: string;
  firstAid: string;
  parentNotified: boolean;
}

interface Props {
  child: ChildData;
  accidents: AccidentRecord[];
}

const severityColors: Record<string, string> = {
  MINOR: "bg-yellow-100 text-yellow-700",
  MODERATE: "bg-orange-100 text-orange-700",
  SEVERE: "bg-red-100 text-red-700",
};

export function AccidentsClient({ child, accidents }: Props) {
  const id = child.id;

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
            <span className="text-sm">{accidents.length} accident(s) on record</span>
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
                {accidents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No accident records found.
                    </TableCell>
                  </TableRow>
                )}
                {accidents.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{row.date}</div>
                      <div className="text-xs text-muted-foreground">{row.time}</div>
                    </TableCell>
                    <TableCell className="text-sm">{row.location}</TableCell>
                    <TableCell className="max-w-[250px] text-sm">{row.description}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[row.severity] ?? "bg-gray-100 text-gray-700"}>{row.severity}</Badge>
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
