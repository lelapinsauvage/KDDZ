"use client";

import { Download, ExternalLink, FileText, Image as ImageIcon, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AttachmentPreviewItem {
  id: string;
  filename: string;
  href: string;
}

interface AttachmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  attachments: AttachmentPreviewItem[];
}

function isImageAttachment(attachment: AttachmentPreviewItem) {
  const value = `${attachment.filename} ${attachment.href}`.toLowerCase().split("?")[0];
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(value);
}

function isPdfAttachment(attachment: AttachmentPreviewItem) {
  const value = `${attachment.filename} ${attachment.href}`.toLowerCase().split("?")[0];
  return /\.pdf$/.test(value);
}

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  title,
  attachments,
}: AttachmentPreviewDialogProps) {
  const primary = attachments[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preview the selected row attachment and open or download any related file.
          </DialogDescription>
        </DialogHeader>

        {primary ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-sm border bg-muted/30">
              {isImageAttachment(primary) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primary.href}
                  alt={primary.filename}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              ) : isPdfAttachment(primary) ? (
                <iframe
                  src={primary.href}
                  title={primary.filename}
                  className="h-[70vh] w-full border-0"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <FileText className="size-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{primary.filename}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This file type opens in a new tab.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={primary.href} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Open file
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="size-4" />
                Attachments
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={attachment.id}
                    className="rounded-sm border bg-background p-3 text-sm"
                  >
                    <div className="flex items-start gap-2">
                      {isImageAttachment(attachment) ? (
                        <ImageIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={attachment.filename}>
                          {attachment.filename || `Attachment ${index + 1}`}
                        </p>
                        {index === 0 ? (
                          <p className="text-xs text-muted-foreground">Previewed above</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="xs">
                        <a href={attachment.href} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3" />
                          Open
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="xs">
                        <a href={attachment.href} download>
                          <Download className="size-3" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-sm border border-dashed p-8 text-center text-sm text-muted-foreground">
            No attachments available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
