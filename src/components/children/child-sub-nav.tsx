"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Stethoscope,
  DollarSign,
  Phone,
  FileText,
  UserPen,
} from "lucide-react";

interface Props {
  childId: string;
  childName: string;
}

const navItems = [
  { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { label: "Edit Profile", href: "edit", icon: UserPen },
  { label: "Attendance", href: "attendance", icon: Calendar },
  { label: "Absence", href: "absence", icon: AlertTriangle },
  { label: "Accidents", href: "accidents", icon: ShieldAlert },
  { label: "Medical", href: "medical", icon: Stethoscope },
  { label: "Accounting", href: "accounting", icon: DollarSign },
  { label: "Calls", href: "calls", icon: Phone },
  { label: "Reports", href: "report", icon: FileText },
];

export function ChildSubNav({ childId, childName }: Props) {
  const pathname = usePathname();

  // Determine which segment is active
  const segments = pathname.split("/");
  // pathname = /children/{id}/dashboard → segments = ["", "children", "{id}", "dashboard"]
  const activeSegment = segments[3] ?? "";

  return (
    <div className="border-b bg-white">
      {/* Child name breadcrumb */}
      <div className="flex items-center gap-2 px-6 pt-3 pb-1">
        <Link href="/children" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Children
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium text-foreground">{childName}</span>
      </div>
      <nav className="flex gap-0.5 overflow-x-auto px-6">
        {navItems.map((item) => {
          const href = `/children/${childId}${item.href ? `/${item.href}` : ""}`;
          const isActive = activeSegment === item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
