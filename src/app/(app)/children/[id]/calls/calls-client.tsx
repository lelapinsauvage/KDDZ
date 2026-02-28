"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { Plus, Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { CallReportDialog } from "./call-report-dialog";

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

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  child: ChildData;
  calls: CallRecord[];
  staffList: StaffMember[];
}

const causeLabels: Record<string, string> = {
  health: "Health Issue",
  behavior: "Behavior",
  absence: "Absence",
  pickup: "Pickup Arrangement",
  emergency: "Emergency",
  general_inquiry: "General Inquiry",
  complaint: "Complaint",
  follow_up: "Follow Up",
  other: "Other",
};

const directionConfig: Record<string, { label: string; icon: typeof Phone; className: string }> = {
  INCOMING: { label: "Incoming", icon: PhoneIncoming, className: "bg-blue-100 text-blue-700" },
  OUTGOING: { label: "Outgoing", icon: PhoneOutgoing, className: "bg-green-100 text-green-700" },
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
    header: "Type",
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
    accessorKey: "reason",
    header: "Cause",
    cell: ({ row }) => {
      const val = row.original.reason;
      return <span>{causeLabels[val] ?? (val || "\u2014")}</span>;
    },
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => row.original.subject || "\u2014",
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[200px] text-muted-foreground">
        {row.original.remarks || "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "Filed By",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.createdBy ?? "\u2014"}</span>
    ),
  },
];

export function CallsClient({ child, calls, staffList }: Props) {
  const id = child.id;
  const [dialogOpen, setDialogOpen] = useState(false);

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
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Log Call
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={calls}
          searchKey="subject"
          searchPlaceholder="Search by subject..."
        />
      </div>

      <CallReportDialog
        childId={id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffList={staffList}
      />
    </>
  );
}
