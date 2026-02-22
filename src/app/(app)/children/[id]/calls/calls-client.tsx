"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { Plus, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface CallRecord {
  id: string;
  date: string;
  time: string | null;
  direction: string;
  contact: string;
  phone: string;
  subject: string;
  reason: string;
  remarks: string;
  createdBy: string | null;
}

interface Props {
  child: ChildData;
  calls: CallRecord[];
}

const directionConfig: Record<string, { label: string; icon: typeof Phone; className: string }> = {
  INCOMING: { label: "Incoming", icon: PhoneIncoming, className: "bg-blue-100 text-blue-700" },
  OUTGOING: { label: "Outgoing", icon: PhoneOutgoing, className: "bg-green-100 text-green-700" },
  MISSED: { label: "Missed", icon: PhoneMissed, className: "bg-red-100 text-red-700" },
};

const columns: ColumnDef<CallRecord>[] = [
  {
    accessorKey: "date",
    header: "Date & Time",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.date}</div>
        {row.original.time && (
          <div className="text-xs text-muted-foreground">{row.original.time}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => {
      const cfg = directionConfig[row.original.direction] ?? directionConfig.OUTGOING;
      const Icon = cfg.icon;
      return (
        <Badge className={cfg.className}>
          <Icon className="mr-1 h-3 w-3" />
          {cfg.label}
        </Badge>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.direction === filterValue;
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.phone || "\u2014"}</span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => row.original.subject || "\u2014",
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[250px]">{row.original.reason || "\u2014"}</span>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "Staff",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.createdBy ?? "\u2014"}</span>
    ),
  },
];

export function CallsClient({ child, calls }: Props) {
  const id = child.id;

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

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-5 w-5" />
            <span className="text-sm">{calls.length} call(s) logged</span>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Log Call
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={calls}
          searchKey="contact"
          searchPlaceholder="Search by contact..."
        />
      </div>
    </>
  );
}
