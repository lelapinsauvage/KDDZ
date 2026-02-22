"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Icon className="size-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex gap-2">
          {action && (
            <Button asChild size="sm">
              <Link href={action.href}>
                {action.icon && <action.icon className="mr-1.5 size-3.5" />}
                {action.label}
              </Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild size="sm" variant="outline">
              <Link href={secondaryAction.href}>
                {secondaryAction.icon && (
                  <secondaryAction.icon className="mr-1.5 size-3.5" />
                )}
                {secondaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
