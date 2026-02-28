"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  /** @deprecated Color accents removed in redesign. Prop kept for compatibility. */
  color?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function FormSection({
  id,
  title,
  subtitle,
  collapsible = false,
  defaultOpen = true,
  badge,
  children,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = id ? `${id}-content` : undefined;

  return (
    <div
      id={id}
      className="rounded-lg border border-border bg-card shadow-sm"
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between px-5 py-3.5 rounded-t-lg",
          isOpen && "border-b border-border",
          collapsible && "cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !collapsible && "cursor-default",
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        tabIndex={collapsible ? 0 : -1}
        aria-expanded={collapsible ? isOpen : undefined}
        aria-controls={collapsible ? contentId : undefined}
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-heading text-base font-bold tracking-tight text-foreground text-left">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-[0.8125rem] leading-5 text-muted-foreground text-right" dir="rtl">
                {subtitle}
              </p>
            )}
          </div>
          {badge}
        </div>
        {collapsible && (
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
        )}
      </button>
      {isOpen && <div id={contentId} className="p-5">{children}</div>}
    </div>
  );
}
