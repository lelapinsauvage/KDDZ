"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  ShieldAlert,
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
  { label: "Edit Profile", href: "", icon: UserPen },
  { label: "Attendance", href: "attendance", icon: Calendar },
  { label: "Absence", href: "absence", icon: AlertTriangle },
  { label: "Accidents", href: "accidents", icon: ShieldAlert },
  { label: "Accounting", href: "accounting", icon: DollarSign },
  { label: "Calls", href: "calls", icon: Phone },
  { label: "Reports", href: "report", icon: FileText },
];

export function ChildSubNav({ childId }: Props) {
  const pathname = usePathname();

  // Determine which segment is active
  const segments = pathname.split("/");
  // pathname = /children/{id}/dashboard → segments = ["", "children", "{id}", "dashboard"]
  const activeSegment = segments[3] ?? "";

  return (
    <div className="border-b bg-white px-6">
      <nav className="flex gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const href = `/children/${childId}${item.href ? `/${item.href}` : ""}`;
          const isActive = activeSegment === item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-[#1caf9a] text-[#1caf9a]"
                  : "border-transparent text-[#6f7b8a] hover:border-gray-300 hover:text-[#333]"
              )}
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
