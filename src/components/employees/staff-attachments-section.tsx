"use client";

import { format } from "date-fns";
import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StaffAttachment {
  id: string;
  title?: string | null;
  filename: string;
  fileUrl: string;
  type?: string | null;
  expiryDate?: string | null;
}

interface StaffAttachmentsSectionProps {
  attachments: StaffAttachment[];
}

export function StaffAttachmentsSection({
  attachments,
}: StaffAttachmentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" /> Attachments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length > 0 ? (
          <div className="divide-y rounded-md border">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {attachment.title || attachment.filename}
                    </p>
                    {attachment.type && (
                      <Badge variant="outline" className="text-[10px]">
                        {attachment.type}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {attachment.filename}
                    {attachment.expiryDate
                      ? ` · Expires ${format(new Date(attachment.expiryDate), "MMM d, yyyy")}`
                      : ""}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Open
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No attachments uploaded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
