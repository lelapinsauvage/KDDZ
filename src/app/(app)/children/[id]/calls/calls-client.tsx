"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Phone, PhoneIncoming, PhoneOutgoing, MoreHorizontal, Trash2 } from "lucide-react";
import { CallReportDialog } from "./call-report-dialog";
import { deleteCallLog } from "@/lib/actions/calls";

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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <CallActions callId={row.original.id} />,
    enableSorting: false,
  },
];

function CallActions({ callId }: { callId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this call log?")) return;
    startTransition(async () => {
      await deleteCallLog(callId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
