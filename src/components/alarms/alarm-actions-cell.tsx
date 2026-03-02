"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, X } from "lucide-react";
import { dismissAlarm } from "@/lib/actions/alarms";

interface AlarmActionsCellProps {
  id: string;
}

export function AlarmActionsCell({ id }: AlarmActionsCellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMarkViewed() {
    startTransition(async () => {
      await dismissAlarm(id);
      router.refresh();
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissAlarm(id);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" disabled={isPending}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMarkViewed}>
          <Eye className="mr-2 size-4" />
          Mark as Viewed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDismiss}
          className="text-red-600 focus:text-red-600"
        >
          <X className="mr-2 size-4" />
          Dismiss
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
