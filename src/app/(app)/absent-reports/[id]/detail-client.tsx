"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil, UserX, Paperclip } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  url: string;
}

interface ReportData {
  id: string;
  childName: string;
  className: string | null;
  branchName: string | null;
  date: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy: string | null;
  attachments: Attachment[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function AbsenceReportDetailClient({ report }: { report: ReportData }) {
  return (
    <>
      <PageHeader
        title="Absence Report"
        breadcrumbs={[
          { label: "Absence Reports", href: "/absent-reports" },
          { label: report.childName },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/absent-reports/${report.id}/edit`}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Status & date */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusColors[report.status] ?? "bg-muted text-muted-foreground"}>
            {report.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(report.date), "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Details */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserX className="size-4 text-primary" />
                Absence Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Child</dt>
                  <dd className="text-muted-foreground">{report.childName}</dd>
                </div>
                {report.className && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Class</dt>
                    <dd className="text-muted-foreground">{report.className}</dd>
                  </div>
                )}
                {report.branchName && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Branch</dt>
                    <dd className="text-muted-foreground">{report.branchName}</dd>
                  </div>
                )}
                {report.createdBy && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Reported by</dt>
                    <dd className="text-muted-foreground">{report.createdBy}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {report.reason || "No reason provided"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attachments */}
        {report.attachments.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4 text-primary" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {report.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
