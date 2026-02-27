"use server";

import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";

export interface SearchResult {
  type: "child" | "teacher" | "nurse" | "doctor" | "manager";
  id: string;
  name: string;
  description: string;
  href: string;
}

export interface GlobalSearchResult {
  children: SearchResult[];
  employees: SearchResult[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const { organizationId: orgId } = await requireOrg();

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { children: [], employees: [] };
  }

  const nameFilter = {
    OR: [
      { firstName: { contains: trimmed, mode: "insensitive" as const } },
      { lastName: { contains: trimmed, mode: "insensitive" as const } },
    ],
  };

  const [children, teachers, nurses, doctors, managers] = await Promise.all([
    db.child.findMany({
      where: { ...nameFilter, branch: { organizationId: orgId } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
      },
      take: 5,
    }),
    db.teacher.findMany({
      where: { ...nameFilter, branch: { organizationId: orgId } },
      select: { id: true, firstName: true, lastName: true },
      take: 3,
    }),
    db.nurse.findMany({
      where: { ...nameFilter, branch: { organizationId: orgId } },
      select: { id: true, firstName: true, lastName: true },
      take: 3,
    }),
    db.doctor.findMany({
      where: { ...nameFilter, branch: { organizationId: orgId } },
      select: { id: true, firstName: true, lastName: true },
      take: 3,
    }),
    db.manager.findMany({
      where: { ...nameFilter, branch: { organizationId: orgId } },
      select: { id: true, firstName: true, lastName: true },
      take: 3,
    }),
  ]);

  return {
    children: children.map((c) => ({
      type: "child" as const,
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      description: c.class?.name || "No class",
      href: `/children/${c.id}`,
    })),
    employees: [
      ...teachers.map((t) => ({
        type: "teacher" as const,
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        description: "Teacher",
        href: `/employees/teachers/${t.id}`,
      })),
      ...nurses.map((n) => ({
        type: "nurse" as const,
        id: n.id,
        name: `${n.firstName} ${n.lastName}`,
        description: "Nurse",
        href: `/employees/nurses/${n.id}`,
      })),
      ...doctors.map((d) => ({
        type: "doctor" as const,
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        description: "Doctor",
        href: `/employees/doctors/${d.id}`,
      })),
      ...managers.map((m) => ({
        type: "manager" as const,
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        description: "Manager",
        href: `/employees/managers/${m.id}`,
      })),
    ],
  };
}
