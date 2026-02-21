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
import { Plus, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { demoChildren } from "@/lib/demo-data";

interface Props {
  params: Promise<{ id: string }>;
}

const demoCalls = [
  {
    id: "c1",
    date: "2025-02-21",
    time: "10:30",
    direction: "OUTGOING",
    contact: "Maya Nassar (Mother)",
    phone: "+961 71 234 567",
    reason: "Fever notification — 38.2°C",
    duration: "3 min",
    notes: "Mother informed, will pick up if fever persists",
  },
  {
    id: "c2",
    date: "2025-02-19",
    time: "08:15",
    direction: "INCOMING",
    contact: "Ahmad Nassar (Father)",
    phone: "+961 3 987 654",
    reason: "Absence notification — doctor appointment",
    duration: "2 min",
    notes: "",
  },
  {
    id: "c3",
    date: "2025-02-15",
    time: "14:00",
    direction: "OUTGOING",
    contact: "Maya Nassar (Mother)",
    phone: "+961 71 234 567",
    reason: "Playground accident — minor scrape",
    duration: "5 min",
    notes: "Parent reassured, will check at pickup",
  },
  {
    id: "c4",
    date: "2025-02-10",
    time: "09:00",
    direction: "MISSED",
    contact: "Maya Nassar (Mother)",
    phone: "+961 71 234 567",
    reason: "—",
    duration: "—",
    notes: "Called back at 09:15",
  },
  {
    id: "c5",
    date: "2025-02-05",
    time: "16:30",
    direction: "OUTGOING",
    contact: "Ahmad Nassar (Father)",
    phone: "+961 3 987 654",
    reason: "Late pickup reminder",
    duration: "1 min",
    notes: "",
  },
];

const directionConfig: Record<string, { label: string; icon: typeof Phone; className: string }> = {
  INCOMING: { label: "Incoming", icon: PhoneIncoming, className: "bg-blue-100 text-blue-700" },
  OUTGOING: { label: "Outgoing", icon: PhoneOutgoing, className: "bg-green-100 text-green-700" },
  MISSED: { label: "Missed", icon: PhoneMissed, className: "bg-red-100 text-red-700" },
};

export default function ChildCallsPage({ params }: Props) {
  const { id } = use(params);
  const child = demoChildren.find((c) => c.id === id) ?? demoChildren[0];

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Call Log`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Calls" },
        ]}
      />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-5 w-5" />
            <span className="text-sm">{demoCalls.length} call(s) logged</span>
          </div>
          <Button size="sm" style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 h-4 w-4" />
            Log Call
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Date & Time</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Direction</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Contact</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Phone</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Reason</TableHead>
                  <TableHead className="bg-[#f1f3f6] text-xs font-semibold uppercase text-[#6f7b8a]">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoCalls.map((call) => {
                  const cfg = directionConfig[call.direction];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{call.date}</div>
                        <div className="text-xs text-muted-foreground">{call.time}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cfg.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{call.contact}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{call.phone}</TableCell>
                      <TableCell className="max-w-[250px] text-sm">{call.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{call.duration}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
