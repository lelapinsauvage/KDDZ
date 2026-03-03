"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Users, UserX, SkipForward } from "lucide-react";
import { markBulkAttendance } from "@/lib/actions/attendance";

interface AttendanceChild {
  id: string;
  firstName: string;
  lastName: string;
  classId: string | null;
  className: string | null;
}

interface AttendanceMarkerProps {
  childrenList: AttendanceChild[];
  classes: Array<{ id: string; name: string }>;
  date: string;
  onComplete: () => void;
}

export function AttendanceMarker({
  childrenList: children,
  classes,
  date,
  onComplete,
}: AttendanceMarkerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [classFilter, setClassFilter] = useState("all");
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (classFilter === "all") return children;
    return children.filter((c) => c.classId === classFilter);
  }, [children, classFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceChild[]>();
    for (const child of filtered) {
      const key = child.className ?? "No Class";
      const arr = map.get(key) ?? [];
      arr.push(child);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const presentCount = filtered.filter((c) => !absentIds.has(c.id)).length;
  const absentCount = filtered.filter((c) => absentIds.has(c.id)).length;

  function toggleChild(id: string) {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    startTransition(async () => {
      const result = await markBulkAttendance({
        date,
        absentChildIds: Array.from(absentIds),
      });
      if (result.success) {
        localStorage.setItem(`attendance-marked-${date}`, "true");
        router.refresh();
        onComplete();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
          <CheckSquare className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Mark Attendance</p>
          <p className="text-[11px] text-muted-foreground">
            Uncheck absent children, then confirm
          </p>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="text-xs text-muted-foreground"
        >
          <SkipForward className="mr-1 size-3" />
          Skip
        </Button>
      </div>

      {/* Grid */}
      <div className="border-t border-border/30 px-5 pb-4 pt-3">
        <div className="space-y-4">
          {grouped.map(([className, kids]) => (
            <div key={className}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {className}
              </p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {kids.map((child) => {
                  const isAbsent = absentIds.has(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                        isAbsent
                          ? "bg-rose-50 ring-1 ring-rose-200"
                          : "bg-muted/40 hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className={`flex size-5 items-center justify-center rounded-md text-[10px] font-bold ${
                          isAbsent
                            ? "border border-rose-300 bg-white text-rose-300"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {!isAbsent && "✓"}
                      </div>
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {child.firstName.charAt(0)}
                        {child.lastName.charAt(0)}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isAbsent ? "text-rose-700" : "text-foreground"
                        }`}
                      >
                        {child.firstName} {child.lastName}
                      </span>
                      {isAbsent && (
                        <Badge className="ml-auto bg-rose-100 text-rose-700 border-0 text-[10px] px-1.5 py-0">
                          Absent
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-[#059669]">
              <Users className="size-3.5" />
              {presentCount} present
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <UserX className="size-3.5" />
              {absentCount} absent
            </span>
          </div>
          <Button onClick={handleConfirm} disabled={isPending} size="sm" className="rounded-xl">
            {isPending ? "Marking..." : "Confirm Attendance"}
          </Button>
        </div>
      </div>
    </div>
  );
}
