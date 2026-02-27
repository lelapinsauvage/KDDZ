"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "teal" | "red";
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const colorMap: Record<string, string> = {
  blue: "border-t-primary/60",
  green: "border-t-emerald-400/60",
  yellow: "border-t-amber-400/60",
  purple: "border-t-violet-400/60",
  teal: "border-t-primary/40",
  red: "border-t-rose-400/60",
};

export function FormSection({
  id,
  title,
  subtitle,
  color = "blue",
  collapsible = false,
  defaultOpen = true,
  badge,
  children,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-border/60 bg-card border-t-4 shadow-sm",
        colorMap[color],
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between border-b bg-muted/50 px-4 py-3 rounded-t-2xl",
          collapsible && "cursor-pointer hover:bg-muted/80",
          !collapsible && "cursor-default",
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        tabIndex={collapsible ? 0 : -1}
      >
        <div className="flex items-center gap-2">
          <div className="border-l-2 border-primary/30 pl-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground" dir="rtl">{subtitle}</p>
            )}
          </div>
          {badge}
        </div>
        {collapsible && (
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              !isOpen && "-rotate-90",
            )}
          />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}
