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
      {/* Decorative illustration ring */}
      <div className="relative mb-5">
        <div className="absolute -inset-3 rounded-full bg-primary/5" />
        <div className="absolute -inset-6 rounded-full bg-primary/[0.02]" />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-7 text-primary" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -right-2 -top-1 size-2 rounded-full bg-primary/20" />
        <div className="absolute -bottom-2 -left-3 size-1.5 rounded-full bg-primary/15" />
        <div className="absolute -right-4 bottom-1 size-1 rounded-full bg-primary/10" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-2">
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
