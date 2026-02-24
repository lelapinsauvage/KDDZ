"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Pencil,
  ShieldCheck,
  FileText,
  GraduationCap,
} from "lucide-react";

interface Props {
  branchId: string;
  branchName: string;
  themeColor?: string | null;
}

const navItems = [
  { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { label: "Classes", href: "classes", icon: GraduationCap },
  { label: "Edit", href: "edit", icon: Pencil },
  { label: "Compliance", href: "compliance", icon: ShieldCheck },
  { label: "Documents", href: "compliance/documents", icon: FileText },
];

export function BranchSubNav({ branchId, themeColor }: Props) {
  const pathname = usePathname();
  const color = themeColor || "#1caf9a";

  const segments = pathname.split("/");
  const activeSegment = segments.slice(3).join("/") || "dashboard";

  return (
    <div className="border-b bg-card px-6">
      <nav className="flex gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const href = `/branches/${branchId}/${item.href}`;
          const isActive = activeSegment === item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-current"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
              style={isActive ? { color, borderColor: color } : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
